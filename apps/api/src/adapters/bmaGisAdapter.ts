import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull } from "./common.js";
import { config } from "../config.js";

const SOURCE_ID = "bma-gis";
const SOURCE_URL = "https://bmagis.bangkok.go.th";

interface ArcGisFeature {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
}

interface ArcGisGeoJsonResponse {
  type?: string;
  features?: ArcGisFeature[];
}

interface BmaLayerSpec {
  layerId: string;
  servicePath: string;
  titleField: string;
  descriptionField?: string;
  geometryType: "Point" | "Polygon";
}

const BMA_LAYERS: BmaLayerSpec[] = [
  {
    layerId: "bma-flood-gates",
    servicePath: "BMA/FLOODGATE/FeatureServer/0",
    titleField: "NAME",
    descriptionField: "TYPE",
    geometryType: "Point"
  },
  {
    layerId: "bma-health-centers",
    servicePath: "BMA/PublicHealthCenter/FeatureServer/0",
    titleField: "NAME_TH",
    descriptionField: "TYPE_TH",
    geometryType: "Point"
  }
];

async function fetchBmaLayer(spec: BmaLayerSpec): Promise<MapFeatureCollection | null> {
  const url = `${config.bmaGisBaseUrl}/${spec.servicePath}/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=500`;
  const payload = await fetchJsonOrNull<ArcGisGeoJsonResponse>(url);
  const rawFeatures = payload?.features ?? [];

  if (rawFeatures.length === 0) return null;

  const fetchedAt = new Date().toISOString();
  const sourceMeta = {
    sourceName: "BMA GIS Portal",
    sourceUrl: SOURCE_URL,
    fetchedAt,
    publishedAt: fetchedAt,
    freshnessStatus: "live" as const,
    confidence: 0.87,
    fallbackMode: "live" as const
  };

  const features: GeoFeatureRecord[] = rawFeatures
    .filter((f) => f.geometry?.coordinates)
    .map((f, i) => {
      const props = f.properties ?? {};
      const title = String(props[spec.titleField] ?? props["NAME"] ?? props["name"] ?? `Feature ${i + 1}`);
      const desc = spec.descriptionField ? String(props[spec.descriptionField] ?? "") : "";

      return {
        id: `${spec.layerId}-${i}`,
        layerId: spec.layerId,
        geometryType: spec.geometryType,
        coordinates: f.geometry!.coordinates,
        title,
        description: desc || `${spec.layerId} feature`,
        properties: {
          citySlug: "bangkok",
          ...Object.fromEntries(
            Object.entries(props)
              .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null)
              .slice(0, 10)
          )
        },
        source: sourceMeta
      };
    });

  const lats: number[] = [];
  const lons: number[] = [];

  for (const f of features) {
    const coords = f.coordinates;
    if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === "number") {
      lons.push(coords[0] as number);
      lats.push(coords[1] as number);
    }
  }

  const bounds: [number, number, number, number] | undefined =
    lats.length > 0
      ? [Math.min(...lats), Math.min(...lons), Math.max(...lats), Math.max(...lons)]
      : undefined;

  return {
    layerId: spec.layerId,
    updatedAt: fetchedAt,
    features,
    bounds,
    source: sourceMeta
  };
}

export async function syncBmaGis() {
  const results = await Promise.allSettled(BMA_LAYERS.map((spec) => fetchBmaLayer(spec)));

  const collections: MapFeatureCollection[] = results
    .filter((r): r is PromiseFulfilledResult<MapFeatureCollection | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((c): c is MapFeatureCollection => c !== null);

  const totalFeatures = collections.reduce((sum, c) => sum + c.features.length, 0);

  if (collections.length === 0) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: "stale",
      message: "BMA GIS layers unavailable. Retaining cached features.",
      sourceUrl: SOURCE_URL
    });
  }

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `${collections.length} BMA GIS layers synced with ${totalFeatures} features.`,
    sourceUrl: SOURCE_URL,
    mapFeatureCollections: collections
  });
}
