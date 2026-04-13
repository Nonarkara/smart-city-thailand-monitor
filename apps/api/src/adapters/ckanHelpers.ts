import { cities, domains, type NewsItem, type ProjectRecord, type SourceMeta } from "@smart-city/shared";

export interface CkanTag {
  name?: string;
  display_name?: string;
}

export interface CkanResource {
  id?: string;
  name?: string;
  format?: string;
  url?: string;
  description?: string;
}

export interface CkanPackage {
  id?: string;
  name?: string;
  title?: string;
  notes?: string;
  metadata_modified?: string;
  url?: string;
  tags?: CkanTag[];
  resources?: CkanResource[];
  organization?: { title?: string; name?: string };
}

export interface CkanPackageSearchResponse {
  success?: boolean;
  result?: {
    count?: number;
    results?: CkanPackage[];
  };
}

export function cleanCkanText(value: string | undefined, fallback: string): string {
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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function inferCitySlug(text: string): string | null {
  const haystack = text.toLowerCase();
  return (
    cities.find(
      (city) =>
        haystack.includes(city.slug.toLowerCase()) ||
        haystack.includes(city.name.en.toLowerCase()) ||
        haystack.includes(city.name.th.toLowerCase())
    )?.slug ?? null
  );
}

const DOMAIN_KEYWORDS: Array<{ slug: ProjectRecord["domainSlug"]; keywords: string[] }> = [
  { slug: "environment", keywords: ["environment", "air", "water", "flood", "pm2", "waste", "climate", "สิ่งแวดล้อม", "น้ำ", "อากาศ"] },
  { slug: "economy", keywords: ["economy", "economic", "tourism", "investment", "business", "เศรษฐกิจ", "ท่องเที่ยว", "การค้า"] },
  { slug: "mobility", keywords: ["mobility", "transport", "traffic", "transit", "road", "travel", "คมนาคม", "จราจร", "ขนส่ง"] },
  { slug: "energy", keywords: ["energy", "power", "electric", "solar", "grid", "พลังงาน", "ไฟฟ้า"] },
  { slug: "people", keywords: ["people", "education", "skill", "community", "participation", "การศึกษา", "ชุมชน", "ประชาชน"] },
  { slug: "living", keywords: ["living", "health", "safety", "livability", "service", "สุขภาพ", "ความปลอดภัย", "บริการ"] },
  { slug: "governance", keywords: ["governance", "government", "open data", "policy", "administration", "ราชการ", "นโยบาย", "ข้อมูลเปิด"] }
];

export function inferDomainSlug(pkg: CkanPackage, text: string): ProjectRecord["domainSlug"] {
  const haystack = `${text} ${(pkg.tags ?? []).map((t) => `${t.name ?? ""} ${t.display_name ?? ""}`).join(" ")}`.toLowerCase();
  const matched = DOMAIN_KEYWORDS.find((entry) => entry.keywords.some((kw) => haystack.includes(kw)));
  return matched?.slug ?? domains[0]?.slug ?? "environment";
}

export function createSourceMeta(
  sourceName: string,
  sourceUrl: string,
  publishedAt: string,
  confidence: number
): SourceMeta {
  return {
    sourceName,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    publishedAt,
    freshnessStatus: "live",
    confidence,
    fallbackMode: "live"
  };
}

export function ckanPackageToNewsItem(
  pkg: CkanPackage,
  index: number,
  sourcePrefix: string,
  sourceName: string,
  sourceBaseUrl: string,
  confidence: number
): NewsItem {
  const title = cleanCkanText(pkg.title ?? pkg.name, `${sourceName} dataset ${index + 1}`);
  const excerpt = cleanCkanText(pkg.notes, `Open data from ${sourceName}.`);
  const publishedAt = pkg.metadata_modified ? new Date(pkg.metadata_modified).toISOString() : new Date().toISOString();
  const sourceUrl = pkg.url || sourceBaseUrl;
  const citySlug = inferCitySlug(`${title} ${excerpt}`) ?? undefined;

  return {
    id: `${sourcePrefix}-news-${pkg.id ?? index}`,
    slug: slugify(`${sourcePrefix}-${pkg.name ?? pkg.title ?? index}`),
    title: { th: title, en: title },
    excerpt: { th: excerpt, en: excerpt },
    kind: "external",
    citySlug,
    domainSlug: inferDomainSlug(pkg, `${title} ${excerpt}`),
    publishedAt,
    source: createSourceMeta(sourceName, sourceUrl, publishedAt, confidence)
  };
}

export function ckanPackageToProject(
  pkg: CkanPackage,
  index: number,
  sourcePrefix: string,
  sourceName: string,
  sourceBaseUrl: string,
  confidence: number
): ProjectRecord | null {
  const title = cleanCkanText(pkg.title ?? pkg.name, `${sourceName} project ${index + 1}`);
  const summary = cleanCkanText(pkg.notes, `Open data record from ${sourceName}.`);
  const citySlug = inferCitySlug(`${title} ${summary}`);
  if (!citySlug) return null;

  const updatedAt = pkg.metadata_modified ? new Date(pkg.metadata_modified).toISOString() : new Date().toISOString();
  const sourceUrl = pkg.url || sourceBaseUrl;

  return {
    id: `${sourcePrefix}-project-${pkg.id ?? index}`,
    slug: slugify(`${sourcePrefix}-project-${pkg.name ?? pkg.title ?? index}`),
    title: { th: title, en: title },
    citySlug,
    domainSlug: inferDomainSlug(pkg, `${title} ${summary}`),
    status: "watch",
    completionPercent: 50,
    owner: { th: sourceName, en: sourceName },
    summary: { th: summary, en: summary },
    nextMilestone: {
      th: "ตรวจสอบ resource endpoint และเชื่อมต่อข้อมูลสด",
      en: "Validate resource endpoints and connect live data feed."
    },
    updatedAt,
    source: createSourceMeta(sourceName, sourceUrl, updatedAt, confidence)
  };
}
