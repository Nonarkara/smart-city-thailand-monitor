import type { NewsItem, ProjectRecord } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";
import {
  ckanPackageToNewsItem,
  ckanPackageToProject,
  cleanCkanText,
  type CkanPackageSearchResponse
} from "./ckanHelpers.js";

const SOURCE_ID = "bma-citydata";
const SOURCE_NAME = "BMA City Data Portal";
const SOURCE_URL = "https://citydataportal.bangkok.go.th";
const CONFIDENCE = 0.82;

const BANGKOK_KEYWORDS = [
  "bangkok", "กรุงเทพ", "กทม", "bma",
  "infrastructure", "budget", "service", "population", "district",
  "โครงสร้างพื้นฐาน", "งบประมาณ", "บริการ", "ประชากร", "เขต"
];

export async function syncBmaCityData() {
  const endpoint = config.bmaCityDataEndpoint;
  const payload = await fetchJsonOrNull<CkanPackageSearchResponse>(endpoint);

  if (!payload) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: endpoint ? "stale" : "manual",
      message: endpoint
        ? "BMA City Data Portal CKAN endpoint unavailable."
        : "BMA City Data Portal adapter awaiting endpoint configuration.",
      sourceUrl: SOURCE_URL
    });
  }

  const packages = payload.success && payload.result?.results ? payload.result.results : [];

  // Filter for Bangkok-relevant packages
  const relevant = packages.filter((pkg) => {
    const haystack = `${cleanCkanText(pkg.title, "")} ${cleanCkanText(pkg.notes, "")} ${(pkg.tags ?? []).map((t) => `${t.name ?? ""} ${t.display_name ?? ""}`).join(" ")}`.toLowerCase();
    return BANGKOK_KEYWORDS.some((kw) => haystack.includes(kw));
  });

  const candidates = relevant.length > 0 ? relevant : packages;
  const newsItems: NewsItem[] = candidates.slice(0, 8).map((pkg, i) =>
    ckanPackageToNewsItem(pkg, i, SOURCE_ID, SOURCE_NAME, SOURCE_URL, CONFIDENCE)
  );

  // Force citySlug to bangkok for all BMA items
  for (const item of newsItems) {
    if (!item.citySlug) item.citySlug = "bangkok";
  }

  const projectRecords: ProjectRecord[] = candidates
    .map((pkg, i) => ckanPackageToProject(pkg, i, SOURCE_ID, SOURCE_NAME, SOURCE_URL, CONFIDENCE))
    .filter((p): p is ProjectRecord => p !== null);

  // Also force bangkok for any unlinked projects
  for (const project of projectRecords) {
    if (!project.citySlug) project.citySlug = "bangkok";
  }

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `Imported ${candidates.length} BMA open data packages, ${newsItems.length} news signals, ${projectRecords.length} project watches.`,
    sourceUrl: SOURCE_URL,
    newsItems,
    projectRecords
  });
}
