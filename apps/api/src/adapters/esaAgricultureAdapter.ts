import type { FreshnessStatus, GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { cloneSeed, mapFeatureCollections } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface EsaProvider {
  Name?: string;
  Url?: string;
}

interface EsaSpaceborne {
  Satellite?: string[];
  Sensor?: string[];
}

interface EsaResource {
  Name?: string;
  CollectionId?: string;
  EndPoint?: string;
  MapReplaceDates?: Record<string, string[]>;
}

interface EsaCatalogPayload {
  Name?: string;
  Title?: string;
  EodashIdentifier?: string;
  Subtitle?: string;
  Themes?: string[];
  Tags?: string[];
  DataSource?: {
    Spaceborne?: EsaSpaceborne;
  };
  Agency?: string[];
  Provider?: EsaProvider[];
  Resources?: EsaResource[];
}

function getSeedCollection() {
  const seed = mapFeatureCollections.find((collection) => collection.layerId === "agriculture");
  return seed ? cloneSeed(seed) : null;
}

function flattenSceneDates(resources: EsaResource[]) {
  return resources.flatMap((resource) =>
    Object.values(resource.MapReplaceDates ?? {}).flatMap((dates) =>
      dates.filter((value): value is string => Boolean(value))
    )
  );
}

function toIsoTimestamp(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function getLatestSceneDate(values: string[]) {
  const datedValues = values
    .map((value) => ({
      raw: value,
      timestamp: Date.parse(`${value}T00:00:00Z`)
    }))
    .filter((value) => !Number.isNaN(value.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp);

  return datedValues[0]?.raw ?? null;
}

function deriveFreshness(latestSceneDate: string | null): FreshnessStatus {
  if (!latestSceneDate) {
    return "delayed";
  }

  const timestamp = Date.parse(`${latestSceneDate}T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    return "delayed";
  }

  const ageDays = (Date.now() - timestamp) / 86_400_000;
  return ageDays <= 60 ? "live" : "delayed";
}

function buildFeatureDescription(baseDescription: string | undefined, subtitle: string | undefined, title: string) {
  const seedCopy = baseDescription ?? "Thailand agriculture watch zone.";
  const liveCopy = subtitle?.trim() || `Live catalog metadata aligned to ${title}.`;
  return `${seedCopy} ${liveCopy}`.trim();
}

export async function syncEsaAgriculture() {
  if (!config.agricultureCollectionEndpoint) {
    return buildResult({
      sourceId: "esa-eodashboard",
      status: "manual",
      message: "Configure ESA_AGRICULTURE_COLLECTION_ENDPOINT to enable live agriculture overlays.",
      sourceUrl: "https://github.com/ESA-eodashboards/eodashboard-catalog/tree/main/collections"
    });
  }

  if (!config.allowLiveFetch) {
    return buildResult({
      sourceId: "esa-eodashboard",
      status: "manual",
      message: "Live agriculture sync is disabled. Retaining the seeded agriculture layer.",
      sourceUrl: config.agricultureCollectionEndpoint
    });
  }

  const payload = await fetchJsonOrNull<EsaCatalogPayload>(config.agricultureCollectionEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "esa-eodashboard",
      status: "stale",
      message: "ESA agriculture catalog is unavailable. Retaining the cached agriculture layer.",
      sourceUrl: config.agricultureCollectionEndpoint
    });
  }

  const seedCollection = getSeedCollection();
  if (!seedCollection || seedCollection.features.length === 0) {
    return buildResult({
      sourceId: "esa-eodashboard",
      status: "stale",
      message: "ESA agriculture metadata loaded, but no local agriculture geometry scaffold is available.",
      sourceUrl: config.agricultureCollectionEndpoint
    });
  }

  const fetchedAt = new Date().toISOString();
  const resources = payload.Resources ?? [];
  const sceneDates = flattenSceneDates(resources);
  const latestSceneDate = getLatestSceneDate(sceneDates);
  const freshness = deriveFreshness(latestSceneDate);
  const providerNames = [
    ...(payload.Provider ?? []).map((provider) => provider.Name).filter((value): value is string => Boolean(value)),
    ...(payload.Agency ?? []).filter((value): value is string => Boolean(value))
  ];
  const uniqueProviders = [...new Set(providerNames)];
  const providerLabel = uniqueProviders.join(", ");
  const satelliteCount = payload.DataSource?.Spaceborne?.Satellite?.length ?? 0;
  const tagLabel = (payload.Tags ?? []).slice(0, 4).join(", ");
  const indicatorTitle = payload.Title?.trim() || payload.Name?.trim() || "ESA agriculture indicator";
  const publishedAt = toIsoTimestamp(latestSceneDate, fetchedAt);

  const sourceMeta = {
    sourceName: "ESA EO Dashboard Catalog",
    sourceUrl: config.agricultureCollectionEndpoint,
    fetchedAt,
    publishedAt,
    freshnessStatus: freshness,
    confidence: 0.74,
    fallbackMode: "live" as const
  };

  const features: GeoFeatureRecord[] = seedCollection.features.map((feature) => ({
    ...feature,
    title: `${feature.title} | ${indicatorTitle}`,
    description: buildFeatureDescription(feature.description, payload.Subtitle, indicatorTitle),
    properties: {
      ...feature.properties,
      indicatorId: payload.EodashIdentifier ?? payload.Name ?? "unknown",
      indicatorTitle,
      indicatorTheme: payload.Themes?.[0] ?? "agriculture",
      providerCount: uniqueProviders.length,
      providers: providerLabel || null,
      satelliteCount,
      resourceCount: resources.length,
      sceneCount: sceneDates.length,
      latestSceneDate: latestSceneDate ?? null,
      tags: tagLabel || null
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
    sourceId: "esa-eodashboard",
    status: freshness,
    message: latestSceneDate
      ? `ESA agriculture metadata refreshed for ${features.length} Thai agriculture zones. Latest scene: ${latestSceneDate}.`
      : `ESA agriculture metadata refreshed for ${features.length} Thai agriculture zones.`,
    sourceUrl: config.agricultureCollectionEndpoint,
    mapFeatureCollections: [collection]
  });
}
