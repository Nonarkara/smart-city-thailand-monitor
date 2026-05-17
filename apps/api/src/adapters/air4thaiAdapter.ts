import type { GeoFeatureRecord, MapFeatureCollection } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull } from "./common.js";
import { config } from "../config.js";

interface WaqiStation {
  uid?: number;
  aqi?: string | number;
  lat?: number;
  lon?: number;
  station?: { name?: string };
}

interface WaqiMapResponse {
  status?: string;
  data?: WaqiStation[];
}

interface Air4ThaiStation {
  stationID?: string;
  nameTH?: string;
  nameEN?: string;
  lat?: string | number;
  long?: string | number;
  AQILast?: { AQI?: { aqi?: string | number } };
  PM25?: { value?: string | number };
  PM10?: { value?: string | number };
  O3?: { value?: string | number };
}

interface Air4ThaiResponse {
  stations?: Air4ThaiStation[];
}

const SOURCE_ID = "air4thai";
const SOURCE_URL = "http://air4thai.pcd.go.th";

function isInBangkok(lat: number, lon: number) {
  return lat >= 13.45 && lat <= 13.95 && lon >= 100.35 && lon <= 100.85;
}

async function fetchWaqiStations(): Promise<GeoFeatureRecord[]> {
  const url = `https://api.waqi.info/v2/map/bounds?latlng=13.45,100.35,13.95,100.85&networks=all&token=${config.waqiApiToken}`;
  const payload = await fetchJsonOrNull<WaqiMapResponse>(url);
  const stations = payload?.data ?? [];
  const fetchedAt = new Date().toISOString();

  return stations
    .filter((s) => s.lat && s.lon && s.aqi && isInBangkok(s.lat, s.lon))
    .map((s) => {
      const aqi = typeof s.aqi === "string" ? parseInt(s.aqi, 10) : (s.aqi ?? 0);
      return {
        id: `air4thai-waqi-${s.uid ?? Math.random().toString(36).slice(2, 8)}`,
        layerId: "air4thai",
        geometryType: "Point" as const,
        coordinates: [s.lon!, s.lat!],
        title: s.station?.name ?? "AQI Station",
        description: `AQI ${isNaN(aqi) ? "N/A" : aqi}`,
        properties: {
          aqi: isNaN(aqi) ? 0 : aqi,
          source: "WAQI",
          citySlug: "bangkok"
        },
        source: {
          sourceName: "WAQI / Air4Thai",
          sourceUrl: SOURCE_URL,
          fetchedAt,
          publishedAt: fetchedAt,
          freshnessStatus: "live" as const,
          confidence: 0.88,
          fallbackMode: "live" as const
        }
      };
    });
}

async function fetchAir4ThaiStations(): Promise<GeoFeatureRecord[]> {
  const payload = await fetchJsonOrNull<Air4ThaiResponse>(config.air4thaiEndpoint);
  const stations = payload?.stations ?? [];
  const fetchedAt = new Date().toISOString();

  return stations
    .filter((s) => {
      const lat = typeof s.lat === "string" ? parseFloat(s.lat) : s.lat;
      const lon = typeof s.long === "string" ? parseFloat(s.long) : s.long;
      return lat && lon && isInBangkok(lat, lon);
    })
    .map((s) => {
      const lat = typeof s.lat === "string" ? parseFloat(s.lat) : (s.lat ?? 0);
      const lon = typeof s.long === "string" ? parseFloat(s.long) : (s.long ?? 0);
      const aqi = typeof s.AQILast?.AQI?.aqi === "string"
        ? parseInt(s.AQILast.AQI.aqi, 10)
        : (s.AQILast?.AQI?.aqi as number ?? 0);
      const pm25 = typeof s.PM25?.value === "string" ? parseFloat(s.PM25.value) : (s.PM25?.value as number ?? 0);
      const pm10 = typeof s.PM10?.value === "string" ? parseFloat(s.PM10.value) : (s.PM10?.value as number ?? 0);

      return {
        id: `air4thai-pcd-${s.stationID ?? Math.random().toString(36).slice(2, 8)}`,
        layerId: "air4thai",
        geometryType: "Point" as const,
        coordinates: [lon, lat],
        title: s.nameEN ?? s.nameTH ?? "PCD Station",
        description: `AQI ${aqi} | PM2.5 ${pm25} | PM10 ${pm10}`,
        properties: {
          aqi,
          pm25,
          pm10,
          source: "PCD",
          stationId: s.stationID ?? "",
          citySlug: "bangkok"
        },
        source: {
          sourceName: "Air4Thai (PCD)",
          sourceUrl: SOURCE_URL,
          fetchedAt,
          publishedAt: fetchedAt,
          freshnessStatus: "live" as const,
          confidence: 0.92,
          fallbackMode: "live" as const
        }
      };
    });
}

export async function syncAir4Thai() {
  const [waqiFeatures, pcdFeatures] = await Promise.allSettled([
    fetchWaqiStations(),
    fetchAir4ThaiStations()
  ]);

  const features = [
    ...(waqiFeatures.status === "fulfilled" ? waqiFeatures.value : []),
    ...(pcdFeatures.status === "fulfilled" ? pcdFeatures.value : [])
  ];

  if (features.length === 0) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: "stale",
      message: "No Air4Thai/WAQI station data available. Retaining cached layer.",
      sourceUrl: SOURCE_URL
    });
  }

  const fetchedAt = new Date().toISOString();
  const aqiValues = features
    .map((f) => f.properties.aqi as number)
    .filter((v) => v > 0);
  const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : 0;
  const avgAqi = aqiValues.length > 0 ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) : 0;

  const bounds: [number, number, number, number] = [
    Math.min(...features.map((f) => (f.coordinates as [number, number])[1])),
    Math.min(...features.map((f) => (f.coordinates as [number, number])[0])),
    Math.max(...features.map((f) => (f.coordinates as [number, number])[1])),
    Math.max(...features.map((f) => (f.coordinates as [number, number])[0]))
  ];

  const mapCollection: MapFeatureCollection = {
    layerId: "air4thai",
    updatedAt: fetchedAt,
    features,
    bounds,
    source: {
      sourceName: "Air4Thai / WAQI",
      sourceUrl: SOURCE_URL,
      fetchedAt,
      publishedAt: fetchedAt,
      freshnessStatus: "live",
      confidence: 0.90,
      fallbackMode: "live"
    }
  };

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `${features.length} official AQI stations refreshed. Peak AQI ${peakAqi}, avg ${avgAqi}.`,
    sourceUrl: SOURCE_URL,
    mapFeatureCollections: [mapCollection],
    resiliencePatch: {
      aqi: peakAqi,
      pollutionSummary: {
        th: `กรุงเทพฯ AQI สูงสุด ${peakAqi} | เฉลี่ย ${avgAqi} (${features.length} สถานี)`,
        en: `Bangkok Peak AQI ${peakAqi} | Avg ${avgAqi} (${features.length} stations)`
      }
    }
  });
}
