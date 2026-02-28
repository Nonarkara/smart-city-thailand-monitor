import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface OpenMeteoWeatherPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
}

export async function syncOpenMeteoWeather() {
  const payload = await fetchJsonOrNull<OpenMeteoWeatherPayload>(config.weatherEndpoint);
  if (!payload?.current) {
    return buildResult({
      sourceId: "open-meteo-weather",
      status: "stale",
      message: "Weather endpoint unavailable. Retaining cached weather summary.",
      sourceUrl: "https://open-meteo.com/en/docs"
    });
  }

  const temperature = Math.round(payload.current.temperature_2m ?? 0);
  const humidity = Math.round(payload.current.relative_humidity_2m ?? 0);
  const wind = Math.round(payload.current.wind_speed_10m ?? 0);

  return buildResult({
    sourceId: "open-meteo-weather",
    status: "live",
    message: "Weather feed refreshed.",
    sourceUrl: "https://open-meteo.com/en/docs",
    resiliencePatch: {
      weatherTemperatureC: temperature,
      weatherSummary: {
        th: `กรุงเทพฯ ${temperature}°C ความชื้น ${humidity}% ลม ${wind} กม./ชม.`,
        en: `Bangkok ${temperature}C, humidity ${humidity}%, wind ${wind} km/h.`
      }
    }
  });
}

