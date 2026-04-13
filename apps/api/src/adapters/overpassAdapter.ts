import type { GeoFeatureRecord, MapFeatureCollection, SourceMeta } from "@smart-city/shared";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const BANGKOK_BBOX = "13.45,100.35,13.95,100.85";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

const cache = new Map<string, { data: MapFeatureCollection; expiry: number }>();

function buildSourceMeta(fetchedAt: string): SourceMeta {
  return {
    sourceName: "OpenStreetMap / Overpass API",
    sourceUrl: "https://www.openstreetmap.org",
    fetchedAt,
    publishedAt: fetchedAt,
    freshnessStatus: "live",
    confidence: 0.92,
    fallbackMode: "live"
  };
}

function overpassWayToFeature(
  element: OverpassElement,
  layerId: string,
  index: number
): GeoFeatureRecord | null {
  if (!element.geometry || element.geometry.length < 2) return null;

  const tags = element.tags ?? {};
  const title =
    tags.name ?? tags["name:en"] ?? tags.ref ?? tags.highway ?? tags.waterway ?? `Way ${element.id}`;

  const coordinates = element.geometry.map((pt) => [pt.lon, pt.lat]);

  const properties: Record<string, string | number | boolean | null> = {
    osmId: element.id,
    citySlug: "bangkok"
  };
  for (const key of ["highway", "waterway", "ref", "name", "name:th", "name:en", "lanes", "maxspeed", "surface", "width"]) {
    if (tags[key] !== undefined) {
      properties[key] = tags[key];
    }
  }

  return {
    id: `${layerId}-${element.id}`,
    layerId,
    geometryType: "LineString",
    coordinates,
    title,
    description: tags["name:th"] ?? tags.ref ?? layerId,
    properties,
    source: buildSourceMeta(new Date().toISOString())
  };
}

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(35000)
  });

  if (!response.ok) {
    throw new Error(`Overpass API returned ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  return data.elements ?? [];
}

const QUERIES: Record<string, string> = {
  "bangkok-highways": `[out:json][timeout:30];(way["highway"="motorway"](${BANGKOK_BBOX});way["highway"="motorway_link"](${BANGKOK_BBOX});way["highway"="trunk"](${BANGKOK_BBOX});way["highway"="trunk_link"](${BANGKOK_BBOX}););out geom;`,
  "bangkok-arterials": `[out:json][timeout:30];(way["highway"="primary"](${BANGKOK_BBOX});way["highway"="secondary"](${BANGKOK_BBOX}););out geom;`,
  "bangkok-waterways": `[out:json][timeout:30];(way["waterway"="river"](${BANGKOK_BBOX});way["waterway"="canal"](${BANGKOK_BBOX});way["waterway"="drain"](${BANGKOK_BBOX}););out geom;`
};

export async function fetchOverpassLayer(
  layerId: "bangkok-highways" | "bangkok-arterials" | "bangkok-waterways"
): Promise<MapFeatureCollection> {
  const cached = cache.get(layerId);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const query = QUERIES[layerId];
  const fetchedAt = new Date().toISOString();

  try {
    const elements = await queryOverpass(query);
    const features: GeoFeatureRecord[] = elements
      .filter((el) => el.type === "way")
      .map((el, i) => overpassWayToFeature(el, layerId, i))
      .filter((f): f is GeoFeatureRecord => f !== null);

    const collection: MapFeatureCollection = {
      layerId,
      updatedAt: fetchedAt,
      features,
      source: buildSourceMeta(fetchedAt)
    };

    // Only cache non-empty results — empty may indicate Overpass rate-limiting
    if (features.length > 0) {
      cache.set(layerId, { data: collection, expiry: Date.now() + CACHE_TTL_MS });
    }
    return collection;
  } catch (error) {
    // Return cached data even if expired, or empty collection
    if (cached) return cached.data;

    return {
      layerId,
      updatedAt: fetchedAt,
      features: [],
      source: {
        ...buildSourceMeta(fetchedAt),
        freshnessStatus: "stale",
        fallbackMode: "cached",
        confidence: 0
      }
    };
  }
}
