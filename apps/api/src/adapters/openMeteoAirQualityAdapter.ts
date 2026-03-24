import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import {
  buildResult,
  fetchJsonOrNull,
  thailandMonitoringCities,
  type MonitoringCity
} from "./common.js";

interface OpenMeteoAirPayload {
  latitude?: number;
  longitude?: number;
  location_id?: number;
  current?: {
    pm2_5?: number;
    pm10?: number;
    us_aqi?: number;
  };
}

type OpenMeteoAirResponse = OpenMeteoAirPayload | OpenMeteoAirPayload[];

interface AirMeshSample {
  city: MonitoringCity;
  latitude: number;
  longitude: number;
  sampleId: string;
  sampleLabel: string;
  sampleRank: number;
  isCore: boolean;
}

interface LiveAirMeshSample extends AirMeshSample {
  aqi: number;
  pm25: number;
  pm10: number;
}

interface CityAirLeader {
  city: MonitoringCity;
  peakSample: LiveAirMeshSample;
}

function buildAirUrl(samples: AirMeshSample[]) {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set(
    "latitude",
    samples.map((sample) => sample.latitude.toFixed(4)).join(",")
  );
  url.searchParams.set(
    "longitude",
    samples.map((sample) => sample.longitude.toFixed(4)).join(",")
  );
  url.searchParams.set("current", "pm10,pm2_5,us_aqi");
  url.searchParams.set("timezone", "Asia/Bangkok");
  return url.toString();
}

function normalizePayload(payload: OpenMeteoAirResponse | null) {
  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : [payload];
}

function clampMeshMetric(value: number, floor: number) {
  return Math.max(floor, Math.round(value));
}

function longitudeDelta(stepKm: number, latitude: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const metersPerDegree = Math.max(Math.cos(latitudeRadians) * 111.32, 24);
  return stepKm / metersPerDegree;
}

function getMeshProfile(city: MonitoringCity) {
  const population = city.population ?? 0;

  if (population >= 8_000_000) {
    return { offsets: [-2, -1, 0, 1, 2], stepKm: 9 };
  }

  if (population >= 1_500_000) {
    return { offsets: [-1, 0, 1], stepKm: 11 };
  }

  if (population >= 400_000) {
    return { offsets: [-1, 0, 1], stepKm: 9 };
  }

  return { offsets: [-1, 0, 1], stepKm: 7 };
}

function describeMeshOffset(latOffset: number, lonOffset: number) {
  if (latOffset === 0 && lonOffset === 0) {
    return "core";
  }

  const tokens = [];
  if (latOffset > 0) {
    tokens.push(`north-${Math.abs(latOffset)}`);
  } else if (latOffset < 0) {
    tokens.push(`south-${Math.abs(latOffset)}`);
  }

  if (lonOffset > 0) {
    tokens.push(`east-${Math.abs(lonOffset)}`);
  } else if (lonOffset < 0) {
    tokens.push(`west-${Math.abs(lonOffset)}`);
  }

  return tokens.join("-");
}

function createAirMesh(city: MonitoringCity): AirMeshSample[] {
  const { offsets, stepKm } = getMeshProfile(city);
  const latDelta = stepKm / 110.574;
  const lonDelta = longitudeDelta(stepKm, city.lat);
  const samples: AirMeshSample[] = [];

  offsets
    .slice()
    .sort((left, right) => right - left)
    .forEach((latOffset) => {
      offsets.forEach((lonOffset) => {
        const sampleLabel = describeMeshOffset(latOffset, lonOffset);
        samples.push({
          city,
          latitude: Number((city.lat + latOffset * latDelta).toFixed(4)),
          longitude: Number((city.lon + lonOffset * lonDelta).toFixed(4)),
          sampleId: sampleLabel,
          sampleLabel,
          sampleRank: samples.length,
          isCore: latOffset === 0 && lonOffset === 0
        });
      });
    });

  return samples;
}

function computeBounds(samples: LiveAirMeshSample[]): [number, number, number, number] | undefined {
  if (samples.length === 0) {
    return undefined;
  }

  return [
    Math.min(...samples.map((sample) => sample.latitude)),
    Math.min(...samples.map((sample) => sample.longitude)),
    Math.max(...samples.map((sample) => sample.latitude)),
    Math.max(...samples.map((sample) => sample.longitude))
  ];
}

