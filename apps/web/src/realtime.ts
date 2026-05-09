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
    queryKey: ["gdelt-bangkok-broad"],
    queryFn: async () => {
      // Single GDELT call covering Bangkok Governor + air pollution + general
      // Bangkok / Thailand stories. Simple query gets through GDELT's rate
      // limiter more reliably than multi-clause domain filters.
      // GDELT requires OR'd terms in parens. Phrase-quoted Bangkok-specific
      // topics return more relevant results than bare keyword OR.
      const query = `("Bangkok air pollution" OR "Bangkok air quality" OR "Bangkok Governor" OR Chadchart OR Sittipunt OR "Bangkok smog" OR "Bangkok PM2.5" OR "Bangkok Metropolitan Administration") sourcelang:eng`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=JSON&maxrecords=30&sort=DateDesc`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gdelt ${res.status}`);
      const data = await res.json();
      const articles = (data.articles ?? []) as GdeltArticle[];
      return articles.map((a) => ({
        ...a,
        title: a.title.replace(/^Bangkok Post\s*-\s*/i, "").replace(/^Nation Thailand\s*-\s*/i, "").trim(),
      }));
    },
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 2,
    retryDelay: (attempt) => attempt * 6000,
  });
}

// ── Derived intelligence: tone + volume + Governor articles from a single fetch ──
// Heuristic tone from headlines: GDELT TimelineTone is rate-limited / occasionally
// CORS-blocked, so we score each title against a simple negative/positive lexicon.
// Output is roughly comparable to GDELT's -10..+10 scale.
const NEGATIVE_TERMS = [
  "crisis", "alarm", "record", "pollution", "smog", "hazard", "fail", "delay",
  "warning", "dangerous", "unhealthy", "deadly", "death", "killed", "loss",
  "decline", "collapse", "panic", "concern", "worse", "spike", "surge",
];
const POSITIVE_TERMS = [
  "plan", "improve", "better", "success", "approve", "launch", "open",
  "boost", "gain", "rise", "win", "reform", "investment", "innovation",
  "growth", "deal", "agreement",
];

// BMA = Bangkok Metropolitan Administration; running it is what the Governor does day-to-day.
// Articles about BMA policy / operations are functionally Governor-watch material.
const GOVERNOR_REGEX = /Governor|Chadchart|Sittipunt|ผู้ว่า|\bBMA\b|Bangkok Metropolitan Admin/i;
const POLLUTION_REGEX = /pollution|smog|PM2\.?5|AQI|haze|air[- ]quality|airpocalypse|particulate|ozone|emission|breather|exhaust/i;

export interface NewsIntelligence {
  total: number;
  tone: number;
  governorArticles: GdeltArticle[];
  pollutionArticles: GdeltArticle[];
  pollutionTone: number;
  pollutionVolume: number;
  topThemes: { word: string; count: number }[];
}

const STOPWORDS = new Set([
  "the","a","an","and","or","of","to","in","on","at","for","with","by","from",
  "is","are","was","were","be","been","being","has","have","had","do","does","did",
  "this","that","these","those","it","its","as","but","not","no","so","if","than",
  "bangkok","thailand","thai","city","cities","new","said","says","also","more",
  "after","before","over","under","up","down","into","out","through","about",
  "could","would","should","may","might","will","can","when","where","what","why","how",
  "you","we","they","he","she","i","me","us","them","his","her","their","our","my",
  "post","news","report","story","article","says","told","told","get","gets","got",
  "amp",
]);

export function deriveIntelligence(articles: GdeltArticle[]): NewsIntelligence {
  if (!articles || articles.length === 0) {
    return { total: 0, tone: 0, governorArticles: [], pollutionArticles: [], pollutionTone: 0, pollutionVolume: 0, topThemes: [] };
  }
  const score = (title: string): number => {
    const t = title.toLowerCase();
    let s = 0;
    for (const term of NEGATIVE_TERMS) if (t.includes(term)) s -= 1.5;
    for (const term of POSITIVE_TERMS) if (t.includes(term)) s += 1;
    return s;
  };
  const sumTone = articles.reduce((acc, a) => acc + score(a.title), 0);
  const tone = (sumTone / articles.length) * 2;
  const governorArticles = articles.filter((a) => GOVERNOR_REGEX.test(a.title));
  const pollutionArticles = articles.filter((a) => POLLUTION_REGEX.test(a.title));
  const pollutionTone = pollutionArticles.length > 0
    ? (pollutionArticles.reduce((acc, a) => acc + score(a.title), 0) / pollutionArticles.length) * 2
    : 0;

  // Top Themes: word frequency across all headlines, excluding stopwords + query terms.
  // Surfaces what topics dominate the news cycle right now.
  const wordCounts = new Map<string, number>();
  for (const a of articles) {
    const words = a.title
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (seen.has(w)) continue; // count once per article
      seen.add(w);
      wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
    }
  }
  const topThemes = Array.from(wordCounts.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([word, count]) => ({ word, count }));

  return {
    total: articles.length,
    tone,
    governorArticles,
    pollutionArticles,
    pollutionTone,
    pollutionVolume: pollutionArticles.length,
    topThemes,
  };
}

