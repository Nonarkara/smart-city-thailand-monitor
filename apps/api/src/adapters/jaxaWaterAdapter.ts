import type { FreshnessStatus, GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { cloneSeed, mapFeatureCollections } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface JaxaLink {
  rel?: string;
  href?: string;
  type?: string;
  title?: string;
}

interface JaxaProvider {
  name?: string;
  url?: string;
}

interface JaxaCollectionPayload {
  id?: string;
  title?: string;
  description?: string;
  license?: string;
  keywords?: string[];
  links?: JaxaLink[];
  providers?: JaxaProvider[];
  extent?: {
    temporal?: {
      interval?: Array<[string | null, string | null]>;
    };
  };
}

function getSeedCollection() {
  const seed = mapFeatureCollections.find((collection) => collection.layerId === "water");
  return seed ? cloneSeed(seed) : null;
}

function extractCatalogMonth(link: JaxaLink) {
  const match = link.href?.match(/(\d{4}-\d{2})\/catalog\.json$/);
  return match?.[1] ?? null;
}

function getLatestCatalogMonth(links: JaxaLink[]) {
  const months = links
    .filter((link) => link.rel === "child")
    .map(extractCatalogMonth)
    .filter((value): value is string => Boolean(value))
    .sort();

  return months.at(-1) ?? null;
}

function deriveFreshness(latestCatalogMonth: string | null): FreshnessStatus {
  if (!latestCatalogMonth) {
    return "delayed";
  }

  const timestamp = Date.parse(`${latestCatalogMonth}-01T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    return "delayed";
  }

  const ageDays = (Date.now() - timestamp) / 86_400_000;
  return ageDays <= 45 ? "live" : "delayed";
}

function toMonthIsoTimestamp(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const timestamp = Date.parse(`${value}-01T00:00:00Z`);
  return Number.isNaN(timestamp) ? fallback : new Date(timestamp).toISOString();
}

function buildFeatureDescription(baseDescription: string | undefined, title: string, latestCatalogMonth: string | null) {
  const seedCopy = baseDescription ?? "Thailand water monitoring geometry.";
  const liveCopy = latestCatalogMonth
    ? `${title} latest monthly catalog: ${latestCatalogMonth}.`
    : `${title} metadata synced from JAXA Earth.`;
  return `${seedCopy} ${liveCopy}`.trim();
}

export async function syncJaxaWater() {
  if (!config.waterCollectionEndpoint) {
    return buildResult({
      sourceId: "jaxa-earth",
      status: "manual",
      message: "Configure JAXA_WATER_COLLECTION_ENDPOINT to enable live water overlays.",
      sourceUrl: "https://data.earth.jaxa.jp/en/"
    });
  }

  if (!config.allowLiveFetch) {
    return buildResult({
      sourceId: "jaxa-earth",
      status: "manual",
      message: "Live water sync is disabled. Retaining the seeded water layer.",
      sourceUrl: config.waterCollectionEndpoint
    });
  }

  const payload = await fetchJsonOrNull<JaxaCollectionPayload>(config.waterCollectionEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "jaxa-earth",
      status: "stale",
      message: "JAXA water collection is unavailable. Retaining the cached water layer.",
      sourceUrl: config.waterCollectionEndpoint
    });
  }

  const seedCollection = getSeedCollection();
  if (!seedCollection || seedCollection.features.length === 0) {
    return buildResult({
      sourceId: "jaxa-earth",
      status: "stale",
      message: "JAXA water metadata loaded, but no local water geometry scaffold is available.",
      sourceUrl: config.waterCollectionEndpoint
    });
  }

  const fetchedAt = new Date().toISOString();
  const latestCatalogMonth = getLatestCatalogMonth(payload.links ?? []);
  const freshness = deriveFreshness(latestCatalogMonth);
  const title = payload.title?.trim() || payload.id?.trim() || "JAXA water collection";
  const coverageStart = payload.extent?.temporal?.interval?.[0]?.[0] ?? null;
  const providerNames = (payload.providers ?? [])
    .map((provider) => provider.name)
    .filter((value): value is string => Boolean(value));
  const providerLabel = providerNames.join(", ");
  const publishedAt = toMonthIsoTimestamp(latestCatalogMonth, fetchedAt);

  const sourceMeta = {
    sourceName: "JAXA Earth API",
    sourceUrl: config.waterCollectionEndpoint,
    fetchedAt,
    publishedAt,
    freshnessStatus: freshness,
    confidence: 0.83,
    fallbackMode: "live" as const
  };

  const features: GeoFeatureRecord[] = seedCollection.features.map((feature) => ({
    ...feature,
    title: `${feature.title} | ${title}`,
    description: buildFeatureDescription(feature.description, title, latestCatalogMonth),
    properties: {
      ...feature.properties,
      datasetId: payload.id ?? "collection",
      productTitle: title,
      latestCatalogMonth: latestCatalogMonth ?? null,
      coverageStart,
      catalogCount: (payload.links ?? []).filter((link) => link.rel === "child").length,
      providerCount: providerNames.length,
      providers: providerLabel || null,
      license: payload.license ?? null,
      keywordCount: payload.keywords?.length ?? 0
    },
    source: sourceMeta
  }));

  const collection: MapFeatureCollection = {
    ...seedCollection,
    updatedAt: fetchedAt,
    features,
    source: sourceMeta
  };

  return buildResult({
    sourceId: "jaxa-earth",
    status: freshness,
    message: latestCatalogMonth
      ? `JAXA water metadata refreshed for ${features.length} Thai water features. Latest catalog: ${latestCatalogMonth}.`
      : `JAXA water metadata refreshed for ${features.length} Thai water features.`,
    sourceUrl: config.waterCollectionEndpoint,
    mapFeatureCollections: [collection]
  });
}
