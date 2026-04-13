import type { NewsItem, ProjectRecord } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";
import {
  ckanPackageToNewsItem,
  ckanPackageToProject,
  cleanCkanText,
  type CkanPackageSearchResponse
} from "./ckanHelpers.js";

const SOURCE_ID = "tceb-mice";
const SOURCE_NAME = "TCEB Open Data";
const SOURCE_URL = "https://opendata.tceb.or.th";
const CONFIDENCE = 0.7;

const MICE_KEYWORDS = [
  "mice", "convention", "exhibition", "conference", "meeting", "event",
  "ประชุม", "นิทรรศการ", "สัมมนา", "อีเวนท์",
  "venue", "attendee", "delegate", "bangkok", "impact"
];

export async function syncTcebMice() {
  const endpoint = config.tcebEndpoint;
  const payload = await fetchJsonOrNull<CkanPackageSearchResponse>(endpoint);

  if (!payload) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: endpoint ? "stale" : "manual",
      message: endpoint
        ? "TCEB MICE data CKAN endpoint unavailable."
        : "TCEB adapter awaiting endpoint configuration.",
      sourceUrl: SOURCE_URL
    });
  }

  const packages = payload.success && payload.result?.results ? payload.result.results : [];

  const micePackages = packages.filter((pkg) => {
    const haystack = `${cleanCkanText(pkg.title, "")} ${cleanCkanText(pkg.notes, "")} ${(pkg.tags ?? []).map((t) => `${t.name ?? ""} ${t.display_name ?? ""}`).join(" ")}`.toLowerCase();
    return MICE_KEYWORDS.some((kw) => haystack.includes(kw));
  });

  const candidates = micePackages.length > 0 ? micePackages : packages;

  // MICE events are economy domain
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
    message: `Imported ${candidates.length} TCEB MICE datasets, ${newsItems.length} news signals.`,
    sourceUrl: SOURCE_URL,
    newsItems,
    projectRecords
  });
}
