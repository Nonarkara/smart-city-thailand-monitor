import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull, thailandMonitoringCities } from "./common.js";

interface OpenMeteoWeatherPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
}

function buildWeatherUrl(latitude: number, longitude: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m");
  url.searchParams.set("timezone", "Asia/Bangkok");
  return url.toString();
}

export async function syncOpenMeteoWeather() {
  const results = await Promise.all(
    thailandMonitoringCities.map(async (city) => {
      const payload = await fetchJsonOrNull<OpenMeteoWeatherPayload>(buildWeatherUrl(city.lat, city.lon));
      if (!payload?.current) {
        return null;
      }

      return {
        city,
        temperature: Math.round(payload.current.temperature_2m ?? 0),
        humidity: Math.round(payload.current.relative_humidity_2m ?? 0),
        wind: Math.round(payload.current.wind_speed_10m ?? 0)
      };
    })
  );

  const liveCities = results.filter((item): item is NonNullable<(typeof results)[number]> => Boolean(item));
  if (liveCities.length === 0) {
    return buildResult({
      sourceId: "open-meteo-weather",
      status: "stale",
      message: "Weather endpoint unavailable. Retaining cached national weather layer.",
      sourceUrl: "https://open-meteo.com/en/docs"
    });
  }

  const hottestCity = [...liveCities].sort((left, right) => right.temperature - left.temperature)[0] ?? liveCities[0];
  const features: GeoFeatureRecord[] = liveCities.map((item) => ({
    id: `weather-${item.city.slug}`,
    layerId: "weather",
    geometryType: "Point",
    coordinates: [item.city.lon, item.city.lat],
    title: item.city.labelEn,
    description: `${item.city.labelEn} live weather watchpoint`,
    properties: {
      city: item.city.labelEn,
      region: item.city.regionEn,
      temperatureC: item.temperature,
      humidity: item.humidity,
      windKmH: item.wind,
      population: item.city.population ?? null
    },
    source: {
      sourceName: "Open-Meteo Forecast",
      sourceUrl: "https://open-meteo.com/en/docs",
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.88,
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
    layerId: "weather",
    updatedAt: new Date().toISOString(),
    features,
    bounds,
    source: {
      sourceName: "Open-Meteo Forecast",
      sourceUrl: "https://open-meteo.com/en/docs",
      fetchedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      freshnessStatus: "live",
      confidence: 0.88,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: "open-meteo-weather",
    status: "live",
    message: `Weather feed refreshed for ${liveCities.length} Thai cities.`,
    sourceUrl: "https://open-meteo.com/en/docs",
    mapFeatureCollections: [mapCollection],
    resiliencePatch: {
      weatherTemperatureC: hottestCity.temperature,
      weatherSummary: {
        th: `${hottestCity.city.labelTh} ${hottestCity.temperature}°C | ความชื้น ${hottestCity.humidity}% | ลม ${hottestCity.wind} กม./ชม.`,
        en: `${hottestCity.city.labelEn} ${hottestCity.temperature}C | humidity ${hottestCity.humidity}% | wind ${hottestCity.wind} km/h.`
      }
    }
  });
}
