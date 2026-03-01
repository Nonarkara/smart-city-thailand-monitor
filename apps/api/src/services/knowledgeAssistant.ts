import { execFile as execFileCallback } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { promisify } from "node:util";
import type {
  AssistantQueryRequest,
  AssistantResponse,
  AssistantStatus,
  KnowledgeCitation,
  Locale,
  LocalizedText
} from "@smart-city/shared";
import { config } from "../config.js";

const execFile = promisify(execFileCallback);
const INDEX_TTL_MS = 10 * 60 * 1000;
const MAX_SNIPPET_LENGTH = 280;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "been",
  "into",
  "city",
  "cities",
  "smart",
  "thailand",
  "their",
  "about",
  "your",
  "what",
  "which",
  "when",
  "where",
  "they",
  "them",
  "will",
  "would",
  "should",
  "could",
  "also",
  "using",
  "used"
]);

interface IndexedChunk {
  id: string;
  documentTitle: string;
  fileName: string;
  pageLabel?: string;
  text: string;
}

interface KnowledgeIndex {
  available: boolean;
  documentCount: number;
  indexedAt?: string;
  knowledgeDir?: string;
  chunks: IndexedChunk[];
}

let cachedIndex: KnowledgeIndex | null = null;
let cachedIndexBuiltAt = 0;

function localized(th: string, en: string): LocalizedText {
  return { th, en };
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

async function canRead(path: string) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveKnowledgeDir() {
  const candidates = [
    config.knowledgeDir,
    resolve(process.cwd(), "Knowledge"),
    resolve(process.cwd(), "knowledge")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await canRead(candidate)) {
      return candidate;
    }
  }

  return "";
}

function extractPrintableStrings(value: Buffer) {
  const matches = value
    .toString("latin1")
    .match(/[\x20-\x7E][\x20-\x7E\r\n\t]{24,}/g);

  return normalizeWhitespace((matches ?? []).join(" "));
}

async function extractPdfPages(filePath: string) {
  try {
    const { stdout } = await execFile("pdftotext", ["-enc", "UTF-8", "-layout", filePath, "-"], {
      maxBuffer: 20 * 1024 * 1024
    });
    const pages = stdout
      .split("\f")
      .map((page) => normalizeWhitespace(page))
      .filter(Boolean);

    if (pages.length > 0) {
      return pages;
    }
  } catch {
    // Fall through to a printable-string fallback when pdftotext is unavailable.
  }

  const buffer = await readFile(filePath);
  const fallbackText = extractPrintableStrings(buffer);
  return fallbackText ? [fallbackText] : [];
}

async function extractFilePages(filePath: string) {
  const extension = extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return extractPdfPages(filePath);
  }

  const text = normalizeWhitespace(await readFile(filePath, "utf8"));
  return text ? [text] : [];
}

function chunkPageText(fileName: string, documentTitle: string, pageText: string, pageNumber: number) {
  const paragraphs = pageText
    .split(/\s{2,}|(?<=\.)\s+/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  const chunks: IndexedChunk[] = [];
  let current = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const nextValue = current ? `${current} ${paragraph}` : paragraph;

    if (nextValue.length > 900 && current) {
      chunkIndex += 1;
      chunks.push({
        id: `${fileName}-${pageNumber}-${chunkIndex}`,
        fileName,
        documentTitle,
        pageLabel: `p.${pageNumber}`,
        text: current
      });
      current = paragraph;
      continue;
    }

    current = nextValue;
  }

  if (current) {
    chunkIndex += 1;
    chunks.push({
      id: `${fileName}-${pageNumber}-${chunkIndex}`,
      fileName,
      documentTitle,
      pageLabel: `p.${pageNumber}`,
      text: current
    });
  }

  return chunks;
}

async function buildKnowledgeIndex(): Promise<KnowledgeIndex> {
  const knowledgeDir = await resolveKnowledgeDir();
  if (!knowledgeDir) {
    return {
      available: false,
      documentCount: 0,
      chunks: []
    };
  }

  const entries = (await readdir(knowledgeDir))
    .filter((entry) => [".pdf", ".txt", ".md"].includes(extname(entry).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));

  const allChunks: IndexedChunk[] = [];

  for (const entry of entries) {
    const filePath = resolve(knowledgeDir, entry);
    const pages = await extractFilePages(filePath);
    const documentTitle = basename(entry, extname(entry));

    pages.forEach((page, index) => {
      allChunks.push(...chunkPageText(entry, documentTitle, page, index + 1));
    });
  }

  return {
    available: entries.length > 0 && allChunks.length > 0,
    documentCount: entries.length,
    indexedAt: new Date().toISOString(),
    knowledgeDir,
    chunks: allChunks
  };
}

async function getKnowledgeIndex(forceRefresh = false) {
  if (!forceRefresh && cachedIndex && Date.now() - cachedIndexBuiltAt < INDEX_TTL_MS) {
    return cachedIndex;
  }

  cachedIndex = await buildKnowledgeIndex();
  cachedIndexBuiltAt = Date.now();
  return cachedIndex;
}

function summarizeContext(input: AssistantQueryRequest["context"]) {
  const parts = [
    input.view ? `view ${input.view}` : "",
    input.cityName ? `city ${input.cityName}` : "",
    input.domainLabel ? `domain ${input.domainLabel}` : "",
    input.activeLayers.length > 0 ? `layers ${input.activeLayers.join(", ")}` : "",
    input.executiveSignal ? `alert ${input.executiveSignal}` : ""
  ].filter(Boolean);

  if (parts.length === 0) {
    return localized("บริบทปัจจุบัน: ไม่มีตัวกรองเพิ่มเติม", "Current view: no extra filters applied.");
  }

  return localized(
    `บริบทปัจจุบัน: ${parts.join(" | ")}`,
    `Current view: ${parts.join(" | ")}.`
  );
}

