import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { XMLParser } from "fast-xml-parser";
import { buildResult, fetchTextOrNull } from "./common.js";
import { config } from "../config.js";

const SOURCE_ID = "tmd-weather";
const SOURCE_URL = "https://www.tmd.go.th";

interface TmdForecastItem {
  date?: string;
  detail?: string;
  tempMax?: string | number;
  tempMin?: string | number;
  rain?: string | number;
}

export async function syncTmdWeather() {
  const xml = await fetchTextOrNull(config.tmdRssEndpoint);

  if (!xml) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: "stale",
      message: "TMD RSS feed unavailable. Using cached weather data.",
      sourceUrl: SOURCE_URL
    });
  }

  const fetchedAt = new Date().toISOString();
  const parser = new XMLParser({ ignoreAttributes: false, textNodeName: "_text" });

  let forecasts: TmdForecastItem[] = [];
  let warningText = "";

  try {
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? parsed;

    const items = Array.isArray(channel?.item)
      ? channel.item
      : channel?.item
        ? [channel.item]
        : [];

    forecasts = items.map((item: Record<string, unknown>) => ({
      date: String(item?.title ?? item?.pubDate ?? ""),
      detail: String(item?.description ?? item?._text ?? ""),
      tempMax: undefined,
      tempMin: undefined,
      rain: undefined
    }));

    const descriptionText = items.map((i: Record<string, unknown>) => String(i?.description ?? "")).join(" ");
    const warningMatch = descriptionText.match(/(?:เตือน|warning|พายุ|storm|ฝนตกหนัก|heavy rain)[^.]*\./i);
    if (warningMatch) {
      warningText = warningMatch[0];
    }
  } catch {
    return buildResult({
      sourceId: SOURCE_ID,
      status: "stale",
      message: "Failed to parse TMD RSS XML.",
      sourceUrl: SOURCE_URL
    });
  }

  const sourceMeta = {
    sourceName: "Thai Meteorological Department",
    sourceUrl: SOURCE_URL,
    fetchedAt,
    publishedAt: fetchedAt,
    freshnessStatus: "live" as const,
    confidence: 0.85,
    fallbackMode: "live" as const
  };

  const features: GeoFeatureRecord[] = [];

  if (forecasts.length > 0) {
    features.push({
      id: "tmd-bangkok-forecast",
      layerId: "weather",
      geometryType: "Point",
      coordinates: [100.5018, 13.7563],
      title: "TMD Bangkok Forecast",
      description: forecasts[0]?.detail?.slice(0, 200) ?? "Central Thailand forecast",
      properties: {
        source: "TMD",
        forecastDays: forecasts.length,
        citySlug: "bangkok",
        hasWarning: warningText.length > 0
      },
      source: sourceMeta
    });
  }

  const warnings = warningText
    ? [{ th: warningText, en: warningText }]
    : [];

  const weatherSummary = forecasts[0]?.detail
    ? {
        th: `กรมอุตุฯ: ${forecasts[0].detail.slice(0, 120)}`,
        en: `TMD: ${forecasts[0].detail.slice(0, 120)}`
      }
    : undefined;

  const mapCollection: MapFeatureCollection = {
    layerId: "weather",
    updatedAt: fetchedAt,
    features,
    source: sourceMeta
  };

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `TMD forecast synced with ${forecasts.length} items${warningText ? " (warning active)" : ""}.`,
    sourceUrl: SOURCE_URL,
    mapFeatureCollections: features.length > 0 ? [mapCollection] : undefined,
    resiliencePatch: {
      ...(weatherSummary ? { weatherSummary } : {}),
      ...(warnings.length > 0 ? { warnings } : {})
    }
  });
}
