import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import {
  buildResult,
  fetchJsonOrNull,
  thailandMonitoringCities,
  type MonitoringCity
} from "./common.js";

interface OpenMeteoWeatherPayload {
  latitude?: number;
  longitude?: number;
  location_id?: number;
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    precipitation_probability?: number;
  };
}

type OpenMeteoWeatherResponse = OpenMeteoWeatherPayload | OpenMeteoWeatherPayload[];

interface LiveWeatherCity {
  city: MonitoringCity;
  temperature: number;
  humidity: number;
  wind: number;
  precipitationMm: number;
  precipitationProbability: number;
}

function buildWeatherUrl(cities: MonitoringCity[]) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", cities.map((city) => city.lat.toFixed(4)).join(","));
  url.searchParams.set("longitude", cities.map((city) => city.lon.toFixed(4)).join(","));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,precipitation_probability"
  );
  url.searchParams.set("timezone", "Asia/Bangkok");
  return url.toString();
}

function normalizePayload(payload: OpenMeteoWeatherResponse | null) {
  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : [payload];
}

export async function syncOpenMeteoWeather() {
  const payload = await fetchJsonOrNull<OpenMeteoWeatherResponse>(buildWeatherUrl(thailandMonitoringCities));
  const liveCities = normalizePayload(payload)
    .map((entry, index) => {
      const city = thailandMonitoringCities[index];
      if (!city || !entry?.current) {
        return null;
      }

      return {
        city,
        temperature: Math.round(entry.current.temperature_2m ?? 0),
        humidity: Math.round(entry.current.relative_humidity_2m ?? 0),
        wind: Math.round(entry.current.wind_speed_10m ?? 0),
        precipitationMm: Number((entry.current.precipitation ?? 0).toFixed(1)),
        precipitationProbability: Math.round(entry.current.precipitation_probability ?? 0)
      };
    })
    .filter((item): item is LiveWeatherCity => Boolean(item));

  if (liveCities.length === 0) {
    return buildResult({
      sourceId: "open-meteo-weather",
      status: "stale",
      message: "Weather endpoint unavailable. Retaining cached national weather layer.",
      sourceUrl: "https://open-meteo.com/en/docs"
    });
  }

  const hottestCity = [...liveCities].sort((left, right) => right.temperature - left.temperature)[0] ?? liveCities[0];
  const wettestCity =
    [...liveCities].sort((left, right) => {
      if (right.precipitationMm !== left.precipitationMm) {
        return right.precipitationMm - left.precipitationMm;
      }

      return right.precipitationProbability - left.precipitationProbability;
    })[0] ?? liveCities[0];
  const summaryCity =
    wettestCity.precipitationMm > 0 || wettestCity.precipitationProbability >= 40 ? wettestCity : hottestCity;
  const fetchedAt = new Date().toISOString();
  const features: GeoFeatureRecord[] = liveCities.map((item) => ({
    id: `weather-${item.city.slug}`,
    layerId: "weather",
    geometryType: "Point",
    coordinates: [item.city.lon, item.city.lat],
    title: item.city.labelEn,
    description:
      item.precipitationMm > 0 || item.precipitationProbability >= 30
        ? `${item.city.labelEn} live weather watchpoint with rain signal`
        : `${item.city.labelEn} live weather watchpoint`,
    properties: {
      city: item.city.labelEn,
      citySlug: item.city.slug,
      region: item.city.regionEn,
      temperatureC: item.temperature,
      humidity: item.humidity,
      windKph: item.wind,
      precipitationMm: item.precipitationMm,
      precipitationProbability: item.precipitationProbability,
      population: item.city.population ?? null
    },
    source: {
      sourceName: "Open-Meteo Forecast",
      sourceUrl: "https://open-meteo.com/en/docs",
      fetchedAt,
      publishedAt: fetchedAt,
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
    updatedAt: fetchedAt,
    features,
    bounds,
    source: {
      sourceName: "Open-Meteo Forecast",
      sourceUrl: "https://open-meteo.com/en/docs",
      fetchedAt,
      publishedAt: fetchedAt,
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
        th:
          summaryCity.precipitationMm > 0 || summaryCity.precipitationProbability >= 40
            ? `${summaryCity.city.labelTh} ฝน ${summaryCity.precipitationMm.toFixed(1)} มม. | โอกาสฝน ${summaryCity.precipitationProbability}% | ลม ${summaryCity.wind} กม./ชม.`
            : `${summaryCity.city.labelTh} ${summaryCity.temperature}°C | ความชื้น ${summaryCity.humidity}% | ลม ${summaryCity.wind} กม./ชม.`,
        en:
          summaryCity.precipitationMm > 0 || summaryCity.precipitationProbability >= 40
            ? `${summaryCity.city.labelEn} rain ${summaryCity.precipitationMm.toFixed(1)} mm | chance ${summaryCity.precipitationProbability}% | wind ${summaryCity.wind} km/h.`
            : `${summaryCity.city.labelEn} ${summaryCity.temperature}C | humidity ${summaryCity.humidity}% | wind ${summaryCity.wind} km/h.`
      }
    }
  });
}
