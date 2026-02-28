import {
  cities,
  domains,
  mapFeatureCollections,
  type MapFeatureCollection,
  type NewsItem,
  type ProjectRecord,
  type SourceMeta
} from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface CkanTag {
  name?: string;
  display_name?: string;
}

interface CkanPackage {
  id?: string;
  name?: string;
  title?: string;
  notes?: string;
  metadata_modified?: string;
  url?: string;
  tags?: CkanTag[];
}

interface CkanPackageSearchResponse {
  success?: boolean;
  result?: {
    count?: number;
    results?: CkanPackage[];
  };
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function createSourceMeta(sourceUrl: string, publishedAt: string): SourceMeta {
  return {
    sourceName: "CityData Thailand",
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    publishedAt,
    freshnessStatus: "live",
    confidence: 0.76,
    fallbackMode: "live"
  };
}

function inferCitySlug(text: string) {
  const haystack = text.toLowerCase();

  return (
    cities.find((city) => {
      return (
        haystack.includes(city.slug.toLowerCase()) ||
        haystack.includes(city.name.en.toLowerCase()) ||
        haystack.includes(city.name.th.toLowerCase())
      );
    })?.slug ?? null
  );
}

function inferDomainSlug(pkg: CkanPackage, text: string) {
  const haystack = `${text} ${(pkg.tags ?? []).map((tag) => `${tag.name ?? ""} ${tag.display_name ?? ""}`).join(" ")}`.toLowerCase();
  const tagMap: Array<{ slug: ProjectRecord["domainSlug"]; keywords: string[] }> = [
    { slug: "environment", keywords: ["environment", "air", "water", "flood", "pm2", "waste", "climate"] },
    { slug: "economy", keywords: ["economy", "economic", "tourism", "investment", "business"] },
    { slug: "mobility", keywords: ["mobility", "transport", "traffic", "transit", "road", "travel"] },
    { slug: "energy", keywords: ["energy", "power", "electric", "solar", "grid"] },
    { slug: "people", keywords: ["people", "education", "skill", "community", "participation"] },
    { slug: "living", keywords: ["living", "health", "safety", "livability", "service"] },
    { slug: "governance", keywords: ["governance", "government", "open data", "policy", "administration"] }
  ];

  const matched = tagMap.find((entry) => entry.keywords.some((keyword) => haystack.includes(keyword)));
  return matched?.slug ?? domains[0]?.slug ?? "environment";
}

function createNewsItem(pkg: CkanPackage, index: number): NewsItem {
  const title = cleanText(pkg.title ?? pkg.name, `CityData smart city signal ${index + 1}`);
  const excerpt = cleanText(
    pkg.notes,
    "Catalog-backed Smart City Thailand dataset discovered from the CityData CKAN API."
  );
  const publishedAt = pkg.metadata_modified ? new Date(pkg.metadata_modified).toISOString() : new Date().toISOString();
  const sourceUrl = pkg.url || "https://catalog.citydata.in.th/en";
  const citySlug = inferCitySlug(`${title} ${excerpt}`) ?? undefined;

  return {
    id: `citydata-news-${pkg.id ?? index}`,
    slug: slugify(`citydata-${pkg.name ?? pkg.title ?? index}`),
    title: { th: title, en: title },
    excerpt: { th: excerpt, en: excerpt },
    kind: "external",
    citySlug,
    domainSlug: inferDomainSlug(pkg, `${title} ${excerpt}`),
    publishedAt,
    source: createSourceMeta(sourceUrl, publishedAt)
  };
}

function createProjectRecord(pkg: CkanPackage, index: number): ProjectRecord | null {
  const title = cleanText(pkg.title ?? pkg.name, `CityData tracked project ${index + 1}`);
  const summary = cleanText(pkg.notes, "CityData smart-city catalog record under active monitoring.");
  const citySlug = inferCitySlug(`${title} ${summary}`);
  if (!citySlug) {
    return null;
  }

  const updatedAt = pkg.metadata_modified ? new Date(pkg.metadata_modified).toISOString() : new Date().toISOString();
  const sourceUrl = pkg.url || "https://catalog.citydata.in.th/en";
  const domainSlug = inferDomainSlug(pkg, `${title} ${summary}`);

  return {
    id: `citydata-project-${pkg.id ?? index}`,
    slug: slugify(`citydata-project-${pkg.name ?? pkg.title ?? index}`),
    title: { th: title, en: title },
    citySlug,
    domainSlug,
    status: "watch",
    completionPercent: 50,
    owner: { th: "CityData Thailand", en: "CityData Thailand" },
    summary: { th: summary, en: summary },
    nextMilestone: {
      th: "ยืนยัน resource endpoint และรายละเอียดการใช้งานต่อ",
      en: "Validate resource endpoints and expand the live connector."
    },
    updatedAt,
    source: createSourceMeta(sourceUrl, updatedAt)
  };
}

export async function syncCitydataCatalog() {
  const payload = await fetchJsonOrNull<CkanPackageSearchResponse>(config.citydataEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "citydata",
      status: config.citydataEndpoint ? "stale" : "manual",
      message: config.citydataEndpoint
        ? "CityData CKAN endpoint unavailable, serving catalog metadata fallback."
        : "CityData adapter is configured for metadata mode until a stable endpoint is provided.",
      sourceUrl: "https://catalog.citydata.in.th/api/3/action/package_search"
    });
  }

  const packages = payload.success && payload.result?.results ? payload.result.results : [];
  const smartCityPackages = packages.filter((pkg) => {
    const title = cleanText(pkg.title ?? pkg.name, "");
    const notes = cleanText(pkg.notes, "");
    const tags = (pkg.tags ?? []).map((tag) => `${tag.name ?? ""} ${tag.display_name ?? ""}`).join(" ");
    const haystack = `${title} ${notes} ${tags}`.toLowerCase();
    return haystack.includes("smart city") || haystack.includes("smartcity") || haystack.includes("city data");
  });

  const candidates = smartCityPackages.length > 0 ? smartCityPackages : packages;
  const newsItems = candidates.slice(0, 6).map(createNewsItem);
  const projectRecords = candidates.map(createProjectRecord).filter((item): item is ProjectRecord => Boolean(item));
  const smartCityFootprint = mapFeatureCollections.find(
    (collection): collection is MapFeatureCollection => collection.layerId === "smart-city-thailand"
  );

  return buildResult({
    sourceId: "citydata",
    status: "live",
    message: `Imported ${candidates.length} CKAN package signals, ${projectRecords.length} city-linked project watches, and refreshed the nationwide Smart City Thailand footprint layer.`,
    sourceUrl: "https://catalog.citydata.in.th/api/3/action/package_search",
    newsItems,
    projectRecords,
    mapFeatureCollections: smartCityFootprint ? [smartCityFootprint] : undefined
  });
}
