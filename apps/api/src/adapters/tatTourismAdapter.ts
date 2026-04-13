import type { NewsItem, ProjectRecord } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";
import {
  ckanPackageToNewsItem,
  ckanPackageToProject,
  cleanCkanText,
  type CkanPackageSearchResponse
} from "./ckanHelpers.js";

const SOURCE_ID = "tat-tourism";
const SOURCE_NAME = "TAT Open Data";
const SOURCE_URL = "https://datacatalog.tat.or.th";
const CONFIDENCE = 0.72;

const TOURISM_KEYWORDS = [
  "tourism", "tourist", "visitor", "hotel", "accommodation", "travel",
  "ท่องเที่ยว", "นักท่องเที่ยว", "โรงแรม", "ที่พัก",
  "occupancy", "arrival", "revenue", "mice", "bangkok"
];

export async function syncTatTourism() {
  const endpoint = config.tatTourismEndpoint;
  const payload = await fetchJsonOrNull<CkanPackageSearchResponse>(endpoint);

  if (!payload) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: endpoint ? "stale" : "manual",
      message: endpoint
        ? "TAT Tourism Data CKAN endpoint unavailable."
        : "TAT Tourism adapter awaiting endpoint configuration.",
      sourceUrl: SOURCE_URL
    });
  }

  const packages = payload.success && payload.result?.results ? payload.result.results : [];

  // Filter for tourism-specific packages
  const tourismPackages = packages.filter((pkg) => {
    const haystack = `${cleanCkanText(pkg.title, "")} ${cleanCkanText(pkg.notes, "")} ${(pkg.tags ?? []).map((t) => `${t.name ?? ""} ${t.display_name ?? ""}`).join(" ")}`.toLowerCase();
    return TOURISM_KEYWORDS.some((kw) => haystack.includes(kw));
  });

  const candidates = tourismPackages.length > 0 ? tourismPackages : packages;

  // All TAT items are economy domain
  const newsItems: NewsItem[] = candidates.slice(0, 6).map((pkg, i) => {
    const item = ckanPackageToNewsItem(pkg, i, SOURCE_ID, SOURCE_NAME, SOURCE_URL, CONFIDENCE);
    item.domainSlug = "economy";
    return item;
  });

  const projectRecords: ProjectRecord[] = candidates
    .map((pkg, i) => {
      const project = ckanPackageToProject(pkg, i, SOURCE_ID, SOURCE_NAME, SOURCE_URL, CONFIDENCE);
      if (project) project.domainSlug = "economy";
      return project;
    })
    .filter((p): p is ProjectRecord => p !== null);

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `Imported ${candidates.length} TAT tourism datasets, ${newsItems.length} news signals.`,
    sourceUrl: SOURCE_URL,
    newsItems,
    projectRecords
  });
}
