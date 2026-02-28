import { cities, type ProjectRecord, type SourceMeta } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

type GenericRecord = Record<string, unknown>;

function isRecord(value: unknown): value is GenericRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(value: unknown): GenericRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

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

function pickString(record: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function pickNumber(record: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function flattenRecord(record: GenericRecord) {
  const flattened: GenericRecord = { ...record };
  if (isRecord(record.properties)) {
    Object.assign(flattened, record.properties);
  }

  return flattened;
}

function extractRecords(payload: unknown): GenericRecord[] {
  if (Array.isArray(payload)) {
    return asRecordArray(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const nested = [
    payload.records,
    payload.data,
    payload.items,
    payload.features,
    isRecord(payload.result) ? payload.result.records : undefined,
    isRecord(payload.result) ? payload.result.data : undefined,
    isRecord(payload.result) ? payload.result.items : undefined,
    isRecord(payload.result) ? payload.result.features : undefined,
    isRecord(payload.response) ? payload.response.records : undefined,
    isRecord(payload.response) ? payload.response.data : undefined
  ];

  for (const candidate of nested) {
    const records = asRecordArray(candidate);
    if (records.length > 0) {
      return records.map(flattenRecord);
    }
  }

  return [flattenRecord(payload)];
}

function inferCitySlug(text: string, directCity?: string) {
  const haystack = text.toLowerCase();
  const direct = cleanText(directCity, "").toLowerCase();
  const matched = cities.find((city) => {
    const variants = [city.slug, city.name.en, city.name.th].map((value) => value.toLowerCase());
    return variants.some((value) => haystack.includes(value) || (direct && direct.includes(value)));
  });

  if (matched) {
    return matched.slug;
  }

  if (direct) {
    return slugify(direct, "national");
  }

  return "national";
}

function inferDomainSlug(text: string): ProjectRecord["domainSlug"] {
  const haystack = text.toLowerCase();
  const domainMap: Array<{ slug: ProjectRecord["domainSlug"]; keywords: string[] }> = [
    { slug: "environment", keywords: ["environment", "air", "water", "flood", "waste", "climate", "pm2", "disaster"] },
    { slug: "economy", keywords: ["economy", "economic", "finance", "tourism", "investment", "trade"] },
    { slug: "mobility", keywords: ["mobility", "traffic", "transport", "transit", "road", "rail"] },
    { slug: "energy", keywords: ["energy", "power", "electric", "solar", "grid", "utility"] },
    { slug: "people", keywords: ["people", "community", "education", "skills", "talent"] },
    { slug: "living", keywords: ["living", "health", "safety", "hospital", "livability", "housing"] },
    { slug: "governance", keywords: ["governance", "government", "service", "policy", "administration", "digital"] }
  ];

  const matched = domainMap.find((entry) => entry.keywords.some((keyword) => haystack.includes(keyword)));
  return matched?.slug ?? "governance";
}

function inferStatus(rawStatus: string | undefined): ProjectRecord["status"] {
  const value = cleanText(rawStatus, "").toLowerCase();
  if (!value) {
    return "watch";
  }
  if (/(active|operat|progress|ongoing|ดำเนิน|เปิดใช้)/.test(value)) {
    return "active";
  }
  if (/(delay|risk|issue|blocked|ล่าช้า)/.test(value)) {
    return "delayed";
  }
  if (/(plan|pipeline|propos|เตรียม|แผน)/.test(value)) {
    return "planned";
  }

  return "watch";
}

function createSourceMeta(sourceUrl: string, publishedAt: string): SourceMeta {
  return {
    sourceName: "Open Government Data Thailand",
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    publishedAt,
    freshnessStatus: "live",
    confidence: 0.74,
    fallbackMode: "live"
  };
}

function createProjectRecord(record: GenericRecord, index: number): ProjectRecord | null {
  const title = cleanText(
    pickString(record, [
      "title",
      "name",
      "project_name",
      "project",
      "projectTitle",
      "dataset_name",
      "title_en",
      "title_th",
      "ชื่อโครงการ",
      "ชื่อ",
      "หัวข้อ"
    ]),
    ""
  );

  if (!title) {
    return null;
  }

  const summary = cleanText(
    pickString(record, [
      "summary",
      "description",
      "detail",
      "notes",
      "remark",
      "รายละเอียด",
      "คำอธิบาย"
    ]),
    "Configured data.go.th dataset record normalized into a live project watch."
  );
  const owner = cleanText(
    pickString(record, ["owner", "agency", "organization", "department", "หน่วยงาน"]),
    "Open Government Data Thailand"
  );
  const directCity = pickString(record, ["city", "city_name", "province", "จังหวัด", "location"]);
  const sourceUrl = cleanText(
    pickString(record, ["url", "link", "resource_url", "permalink"]),
    config.dataGoThEndpoint || "https://data.go.th"
  );
  const updatedAtInput = pickString(record, [
    "updated_at",
    "last_updated",
    "metadata_modified",
    "published_at",
    "date",
    "วันที่"
  ]);
  const updatedAtMs = updatedAtInput ? Date.parse(updatedAtInput) : Number.NaN;
  const updatedAt = Number.isNaN(updatedAtMs) ? new Date().toISOString() : new Date(updatedAtMs).toISOString();
  const completionRaw = pickNumber(record, [
    "completion_percent",
    "progress_percent",
    "progress",
    "percent",
    "เปอร์เซ็นต์",
    "pct"
  ]);
  const completionPercent = Math.max(0, Math.min(100, Math.round(completionRaw ?? 48)));
  const status = inferStatus(pickString(record, ["status", "state", "project_status", "สถานะ"]));
  const citySlug = inferCitySlug(`${title} ${summary} ${directCity ?? ""}`, directCity);
  const domainSlug = inferDomainSlug(`${title} ${summary}`);

  return {
    id: `data-go-th-project-${index}`,
    slug: slugify(title, `data-go-th-project-${index}`),
    title: { th: title, en: title },
    citySlug,
    domainSlug,
    status,
    completionPercent,
    owner: { th: owner, en: owner },
    summary: { th: summary, en: summary },
    nextMilestone: {
      th: "ตรวจสอบ resource และเชื่อมข้อมูลสดต่อเนื่อง",
      en: "Validate the dataset resource and keep the live connector in sync."
    },
    updatedAt,
    source: createSourceMeta(sourceUrl, updatedAt)
  };
}

export async function syncDataGoTh() {
  const payload = await fetchJsonOrNull<unknown>(config.dataGoThEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "data-go-th",
      status: config.dataGoThEndpoint ? "stale" : "manual",
      message: config.dataGoThEndpoint
        ? "Configured data.go.th endpoint failed, using dataset-registry fallback."
        : "Configure a dataset-specific data.go.th endpoint to enable live pulls.",
      sourceUrl: "https://data.go.th"
    });
  }

  const records = extractRecords(payload);
  const projectRecords = records
    .map((record, index) => createProjectRecord(record, index))
    .filter((item): item is ProjectRecord => Boolean(item))
    .slice(0, 8);

  if (projectRecords.length === 0) {
    return buildResult({
      sourceId: "data-go-th",
      status: "stale",
      message: "data.go.th endpoint responded, but no recognizable project rows were normalized.",
      sourceUrl: config.dataGoThEndpoint || "https://data.go.th"
    });
  }

  return buildResult({
    sourceId: "data-go-th",
    status: "live",
    message: `Imported ${projectRecords.length} data.go.th project rows from the configured endpoint.`,
    sourceUrl: config.dataGoThEndpoint || "https://data.go.th",
    projectRecords
  });
}
