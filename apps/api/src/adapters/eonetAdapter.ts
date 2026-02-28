import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface EonetGeometry {
  type?: string;
  coordinates?: unknown;
  date?: string;
}

interface EonetSource {
  url?: string;
}

interface EonetEvent {
  id?: string;
  title?: string;
  description?: string;
  categories?: Array<{ title?: string }>;
  geometry?: EonetGeometry[];
  sources?: EonetSource[];
}

interface EonetResponse {
  events?: EonetEvent[];
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

function extractPoint(geometry: EonetGeometry | undefined): [number, number] | null {
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Point" && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    const [lon, lat] = geometry.coordinates as [number, number];
    return [lon, lat];
  }

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
    const firstRing = geometry.coordinates[0];
    if (Array.isArray(firstRing) && firstRing.length > 0) {
      const [lon, lat] = firstRing[0] as [number, number];
      if (typeof lon === "number" && typeof lat === "number") {
        return [lon, lat];
      }
    }
  }

  return null;
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

export async function syncEonetEvents() {
  const payload = await fetchJsonOrNull<EonetResponse>(config.eonetEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "nasa-eonet",
      status: config.eonetEndpoint ? "stale" : "manual",
      message: config.eonetEndpoint
        ? "NASA EONET is unavailable right now. Keeping the cached resilience events."
        : "Configure an EONET endpoint to enable live natural-event monitoring.",
      sourceUrl: "https://eonet.gsfc.nasa.gov/api/v3/events"
    });
  }

  const featureCandidates: Array<GeoFeatureRecord | null> = (payload.events ?? [])
    .map((event, index) => {
      const geometry = event.geometry?.at(-1) ?? event.geometry?.[0];
      const point = extractPoint(geometry);
      if (!point) {
        return null;
      }

      const title = cleanText(event.title, `Natural event ${index + 1}`);
      const description = cleanText(
        event.description,
        `NASA EONET ${event.categories?.map((category) => category.title).filter(Boolean).join(", ") || "event"}`
      );
      const publishedAt = geometry?.date ? new Date(geometry.date).toISOString() : new Date().toISOString();
      const sourceUrl = event.sources?.[0]?.url ?? "https://eonet.gsfc.nasa.gov/api/v3/events";

      return {
        id: `eonet-${event.id ?? index}`,
        layerId: "resilience",
        geometryType: "Point",
        coordinates: point,
        title,
        description,
        properties: {
          category: event.categories?.[0]?.title ?? "Natural Event"
        },
        source: {
          sourceName: "NASA EONET",
          sourceUrl,
          fetchedAt: new Date().toISOString(),
          publishedAt,
          freshnessStatus: "live",
          confidence: 0.77,
          fallbackMode: "live"
        }
      } satisfies GeoFeatureRecord;
    });
  const features = featureCandidates.filter((item): item is GeoFeatureRecord => Boolean(item)).slice(0, 12);

  if (features.length === 0) {
    return buildResult({
      sourceId: "nasa-eonet",
      status: "stale",
      message: "NASA EONET responded, but no point-based event geometries were usable.",
      sourceUrl: config.eonetEndpoint
    });
  }

  const warnings = features.slice(0, 2).map((feature) => ({
    th: feature.title,
    en: feature.title
  }));
  const collection: MapFeatureCollection = {
    layerId: "resilience",
    updatedAt: new Date().toISOString(),
    features,
    bounds: computeBounds(features),
    source: {
      sourceName: "NASA EONET",
      sourceUrl: config.eonetEndpoint,
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.77,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: "nasa-eonet",
    status: "live",
    message: `Imported ${features.length} NASA EONET natural events for resilience context.`,
    sourceUrl: config.eonetEndpoint,
    mapFeatureCollections: [collection],
    resiliencePatch: {
      warnings
    }
  });
}