function scoreChunk(chunk: IndexedChunk, terms: string[]) {
  if (terms.length === 0) {
    return 0;
  }

  const haystack = `${chunk.documentTitle} ${chunk.text}`.toLowerCase();
  const uniqueTerms = [...new Set(terms)];

  return uniqueTerms.reduce((score, term) => {
    if (!haystack.includes(term)) {
      return score;
    }

    const docBoost = chunk.documentTitle.toLowerCase().includes(term) ? 4 : 0;
    const matchCount = Math.max(1, haystack.split(term).length - 1);
    return score + 6 + docBoost + Math.min(matchCount, 3);
  }, 0);
}

function bestExcerpt(chunk: IndexedChunk, terms: string[]) {
  const sentences = chunk.text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);

  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: terms.reduce(
        (sum, term) => sum + (sentence.toLowerCase().includes(term) ? 1 : 0),
        0
      )
    }))
    .sort((left, right) => right.score - left.score);

  const excerpt = ranked[0]?.sentence ?? chunk.text;
  return excerpt.length > MAX_SNIPPET_LENGTH ? `${excerpt.slice(0, MAX_SNIPPET_LENGTH - 1)}…` : excerpt;
}

function buildCitations(chunks: IndexedChunk[], terms: string[]): KnowledgeCitation[] {
  return chunks.map((chunk) => {
    const score = scoreChunk(chunk, terms);

    return {
      id: chunk.id,
      documentTitle: chunk.documentTitle,
      fileName: chunk.fileName,
      excerpt: bestExcerpt(chunk, terms),
      pageLabel: chunk.pageLabel,
      score
    };
  });
}

function buildAnswer(
  locale: Locale,
  question: string,
  contextSummary: LocalizedText,
  citations: KnowledgeCitation[],
  knowledgeAvailable: boolean
) {
  if (!knowledgeAvailable) {
    return localized(
      `${contextSummary.th} ระบบผู้ช่วยยังไม่พบข้อความที่อ่านได้จากโฟลเดอร์ Knowledge ในเครื่องนี้ จึงยังตอบได้เฉพาะจากบริบทปัจจุบันเท่านั้น`,
      `${contextSummary.en} The assistant cannot read any indexed material from the local Knowledge folder on this machine yet, so it can only reflect the current view.`
    );
  }

  if (citations.length === 0) {
    return localized(
      `${contextSummary.th} ยังไม่พบข้อความที่ตรงกับคำถาม “${question}” มากพอ ลองระบุชื่อเมือง มิติ หรือประเด็นเฉพาะให้แคบลง`,
      `${contextSummary.en} No strong match was found for “${question}”. Try a narrower prompt using a city name, a domain, or a specific policy issue.`
    );
  }

  const lead = citations[0];
  const supporting = citations.slice(1, 3);
  const supportTextEn = supporting.length
    ? ` Supporting references include ${supporting
        .map((citation) => `${citation.documentTitle}${citation.pageLabel ? ` ${citation.pageLabel}` : ""}`)
        .join(" and ")}.`
    : "";
  const supportTextTh = supporting.length
    ? ` เอกสารสนับสนุนเพิ่มเติมคือ ${supporting
        .map((citation) => `${citation.documentTitle}${citation.pageLabel ? ` ${citation.pageLabel}` : ""}`)
        .join(" และ ")}`
    : "";

  const answer = localized(
    `${contextSummary.th} เอกสารที่เกี่ยวข้องที่สุดคือ ${lead.documentTitle}${lead.pageLabel ? ` ${lead.pageLabel}` : ""} ซึ่งกล่าวว่า: ${lead.excerpt}.${supportTextTh}`,
    `${contextSummary.en} The strongest local match is ${lead.documentTitle}${lead.pageLabel ? ` ${lead.pageLabel}` : ""}. It points to this: ${lead.excerpt}.${supportTextEn}`
  );

  return locale === "th" ? { th: answer.th, en: answer.en } : answer;
}

export async function getAssistantStatus(forceRefresh = false): Promise<AssistantStatus> {
  const index = await getKnowledgeIndex(forceRefresh);

  return {
    available: index.available,
    documentCount: index.documentCount,
    indexedAt: index.indexedAt,
    knowledgeDir: index.knowledgeDir,
    geminiReady: Boolean(config.geminiApiKey)
  };
}

export async function queryAssistant(input: AssistantQueryRequest): Promise<AssistantResponse> {
  const locale = input.locale ?? "en";
  const index = await getKnowledgeIndex();
  const contextSummary = summarizeContext(input.context);
  const contextTokens = [
    input.context.cityName,
    input.context.domainLabel,
    input.context.executiveSignal,
    ...(input.context.watchpoints ?? []),
    ...input.context.activeLayers
  ]
    .filter(Boolean)
    .join(" ");
  const terms = tokenize(`${input.question} ${contextTokens}`);
  const rankedChunks = [...index.chunks]
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, terms)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((item) => item.chunk);
  const citations = buildCitations(rankedChunks, terms);

  return {
    answer: buildAnswer(locale, input.question, contextSummary, citations, index.available),
    contextSummary,
    citations,
    provider: "local-rag",
    generatedAt: new Date().toISOString(),
    knowledgeAvailable: index.available,
    documentCount: index.documentCount,
    geminiReady: Boolean(config.geminiApiKey)
  };
}
