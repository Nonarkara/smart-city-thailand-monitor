import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface OpenMeteoAirPayload {
  current?: {
    pm2_5?: number;
    pm10?: number;
    us_aqi?: number;
  };
}

export async function syncOpenMeteoAirQuality() {
  const payload = await fetchJsonOrNull<OpenMeteoAirPayload>(config.airQualityEndpoint);
  if (!payload?.current) {
    return buildResult({
      sourceId: "open-meteo-air",
      status: "stale",
      message: "Air-quality endpoint unavailable. Retaining cached AQI summary.",
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api"
    });
  }

  const aqi = Math.round(payload.current.us_aqi ?? 0);
  const pm25 = Math.round(payload.current.pm2_5 ?? 0);
  const pm10 = Math.round(payload.current.pm10 ?? 0);

  return buildResult({
    sourceId: "open-meteo-air",
    status: "live",
    message: "Air-quality feed refreshed.",
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    resiliencePatch: {
      aqi,
      pollutionSummary: {
        th: `AQI ${aqi} | PM2.5 ${pm25} | PM10 ${pm10}`,
        en: `AQI ${aqi} | PM2.5 ${pm25} | PM10 ${pm10}`
      }
    }
  });
}

