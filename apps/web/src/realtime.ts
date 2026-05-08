import { useQuery } from "@tanstack/react-query";

// Default coords: Muang Thong Thani in Nonthaburi
const DEFAULT_LAT = 13.9134;
const DEFAULT_LON = 100.5418;

// SE Asia bounding box for filtering global feeds (covers Thailand + neighbors that
// share seismic / weather context — Myanmar, Laos, Cambodia, peninsular Vietnam)
const SE_ASIA_BBOX = { minLat: 5, maxLat: 28, minLon: 92, maxLon: 110 };

// ── Weather via wttr.in (Open-Meteo's free tier hits per-IP daily limits) ──
export interface OpenMeteoWeather {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

const WTTR_LOCATION_BY_COORDS = (lat: number, lon: number) => {
  // wttr.in accepts city names better than coords; pick the closest known city
  if (Math.abs(lat - 13.9134) < 0.2 && Math.abs(lon - 100.5418) < 0.2) return "Nonthaburi";
  if (Math.abs(lat - 13.7563) < 0.2 && Math.abs(lon - 100.5018) < 0.2) return "Bangkok";
  return `${lat},${lon}`;
};

export function useOpenMeteoWeather(lat: number = DEFAULT_LAT, lon: number = DEFAULT_LON) {
  return useQuery<OpenMeteoWeather>({
    queryKey: ["wttr-current", lat, lon],
    queryFn: async () => {
      const location = WTTR_LOCATION_BY_COORDS(lat, lon);
      const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`wttr ${res.status}`);
      const data = await res.json();
      const c = data?.current_condition?.[0];
      if (!c) throw new Error("wttr no current_condition");
      return {
        current: {
          time: c.localObsDateTime ?? new Date().toISOString(),
          temperature_2m: parseFloat(c.temp_C),
          apparent_temperature: parseFloat(c.FeelsLikeC),
          relative_humidity_2m: parseFloat(c.humidity),
          precipitation: parseFloat(c.precipMM ?? "0"),
          weather_code: parseInt(c.weatherCode ?? "0", 10),
          wind_speed_10m: parseFloat(c.windspeedKmph ?? "0"),
        },
      };
    },
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
}

// ── Open-Meteo air quality ──
export interface OpenMeteoAirQuality {
  current: {
    time: string;
    pm2_5: number;
    pm10: number;
    us_aqi: number;
    european_aqi: number;
    nitrogen_dioxide: number;
    ozone: number;
    carbon_monoxide: number;
  };
}

export function useOpenMeteoAirQuality(lat: number = DEFAULT_LAT, lon: number = DEFAULT_LON) {
  return useQuery<OpenMeteoAirQuality>({
    queryKey: ["open-meteo-aq", lat, lon],
    queryFn: async () => {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi,european_aqi,nitrogen_dioxide,ozone,carbon_monoxide&timezone=Asia%2FBangkok`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`aq ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.reason || "aq error");
      return data;
    },
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
}

// ── USGS earthquakes near Thailand ──
export interface USGSQuake {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  depth: number;
  lat: number;
  lon: number;
}

export function useThailandEarthquakes() {
  return useQuery<USGSQuake[]>({
    queryKey: ["usgs-quakes-seasia"],
    queryFn: async () => {
      // 1.0_week catches all M1+ events worldwide; we filter to SE Asia bbox.
      // M2.5_week was missing Myanmar/Laos border events that matter for TH.
      const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`usgs ${res.status}`);
      const data = await res.json();
      const filtered: USGSQuake[] = [];
      for (const f of data.features ?? []) {
        const [lon, lat, depth] = f.geometry?.coordinates ?? [0, 0, 0];
        if (
          lat >= SE_ASIA_BBOX.minLat &&
          lat <= SE_ASIA_BBOX.maxLat &&
          lon >= SE_ASIA_BBOX.minLon &&
          lon <= SE_ASIA_BBOX.maxLon
        ) {
          filtered.push({
            id: f.id,
            mag: f.properties?.mag ?? 0,
            place: f.properties?.place ?? "",
            time: f.properties?.time ?? 0,
            url: f.properties?.url ?? "",
            depth,
            lat,
            lon,
          });
        }
      }
      filtered.sort((a, b) => b.time - a.time);
      return filtered;
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}

// ── FX (USD/THB) via open.er-api.com ──
export interface FxRate {
  base: string;
  thb: number;
  updatedAt: string;
}

export function useUsdThbRate() {
  return useQuery<FxRate>({
    queryKey: ["fx-usd-thb"],
    queryFn: async () => {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error(`fx ${res.status}`);
      const data = await res.json();
      return {
        base: "USD",
        thb: data.rates?.THB ?? 0,
        updatedAt: data.time_last_update_utc ?? new Date().toISOString(),
      };
    },
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
    retry: 1,
  });
}

// ── CoinGecko: BTC + PAX Gold (spot gold proxy) ──
export interface CoinPrices {
  btc: { usd: number; change24h: number };
  gold: { usd: number; change24h: number };
}

export function useCoinPrices() {
  return useQuery<CoinPrices>({
    queryKey: ["coingecko-btc-gold"],
    queryFn: async () => {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,pax-gold&vs_currencies=usd&include_24hr_change=true";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`coingecko ${res.status}`);
      const data = await res.json();
      return {
        btc: {
          usd: data.bitcoin?.usd ?? 0,
          change24h: data.bitcoin?.usd_24h_change ?? 0,
        },
        gold: {
          usd: data["pax-gold"]?.usd ?? 0,
          change24h: data["pax-gold"]?.usd_24h_change ?? 0,
        },
      };
    },
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}

// ── GDELT news from Thai sources ──
export interface GdeltArticle {
  url: string;
  title: string;
  domain: string;
  language: string;
  seendate: string;
}

export function useGdeltThaiNews() {
  return useQuery<GdeltArticle[]>({
    queryKey: ["gdelt-thai-domains"],
    queryFn: async () => {
      // Filter to major Thai English-language news domains. The previous
      // sourcecountry:thailand filter returned Thai-published articles about
      // global topics; domain filter gets Thailand-relevant news directly.
      const query =
        "(domain:bangkokpost.com OR domain:nationthailand.com OR domain:thaipbsworld.com OR domain:khaosodenglish.com)";
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=JSON&maxrecords=15&sort=DateDesc`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gdelt ${res.status}`);
      const data = await res.json();
      const articles = (data.articles ?? []) as GdeltArticle[];
      // Strip "Bangkok Post - " prefix that the GDELT scraper adds
      return articles.map((a) => ({
        ...a,
        title: a.title.replace(/^Bangkok Post\s*-\s*/i, "").replace(/^Nation Thailand\s*-\s*/i, "").trim(),
      }));
    },
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
}

// ── Helpers ──
export function aqiBand(aqi: number, lang: "en" | "th" = "en"): string {
  if (aqi <= 50) return lang === "th" ? "ดี" : "Good";
  if (aqi <= 100) return lang === "th" ? "ปานกลาง" : "Moderate";
  if (aqi <= 150) return lang === "th" ? "เริ่มมีผลกระทบ" : "Sensitive";
  if (aqi <= 200) return lang === "th" ? "ไม่ดีต่อสุขภาพ" : "Unhealthy";
  if (aqi <= 300) return lang === "th" ? "เสียหายมาก" : "Very Unhealthy";
  return lang === "th" ? "อันตราย" : "Hazardous";
}

export function aqiTone(aqi: number): "good" | "moderate" | "unhealthy" {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  return "unhealthy";
}

export function quakeFreshness(time: number): string {
  const ageMs = Date.now() - time;
  const mins = Math.floor(ageMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
