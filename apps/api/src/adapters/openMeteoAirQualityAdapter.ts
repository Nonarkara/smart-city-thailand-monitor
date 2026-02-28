import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull, thailandMonitoringCities } from "./common.js";

interface OpenMeteoAirPayload {
  current?: {
    pm2_5?: number;
    pm10?: number;
    us_aqi?: number;
  };
}

function buildAirUrl(latitude: number, longitude: number) {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "pm10,pm2_5,us_aqi");
  url.searchParams.set("timezone", "Asia/Bangkok");
  return url.toString();
}

export async function syncOpenMeteoAirQuality() {
  const results = await Promise.all(
    thailandMonitoringCities.map(async (city) => {
      const payload = await fetchJsonOrNull<OpenMeteoAirPayload>(buildAirUrl(city.lat, city.lon));
      if (!payload?.current) {
        return null;
      }

      return {
        city,
        aqi: Math.round(payload.current.us_aqi ?? 0),
        pm25: Math.round(payload.current.pm2_5 ?? 0),
        pm10: Math.round(payload.current.pm10 ?? 0)
      };
    })
  );

  const liveCities = results.filter((item): item is NonNullable<(typeof results)[number]> => Boolean(item));
  if (liveCities.length === 0) {
    return buildResult({
      sourceId: "open-meteo-air",
      status: "stale",
      message: "Air-quality endpoint unavailable. Retaining cached AQI layer.",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api"
    });
  }

  const highestAqiCity = [...liveCities].sort((left, right) => right.aqi - left.aqi)[0] ?? liveCities[0];
  const features: GeoFeatureRecord[] = liveCities.map((item) => ({
    id: `pollution-${item.city.slug}`,
    layerId: "pollution",
    geometryType: "Point",
    coordinates: [item.city.lon, item.city.lat],
    title: item.city.labelEn,
    description: `${item.city.labelEn} AQI watchpoint`,
    properties: {
      city: item.city.labelEn,
      region: item.city.regionEn,
      aqi: item.aqi,
      pm25: item.pm25,
      pm10: item.pm10,
      population: item.city.population ?? null
    },
    source: {
      sourceName: "Open-Meteo Air Quality",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.86,
      fallbackMode: "live"
    }
  }));

  const bounds = [
    Math.min(...liveCities.map((item) => item.city.lat)),
    Math.min(...liveCities.map((item) => item.city.lon)),
    Math.max(...liveCities.map((item) => item.city.lat)),
    Math.max(...liveCities.map((item) => item.city.lon))
  ] as [number, number, number, number];

  const mapCollection: MapFeatureCollection = {
    layerId: "pollution",
    updatedAt: new Date().toISOString(),
    features,
    bounds,
    source: {
      sourceName: "Open-Meteo Air Quality",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.86,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: "open-meteo-air",
    status: "live",
    message: `Air-quality feed refreshed for ${liveCities.length} Thai cities.`,
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    mapFeatureCollections: [mapCollection],
    resiliencePatch: {
      aqi: highestAqiCity.aqi,
      pollutionSummary: {
        th: `${highestAqiCity.city.labelTh} AQI ${highestAqiCity.aqi} | PM2.5 ${highestAqiCity.pm25} | PM10 ${highestAqiCity.pm10}`,
        en: `${highestAqiCity.city.labelEn} AQI ${highestAqiCity.aqi} | PM2.5 ${highestAqiCity.pm25} | PM10 ${highestAqiCity.pm10}`
      }
    }
  });
}