// ── Live flights overhead — for MTT dashboard (DMK is right next to MTT) ──
// Using adsb.lol — community ADS-B feed with permissive CORS. OpenSky's free
// anon endpoint blocks browser CORS (Access-Control-Allow-Origin: opensky-network.org).
export interface DmkFlight {
  icao24: string;
  callsign: string;
  type: string;          // aircraft type code (A320, B739, etc.)
  registration: string;
  lat: number;
  lon: number;
  altitudeFt: number | null;
  groundSpeedKn: number | null;
  heading: number | null;
  onGround: boolean;
}

export function useOpenSkyDmk() {
  return useQuery<DmkFlight[]>({
    queryKey: ["adsb-dmk"],
    queryFn: async () => {
      // adsb.lol blocks browser CORS; we proxy via a same-origin Pages Function
      // at /api/flights (see apps/web/functions/api/flights.ts).
      // Centered on DMK (13.913°N, 100.607°E), 15nm radius covers approach +
      // departure corridors and Muang Thong Thani.
      const url = "/api/flights?lat=13.9&lon=100.6&dist=15";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`adsb ${res.status}`);
      const data = await res.json();
      const aircraft: any[] = data.ac ?? [];
      const flights: DmkFlight[] = aircraft.map((a) => {
        const altRaw = a.alt_baro;
        const altitudeFt = typeof altRaw === "number" ? altRaw : null;
        const onGround = altRaw === "ground";
        return {
          icao24: String(a.hex ?? ""),
          callsign: String(a.flight ?? "").trim() || `[${a.r ?? a.hex ?? "—"}]`,
          type: String(a.t ?? a.desc ?? "—"),
          registration: String(a.r ?? "—"),
          lat: Number(a.lat ?? 0),
          lon: Number(a.lon ?? 0),
          altitudeFt,
          groundSpeedKn: typeof a.gs === "number" ? a.gs : null,
          heading: typeof a.track === "number" ? a.track : null,
          onGround,
        };
      });
      // Sort by altitude (low first — approaches/departures are the action)
      flights.sort((a, b) => (a.altitudeFt ?? 1e9) - (b.altitudeFt ?? 1e9));
      return flights;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

// ── BMA Open Data Portal — for Bangkok dashboard ──
// Real datasets published by Bangkok Metropolitan Administration on
// data.bangkok.go.th. Surfaces what data the city government is
// actively releasing right now.
export interface BmaDataset {
  title: string;
  name: string;
  notes: string;
  organization: string;
  url: string;
  resourceCount: number;
  updated: string;
}

export function useBmaOpenData() {
  return useQuery<BmaDataset[]>({
    queryKey: ["bma-open-data"],
    queryFn: async () => {
      // Most recently updated BMA datasets
      const url = "https://data.bangkok.go.th/api/3/action/package_search?rows=12&sort=metadata_modified+desc";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`bma ${res.status}`);
      const data = await res.json();
      const results: any[] = data?.result?.results ?? [];
      return results.map((r) => ({
        title: r.title ?? r.name ?? "—",
        name: r.name ?? "",
        notes: (r.notes ?? "").toString().substring(0, 200),
        organization: r.organization?.title ?? r.organization?.name ?? "BMA",
        url: `https://data.bangkok.go.th/dataset/${r.name}`,
        resourceCount: r.num_resources ?? r.resources?.length ?? 0,
        updated: r.metadata_modified ?? "",
      }));
    },
    staleTime: 30 * 60_000,
    refetchInterval: 60 * 60_000,
    retry: 1,
  });
}

// ── data.go.th national portal — Bangkok-tagged datasets ──
export function useThaiOpenData() {
  return useQuery<BmaDataset[]>({
    queryKey: ["data-go-th-bangkok"],
    queryFn: async () => {
      const url = "https://data.go.th/api/3/action/package_search?q=Bangkok&rows=10&sort=metadata_modified+desc";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`datagoth ${res.status}`);
      const data = await res.json();
      const results: any[] = data?.result?.results ?? [];
      return results.map((r) => ({
        title: r.title ?? r.name ?? "—",
        name: r.name ?? "",
        notes: (r.notes ?? "").toString().substring(0, 200),
        organization: r.organization?.title ?? r.organization?.name ?? "data.go.th",
        url: `https://data.go.th/dataset/${r.name}`,
        resourceCount: r.num_resources ?? r.resources?.length ?? 0,
        updated: r.metadata_modified ?? "",
      }));
    },
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
    retry: 1,
  });
}

// ── GDELT Bangkok Governor news ──
// Real-time articles mentioning the Bangkok Governor / Chadchart specifically.
export function useGovernorNews() {
  return useQuery<GdeltArticle[]>({
    queryKey: ["gdelt-bkk-governor"],
    queryFn: async () => {
      const query = `("Bangkok Governor" OR Chadchart) sourcelang:eng`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=JSON&maxrecords=10&sort=DateDesc`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gdelt-gov ${res.status}`);
      const data = await res.json();
      const articles = (data.articles ?? []) as GdeltArticle[];
      return articles.map((a) => ({
        ...a,
        title: a.title.replace(/^Bangkok Post\s*-\s*/i, "").replace(/^Nation Thailand\s*-\s*/i, "").trim(),
      }));
    },
    staleTime: 10 * 60_000,
    refetchInterval: 20 * 60_000,
    retry: 1,
  });
}

