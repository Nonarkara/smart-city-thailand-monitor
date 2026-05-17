import type { GeoFeatureRecord, MapFeatureCollection, TraffyFondueSnapshot, TraffyReport } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull } from "./common.js";
import { config } from "../config.js";

interface TraffyRawReport {
  id?: string;
  ticket_id?: string;
  type?: string;
  tag?: string;
  state?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  coords?: [number, number] | { lat?: number; lng?: number };
  address?: string;
  district?: string;
  subdistrict?: string;
  photo_url?: string;
  photo?: string;
  photo_urls?: string[];
  timestamp?: string;
  description?: string;
  comment?: string;
  org?: string[];
  responsible_agency?: string;
  response_time?: number;
}

type TraffySearchResponse = TraffyRawReport[] | { results?: TraffyRawReport[]; total?: number };

const SOURCE_ID = "traffy-fondue";
const SOURCE_URL = "https://traffy.in.th";

function parseCoords(raw: TraffyRawReport): { lat: number; lon: number } | null {
  if (typeof raw.latitude === "number" && typeof raw.longitude === "number") {
    return { lat: raw.latitude, lon: raw.longitude };
  }

  if (Array.isArray(raw.coords) && raw.coords.length >= 2) {
    return { lat: raw.coords[0], lon: raw.coords[1] };
  }

  if (raw.coords && typeof raw.coords === "object" && "lat" in raw.coords) {
    const lat = raw.coords.lat;
    const lng = raw.coords.lng;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lon: lng };
    }
  }

  return null;
}

function mapStatus(state?: string): TraffyReport["status"] {
  if (!state) return "received";
  const lower = state.toLowerCase();
  if (lower.includes("เสร็จ") || lower === "resolved") return "resolved";
  if (lower.includes("ดำเนิน") || lower === "in-progress") return "in-progress";
  return "received";
}

function categorize(type?: string): { th: string; en: string } {
  if (!type) return { th: "อื่นๆ", en: "Other" };

  const map: Record<string, { th: string; en: string }> = {
    "ถนน": { th: "ถนนชำรุด", en: "Road damage" },
    "road": { th: "ถนนชำรุด", en: "Road damage" },
    "น้ำท่วม": { th: "น้ำท่วม", en: "Flooding" },
    "flood": { th: "น้ำท่วม", en: "Flooding" },
    "ขยะ": { th: "ขยะ", en: "Waste" },
    "waste": { th: "ขยะ", en: "Waste" },
    "ไฟ": { th: "ไฟฟ้า / แสงสว่าง", en: "Lighting" },
    "light": { th: "ไฟฟ้า / แสงสว่าง", en: "Lighting" },
    "ทางเท้า": { th: "ทางเท้า", en: "Sidewalk" },
    "sidewalk": { th: "ทางเท้า", en: "Sidewalk" },
    "ระบายน้ำ": { th: "ระบบระบายน้ำ", en: "Drainage" },
    "drain": { th: "ระบบระบายน้ำ", en: "Drainage" },
    "ต้นไม้": { th: "ต้นไม้", en: "Trees" },
    "tree": { th: "ต้นไม้", en: "Trees" }
  };

  const lower = type.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }

  return { th: type, en: type };
}

function isInBangkok(lat: number, lon: number) {
  return lat >= 13.45 && lat <= 13.95 && lon >= 100.35 && lon <= 100.85;
}

export async function syncTraffyFondue() {
  const url = `${config.traffyFondueEndpoint}?limit=200`;
  const payload = await fetchJsonOrNull<TraffySearchResponse>(url);

  const raw = Array.isArray(payload) ? payload : (payload?.results ?? []);

  if (raw.length === 0) {
    return buildResult({
      sourceId: SOURCE_ID,
      status: "stale",
      message: "Traffy Fondue API returned no results. Using cached data.",
      sourceUrl: SOURCE_URL
    });
  }

  const fetchedAt = new Date().toISOString();
  const sourceMeta = {
    sourceName: "Traffy Fondue (BMA)",
    sourceUrl: SOURCE_URL,
    fetchedAt,
    publishedAt: fetchedAt,
    freshnessStatus: "live" as const,
    confidence: 0.91,
    fallbackMode: "live" as const
  };

  const reports: TraffyReport[] = [];
  const features: GeoFeatureRecord[] = [];

  for (const entry of raw) {
    const coords = parseCoords(entry);
    if (!coords || !isInBangkok(coords.lat, coords.lon)) continue;

    const status = mapStatus(entry.state ?? entry.status);
    const category = categorize(entry.type ?? entry.tag);
    const ticketId = entry.ticket_id ?? entry.id ?? `TF-${reports.length}`;

    reports.push({
      ticketId,
      category,
      status,
      lat: coords.lat,
      lon: coords.lon,
      district: entry.district ?? "",
      photoUrl: entry.photo_url ?? entry.photo,
      timestamp: entry.timestamp ?? fetchedAt,
      description: entry.description ?? entry.comment
    });

    features.push({
      id: `traffy-${ticketId}`,
      layerId: "traffy-fondue",
      geometryType: "Point",
      coordinates: [coords.lon, coords.lat],
      title: category.en,
      description: entry.description ?? entry.comment ?? `${category.en} report`,
      properties: {
        ticketId,
        category: category.en,
        status,
        district: entry.district ?? "",
        citySlug: "bangkok"
      },
      source: sourceMeta
    });
  }

  const openReports = reports.filter((r) => r.status !== "resolved");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  const categoryMap = new Map<string, number>();
  const districtMap = new Map<string, number>();

  for (const r of openReports) {
    const cat = r.category.en;
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    if (r.district) {
      districtMap.set(r.district, (districtMap.get(r.district) ?? 0) + 1);
    }
  }

  const snapshot: TraffyFondueSnapshot = {
    totalOpen: openReports.length,
    resolvedToday: resolvedReports.length,
    resolutionRate: reports.length > 0 ? resolvedReports.length / reports.length : 0,
    categoryBreakdown: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count })),
    districtBreakdown: [...districtMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([district, count]) => ({ district, count })),
    recentReports: reports.slice(0, 20),
    updatedAt: fetchedAt
  };

  const bounds: [number, number, number, number] = [
    Math.min(...features.map((f) => (f.coordinates as [number, number])[1])),
    Math.min(...features.map((f) => (f.coordinates as [number, number])[0])),
    Math.max(...features.map((f) => (f.coordinates as [number, number])[1])),
    Math.max(...features.map((f) => (f.coordinates as [number, number])[0]))
  ];

  const mapCollection: MapFeatureCollection = {
    layerId: "traffy-fondue",
    updatedAt: fetchedAt,
    features,
    bounds: features.length > 0 ? bounds : undefined,
    source: sourceMeta
  };

  return buildResult({
    sourceId: SOURCE_ID,
    status: "live",
    message: `${reports.length} Traffy Fondue reports synced (${openReports.length} open, ${resolvedReports.length} resolved).`,
    sourceUrl: SOURCE_URL,
    mapFeatureCollections: [mapCollection],
    traffyFonduePatch: snapshot
  });
}
