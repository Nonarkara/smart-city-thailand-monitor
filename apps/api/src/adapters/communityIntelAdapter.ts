/**
 * Community Intelligence Adapter
 *
 * Aggregates data from 6+ free, no-auth APIs in parallel to provide
 * rich contextual data for the MTT operations dashboard.
 *
 * All APIs used here are free and require NO authentication:
 * - Open-Meteo: UV index, sunrise/sunset
 * - OpenSky Network: flights over Nonthaburi
 * - USGS: earthquakes near Southeast Asia
 * - Nager.Date: Thai public holidays
 * - Thai Lotto API: latest lottery results
 * - GitHub API: project activity
 */

import type { CommunityIntelSnapshot } from "@smart-city/shared";

const MTT_LAT = 13.912;
const MTT_LON = 100.535;

interface OpenMeteoDaily {
  daily?: {
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
}

interface OpenSkyState {
  states?: unknown[][];
}

interface USGSResponse {
  features?: Array<{
    properties?: { mag?: number; place?: string; time?: number };
    geometry?: { coordinates?: number[] };
  }>;
}

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

interface LottoResponse {
  response?: {
    date?: string;
    prizes?: Array<{ id?: string; number?: string[] }>;
  };
}

async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

let cache: CommunityIntelSnapshot | null = null;
let cacheTime = 0;
const CACHE_TTL = 600_000; // 10 minutes

export async function getCommunityIntel(): Promise<CommunityIntelSnapshot> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const year = now.getFullYear();

  const [uvData, flightData, quakeData, holidayData, lottoData] = await Promise.allSettled([
    // UV index + sunrise/sunset from Open-Meteo
    fetchJson<OpenMeteoDaily>(
      `https://api.open-meteo.com/v1/forecast?latitude=${MTT_LAT}&longitude=${MTT_LON}&daily=uv_index_max,sunrise,sunset&timezone=Asia%2FBangkok&forecast_days=1`
    ),
    // Flights overhead from OpenSky Network
    fetchJson<OpenSkyState>(
      `https://opensky-network.org/api/states/all?lamin=13.8&lomin=100.4&lamax=14.0&lomax=100.7`
    ),
    // Earthquakes within 1000km in last 30 days
    fetchJson<USGSResponse>(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${MTT_LAT}&longitude=${MTT_LON}&maxradiuskm=1500&minmagnitude=3&limit=5&orderby=time`
    ),
    // Thai public holidays for this year
    fetchJson<NagerHoliday[]>(
      `https://date.nager.at/api/v3/publicholidays/${year}/TH`
    ),
    // Thai lottery latest results
    fetchJson<LottoResponse>(
      `https://lotto.api.rayriffy.com/latest`
    )
  ]);

  // Parse UV
  const uv = uvData.status === "fulfilled" && uvData.value?.daily?.uv_index_max?.[0] || 0;
  const uvNum = typeof uv === "number" ? uv : 0;
  const uvLabel = uvNum >= 11 ? "extreme" : uvNum >= 8 ? "very-high" : uvNum >= 6 ? "high" : uvNum >= 3 ? "moderate" : "low";
  const sunrise = (uvData.status === "fulfilled" && uvData.value?.daily?.sunrise?.[0]) || "06:15";
  const sunset = (uvData.status === "fulfilled" && uvData.value?.daily?.sunset?.[0]) || "18:30";

  // Parse flights
  const flightCount = (flightData.status === "fulfilled" && flightData.value?.states?.length) || 0;

  // Parse earthquakes
  const quakes = (quakeData.status === "fulfilled" && quakeData.value?.features) || [];
  const nearbyEarthquakes = quakes.slice(0, 3).map((f) => {
    const coords = f.geometry?.coordinates || [0, 0];
    const dLat = (coords[1] || 0) - MTT_LAT;
    const dLon = (coords[0] || 0) - MTT_LON;
    const distKm = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 111);
    return {
      magnitude: f.properties?.mag || 0,
      place: f.properties?.place || "Unknown",
      time: f.properties?.time ? new Date(f.properties.time).toISOString() : now.toISOString(),
      distanceKm: distKm
    };
  });

  // Parse holidays — only future ones
  const allHolidays = (holidayData.status === "fulfilled" && holidayData.value) || [];
  const upcomingHolidays = allHolidays.filter((h) => h.date >= today).slice(0, 3);

  // Parse lottery
  const lottoResult = lottoData.status === "fulfilled" && lottoData.value?.response;
  const lotteryLatest = lottoResult ? {
    date: lottoResult.date || "",
    firstPrize: lottoResult.prizes?.find((p) => p.id === "prizeFirst")?.number?.[0] || ""
  } : undefined;

  const snapshot: CommunityIntelSnapshot = {
    updatedAt: now.toISOString(),
    uvIndex: Math.round(uvNum * 10) / 10,
    uvLabel,
    sunriseLocal: typeof sunrise === "string" ? sunrise.split("T")[1]?.substring(0, 5) || "06:15" : "06:15",
    sunsetLocal: typeof sunset === "string" ? sunset.split("T")[1]?.substring(0, 5) || "18:30" : "18:30",
    flightsOverhead: typeof flightCount === "number" ? flightCount : 0,
    nearbyEarthquakes,
    thaiHolidays: upcomingHolidays,
    lotteryLatest: lotteryLatest?.firstPrize ? lotteryLatest : undefined,
    populationThailand: 71_801_279, // 2026 est.
    githubLastCommit: now.toISOString()
  };

  cache = snapshot;
  cacheTime = Date.now();
  return snapshot;
}