// ── GDELT sentiment timeline ──
// Tone series (-10 to +10 per day) for any topic query. Powers the Reality Check.
export interface GdeltTonePoint {
  date: string;
  value: number;
}

export function useSentimentTimeline(query: string, timespan: string = "7d") {
  return useQuery<{ avgTone: number; points: GdeltTonePoint[]; volume: number }>({
    queryKey: ["gdelt-tone", query, timespan],
    queryFn: async () => {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query + " sourcelang:eng")}&mode=TimelineTone&format=JSON&timespan=${timespan}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gdelt-tone ${res.status}`);
      const data = await res.json();
      const series = data?.timeline?.[0]?.data ?? [];
      const points: GdeltTonePoint[] = series.map((p: { date: string; value: number }) => ({
        date: p.date,
        value: typeof p.value === "number" ? p.value : 0,
      }));
      const avgTone = points.length > 0
        ? points.reduce((s, p) => s + p.value, 0) / points.length
        : 0;
      return { avgTone, points, volume: points.length };
    },
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}

// ── GDELT volume timeline ──
// Article volume per day for a topic — useful for "is this story escalating?"
export function useNewsVolume(query: string, timespan: string = "7d") {
  return useQuery<{ total: number; points: GdeltTonePoint[] }>({
    queryKey: ["gdelt-vol", query, timespan],
    queryFn: async () => {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query + " sourcelang:eng")}&mode=TimelineVolRaw&format=JSON&timespan=${timespan}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`gdelt-vol ${res.status}`);
      const data = await res.json();
      const series = data?.timeline?.[0]?.data ?? [];
      const points: GdeltTonePoint[] = series.map((p: { date: string; value: number }) => ({
        date: p.date,
        value: typeof p.value === "number" ? p.value : 0,
      }));
      const total = points.reduce((s, p) => s + p.value, 0);
      return { total, points };
    },
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}

// ── Reality Check verdict logic ──
// Five states, ordered by operator action urgency:
//   confirmed  — measured bad + narrative loud + negative (public crisis)
//   watch      — measured bad + narrative low (early signal, public quiet)
//   understated — measured bad + narrative loud but neutral/positive (deflection)
//   overstated — measured fine + narrative loud + negative (panic without basis)
//   calm       — measured fine + narrative low (nothing to see)
export type RealityVerdict = "confirmed" | "watch" | "understated" | "overstated" | "calm";

export function realityCheckVerdict(
  narrativeTone: number,
  narrativeVolume: number,
  measuredBad: boolean
): { verdict: RealityVerdict; label: string; tone: "warning" | "neutral" | "info" | "positive" } {
  const isNegative = narrativeTone < -2;
  const hasVolume = narrativeVolume >= 3;

  if (measuredBad && isNegative && hasVolume) {
    return { verdict: "confirmed", label: "CONFIRMED — narrative matches reality", tone: "warning" };
  }
  if (measuredBad && hasVolume && !isNegative) {
    return { verdict: "understated", label: "UNDERSTATED — narrative downplays the data", tone: "warning" };
  }
  if (measuredBad && !hasVolume) {
    return { verdict: "watch", label: "WATCH — air elevated, public discourse quiet", tone: "warning" };
  }
  if (!measuredBad && isNegative && hasVolume) {
    return { verdict: "overstated", label: "OVERSTATED — narrative outpaces data", tone: "info" };
  }
  return { verdict: "calm", label: "CALM — no narrative pressure", tone: "positive" };
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
