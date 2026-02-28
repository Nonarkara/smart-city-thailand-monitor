import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface OpenAqLocation {
  id?: number | string;
  name?: string;
  locality?: string;
  city?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  latitude?: number;
  longitude?: number;
}

interface OpenAqResponse {
  results?: OpenAqLocation[];
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

function extractCoordinates(location: OpenAqLocation): [number, number] | null {
  const latitude = location.coordinates?.latitude ?? location.latitude;
  const longitude = location.coordinates?.longitude ?? location.longitude;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return [longitude, latitude];
}

export async function syncOpenAq() {
  if (!config.openaqApiKey) {
    return buildResult({
      sourceId: "openaq",
      status: "manual",
      message: "Add OPENAQ_API_KEY to enable station-level air-quality monitoring.",
      sourceUrl: "https://api.openaq.org"
    });
  }

  const payload = await fetchJsonOrNull<OpenAqResponse>(config.openaqEndpoint, {
    headers: {
      "X-API-Key": config.openaqApiKey
    }
  });

  if (!payload) {
    return buildResult({
      sourceId: "openaq",
      status: "stale",
      message: "OpenAQ endpoint failed, keeping the existing pollution layer.",
      sourceUrl: config.openaqEndpoint
    });
  }

  const featureCandidates: Array<GeoFeatureRecord | null> = (payload.results ?? [])
    .map((location, index) => {
      const coordinates = extractCoordinates(location);
      if (!coordinates) {
        return null;
      }

      const title = location.name || location.locality || location.city || `OpenAQ station ${index + 1}`;
      return {
        id: `openaq-${location.id ?? index}`,
        layerId: "pollution",
        geometryType: "Point",
        coordinates,
        title,
        description: `Station-level air-quality point from OpenAQ${location.city ? ` in ${location.city}` : ""}.`,
        properties: {
          locality: location.locality ?? null,
          city: location.city ?? null
        },
        source: {
          sourceName: "OpenAQ",
          sourceUrl: config.openaqEndpoint,
          fetchedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          freshnessStatus: "live",
          confidence: 0.75,
          fallbackMode: "live"
        }
      } satisfies GeoFeatureRecord;
    });
  const features = featureCandidates.filter((item): item is GeoFeatureRecord => Boolean(item)).slice(0, 12);

  if (features.length === 0) {
    return buildResult({
      sourceId: "openaq",
      status: "stale",
      message: "OpenAQ responded, but no station coordinates were available.",
      sourceUrl: config.openaqEndpoint
    });
  }

  const collection: MapFeatureCollection = {
    layerId: "pollution",
    updatedAt: new Date().toISOString(),
    features,
    bounds: computeBounds(features),
    source: {
      sourceName: "OpenAQ",
      sourceUrl: config.openaqEndpoint,
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.75,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: "openaq",
    status: "live",
    message: `Imported ${features.length} OpenAQ station locations for the pollution layer.`,
    sourceUrl: config.openaqEndpoint,
    mapFeatureCollections: [collection],
    resiliencePatch: {
      pollutionSummary: {
        th: `OpenAQ อัปเดตสถานีคุณภาพอากาศ ${features.length} จุด`,
        en: `OpenAQ refreshed ${features.length} station-level air-quality points.`
      }
    }
  });
}
