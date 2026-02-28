import type { NewsItem } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface GdeltArticle {
  title?: string;
  url?: string;
  domain?: string;
  seendate?: string;
  socialimage?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

const stopWords = new Set([
  "smart",
  "city",
  "thailand",
  "about",
  "after",
  "before",
  "their",
  "where",
  "which",
  "from",
  "into",
  "with",
  "this",
  "that",
  "will",
  "your",
  "have",
  "been",
  "more",
  "than",
  "into",
  "news"
]);

function cleanText(value: string | undefined, fallback: string) {
  const raw = (value ?? fallback)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return raw || fallback;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

function inferCity(text: string) {
  const source = text.toLowerCase();
  if (source.includes("bangkok")) return "bangkok";
  if (source.includes("phuket")) return "phuket";
  if (source.includes("chiang mai")) return "chiang-mai";
  if (source.includes("khon kaen")) return "khon-kaen";
  return undefined;
}

function inferDomain(text: string) {
  const source = text.toLowerCase();
  if (/(environment|climate|air|flood|water|disaster)/.test(source)) return "environment";
  if (/(mobility|traffic|transit|transport|road)/.test(source)) return "mobility";
  if (/(economy|investment|industry|tourism|trade)/.test(source)) return "economy";
  if (/(energy|power|grid|solar)/.test(source)) return "energy";
  if (/(people|education|skills|community)/.test(source)) return "people";
  if (/(living|health|safety|livability)/.test(source)) return "living";
  if (/(governance|policy|data|government|digital)/.test(source)) return "governance";
  return undefined;
}

function scoreTone(text: string) {
  const source = text.toLowerCase();
  let score = 0;
  const positive = ["improve", "launch", "expand", "advance", "boost", "growth", "progress"];
  const negative = ["risk", "delay", "crisis", "flood", "smog", "warning", "decline"];

  positive.forEach((term) => {
    if (source.includes(term)) score += 1;
  });
  negative.forEach((term) => {
    if (source.includes(term)) score -= 1;
  });

  return Math.max(-100, Math.min(100, score * 18));
}

function extractTopTerms(values: string[]) {
  const counts = new Map<string, number>();
  values
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word))
    .forEach((word) => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export async function syncGdeltSignals() {
  const payload = await fetchJsonOrNull<GdeltResponse>(config.gdeltDocEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "gdelt-signals",
      status: config.gdeltDocEndpoint ? "stale" : "manual",
      message: config.gdeltDocEndpoint
        ? "GDELT signals are unavailable right now. Keeping the cached external narrative."
        : "Set a GDELT endpoint to enable live global media monitoring.",
      sourceUrl: "https://api.gdeltproject.org/api/v2/doc/doc"
    });
  }

  const articles = (payload.articles ?? [])
    .filter((article) => article.title && article.url)
    .slice(0, 6);

  if (articles.length === 0) {
    return buildResult({
      sourceId: "gdelt-signals",
      status: "stale",
      message: "GDELT responded but returned no matching article list items.",
      sourceUrl: config.gdeltDocEndpoint
    });
  }

  const newsItems: NewsItem[] = articles.map((article, index) => {
    const title = cleanText(article.title, `GDELT signal ${index + 1}`);
    const publishedAt = article.seendate ? new Date(article.seendate).toISOString() : new Date().toISOString();
    const excerpt = article.domain
      ? `Global media signal captured from ${article.domain}.`
      : "Global media signal captured from GDELT.";

    return {
      id: `gdelt-news-${index}`,
      slug: slugify(title, `gdelt-news-${index}`),
      title: { th: title, en: title },
      excerpt: { th: excerpt, en: excerpt },
      kind: "external",
      citySlug: inferCity(`${title} ${excerpt}`),
      domainSlug: inferDomain(`${title} ${excerpt}`),
      publishedAt,
      source: {
        sourceName: "GDELT Signals",
        sourceUrl: article.url,
        fetchedAt: new Date().toISOString(),
        publishedAt,
        freshnessStatus: "live",
        confidence: 0.74,
        fallbackMode: "live"
      }
    };
  });

  const toneScores = articles.map((article) => scoreTone(`${article.title ?? ""} ${article.domain ?? ""}`));
  const sentimentScore = Math.round(
    toneScores.reduce((sum, score) => sum + score, 0) / Math.max(toneScores.length, 1)
  );
  const positiveShare =
    toneScores.filter((score) => score >= 0).length / Math.max(toneScores.length, 1);
  const domains = new Set(articles.map((article) => cleanText(article.domain, "")).filter(Boolean));
  const topTerms = extractTopTerms(articles.map((article) => cleanText(article.title, "")));

  return buildResult({
    sourceId: "gdelt-signals",
    status: "live",
    message: `Imported ${newsItems.length} GDELT media signals across ${domains.size || 1} source domains.`,
    sourceUrl: config.gdeltDocEndpoint,
    newsItems,
    socialSignal: {
      mentionCount: newsItems.length,
      sentimentScore,
      sourceCount: domains.size || 1,
      positiveShare,
      dominantSource: "GDELT Signals",
      topTerms,
      sourceName: "GDELT Signals"
    }
  });
}
