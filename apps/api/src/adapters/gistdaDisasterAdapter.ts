import type { GeoFeatureRecord, MapFeatureCollection, SourceMeta } from "@smart-city/shared";
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
  if (isRecord(record.attributes)) {
    Object.assign(flattened, record.attributes);
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
    payload.features,
    payload.data,
    payload.items,
    payload.records,
    isRecord(payload.result) ? payload.result.features : undefined,
    isRecord(payload.result) ? payload.result.data : undefined,
    isRecord(payload.result) ? payload.result.items : undefined,
    isRecord(payload.result) ? payload.result.records : undefined
  ];

  for (const candidate of nested) {
    const records = asRecordArray(candidate);
    if (records.length > 0) {
      return records.map(flattenRecord);
    }
  }

  return [flattenRecord(payload)];
}

function createSourceMeta(sourceUrl: string): SourceMeta {
  const now = new Date().toISOString();
  return {
    sourceName: "GISTDA Disaster API",
    sourceUrl,
    fetchedAt: now,
    publishedAt: now,
    freshnessStatus: "live",
    confidence: 0.81,
    fallbackMode: "live"
  };
}

function extractPointCoordinates(record: GenericRecord): [number, number] | null {
  const geometry = isRecord(record.geometry) ? record.geometry : null;
  const geometryCoordinates = geometry?.coordinates;
  if (
    typeof geometry?.type === "string" &&
    geometry.type.toLowerCase() === "point" &&
    Array.isArray(geometryCoordinates) &&
    geometryCoordinates.length >= 2 &&
    typeof geometryCoordinates[0] === "number" &&
    typeof geometryCoordinates[1] === "number"
  ) {
    return [geometryCoordinates[0], geometryCoordinates[1]];
  }

  const lat = pickNumber(record, ["lat", "latitude", "y", "ycoord", "coord_y"]);
  const lon = pickNumber(record, ["lon", "lng", "longitude", "x", "xcoord", "coord_x"]);
  if (typeof lat === "number" && typeof lon === "number") {
    return [lon, lat];
  }

  return null;
}

function extractPrimitiveProperties(record: GenericRecord) {
  const entries = Object.entries(record).filter(([, value]) => {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    );
  });

  return Object.fromEntries(entries.slice(0, 10)) as GeoFeatureRecord["properties"];
}

function createFeature(record: GenericRecord, index: number, sourceUrl: string): GeoFeatureRecord | null {
  const flattened = flattenRecord(record);
  const coordinates = extractPointCoordinates(flattened);
  if (!coordinates) {
    return null;
  }

  const title = cleanText(
    pickString(flattened, [
      "title",
      "name",
      "event",
      "event_name",
      "alert_name",
      "disaster_type",
      "type",
      "หัวข้อ",
      "ชื่อเหตุการณ์"
    ]),
    `GISTDA disaster signal ${index + 1}`
  );
  const description = cleanText(
    pickString(flattened, [
      "description",
      "detail",
      "remark",
      "status",
      "severity",
      "พื้นที่",
      "รายละเอียด"
    ]),
    "Live disaster or hazard signal imported from a configured GISTDA endpoint."
  );
  const source = createSourceMeta(sourceUrl);

  return {
    id: `gistda-feature-${index}`,
    layerId: "disaster",
    geometryType: "Point",
    coordinates,
    title,
    description,
    properties: extractPrimitiveProperties(flattened),
    source
  };
}

function computeBounds(features: GeoFeatureRecord[]): [number, number, number, number] | undefined {
  const points = features
    .filter((feature) => feature.geometryType === "Point" && Array.isArray(feature.coordinates))
    .map((feature) => feature.coordinates as [number, number]);

  if (points.length === 0) {
    return undefined;
  }

  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  return [
    Math.min(...lats),
    Math.min(...lons),
    Math.max(...lats),
    Math.max(...lons)
  ];
}

export async function syncGistdaDisaster() {
  const payload = await fetchJsonOrNull<unknown>(config.gistdaEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "gistda-disaster",
      status: config.gistdaEndpoint ? "stale" : "manual",
      message: config.gistdaEndpoint
        ? "Configured GISTDA endpoint failed, leaving disaster layer in fallback mode."
        : "Set a confirmed GISTDA endpoint to enable live disaster overlays.",
      sourceUrl: "https://disaster.gistda.or.th/services/open-api"
    });
  }

  const sourceUrl = config.gistdaEndpoint || "https://disaster.gistda.or.th/services/open-api";
  const features = extractRecords(payload)
    .map((record, index) => createFeature(record, index, sourceUrl))
    .filter((item): item is GeoFeatureRecord => Boolean(item))
    .slice(0, 24);

  if (features.length === 0) {
    return buildResult({
      sourceId: "gistda-disaster",
      status: "stale",
      message: "GISTDA endpoint responded, but no point-based disaster records were recognized.",
      sourceUrl
    });
  }

  const warnings = features.slice(0, 3).map((feature) => ({
    th: feature.title,
    en: feature.title
  }));
  const featureCollection: MapFeatureCollection = {
    layerId: "disaster",
    updatedAt: new Date().toISOString(),
    features,
    bounds: computeBounds(features),
    source: createSourceMeta(sourceUrl)
  };

  return buildResult({
    sourceId: "gistda-disaster",
    status: "live",
    message: `Imported ${features.length} GISTDA disaster points and refreshed disaster warnings.`,
    sourceUrl,
    mapFeatureCollections: [featureCollection],
    resiliencePatch: {
      warnings
    }
  });
}