export async function syncOpenMeteoAirQuality() {
  const meshSamples = thailandMonitoringCities.flatMap((city) => createAirMesh(city));
  const payload = await fetchJsonOrNull<OpenMeteoAirResponse>(buildAirUrl(meshSamples));
  const liveSamples = normalizePayload(payload)
    .map((entry, index) => {
      const sample = meshSamples[index];
      if (!sample || !entry?.current) {
        return null;
      }

      return {
        ...sample,
        aqi: clampMeshMetric(entry.current.us_aqi ?? 0, 6),
        pm25: clampMeshMetric(entry.current.pm2_5 ?? 0, 1),
        pm10: clampMeshMetric(entry.current.pm10 ?? 0, 2)
      };
    })
    .filter((item): item is LiveAirMeshSample => Boolean(item));

  if (liveSamples.length === 0) {
    return buildResult({
      sourceId: "open-meteo-air",
      status: "stale",
      message: "Air-quality endpoint unavailable. Retaining cached AQI layer.",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api"
    });
  }

  const cityLeaders = thailandMonitoringCities
    .map((city) => {
      const citySamples = liveSamples.filter((sample) => sample.city.slug === city.slug);
      if (citySamples.length === 0) {
        return null;
      }

      const peakSample =
        [...citySamples].sort((left, right) => {
          if (right.aqi !== left.aqi) {
            return right.aqi - left.aqi;
          }

          if (right.pm25 !== left.pm25) {
            return right.pm25 - left.pm25;
          }

          return right.pm10 - left.pm10;
        })[0] ?? citySamples[0];

      return {
        city,
        peakSample
      };
    })
    .filter((item): item is CityAirLeader => Boolean(item));

  const highestAqiCity =
    [...cityLeaders].sort((left, right) => right.peakSample.aqi - left.peakSample.aqi)[0] ?? cityLeaders[0];
  const fetchedAt = new Date().toISOString();
  const features: GeoFeatureRecord[] = liveSamples.map((item) => ({
    id: `pollution-${item.city.slug}-${item.sampleId}`,
    layerId: "pollution",
    geometryType: "Point",
    coordinates: [item.longitude, item.latitude],
    title: item.city.labelEn,
    description: item.isCore
      ? `${item.city.labelEn} AQI city-core sample`
      : `${item.city.labelEn} AQI mesh sample ${item.sampleLabel}`,
    properties: {
      city: item.city.labelEn,
      citySlug: item.city.slug,
      region: item.city.regionEn,
      aqi: item.aqi,
      pm25: item.pm25,
      pm10: item.pm10,
      population: item.city.population ?? null,
      sampleKind: "mesh",
      sampleLabel: item.sampleLabel,
      sampleRank: item.sampleRank,
      cityCenter: item.isCore
    },
    source: {
      sourceName: "Open-Meteo Air Quality",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      fetchedAt,
      publishedAt: fetchedAt,
      freshnessStatus: "live",
      confidence: 0.84,
      fallbackMode: "live"
    }
  }));
  const bounds = computeBounds(liveSamples);

  const mapCollection: MapFeatureCollection = {
    layerId: "pollution",
    updatedAt: fetchedAt,
    features,
    bounds,
    source: {
      sourceName: "Open-Meteo Air Quality",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      fetchedAt,
      publishedAt: fetchedAt,
      freshnessStatus: "live",
      confidence: 0.84,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: "open-meteo-air",
    status: "live",
    message: `Air-quality mesh refreshed for ${cityLeaders.length} Thai cities with ${liveSamples.length} samples.`,
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    mapFeatureCollections: [mapCollection],
    resiliencePatch: {
      aqi: highestAqiCity.peakSample.aqi,
      pollutionSummary: {
        th: `${highestAqiCity.city.labelTh} AQI ${highestAqiCity.peakSample.aqi} | PM2.5 ${highestAqiCity.peakSample.pm25} | PM10 ${highestAqiCity.peakSample.pm10}`,
        en: `${highestAqiCity.city.labelEn} AQI ${highestAqiCity.peakSample.aqi} | PM2.5 ${highestAqiCity.peakSample.pm25} | PM10 ${highestAqiCity.peakSample.pm10}`
      }
    }
  });
}
