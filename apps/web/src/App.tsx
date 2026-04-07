import { useQuery } from "@tanstack/react-query";
import {
  activityLog as activityLogSeed,
  auditTrail as auditTrailSeed,
  changePulse as changePulseSeed,
  cloneSeed,
  createCommandCenterSnapshot,
  createOverviewSnapshot,
  createTimeSnapshot,
  decisionQueue as decisionQueueSeed,
  districts as districtSeed,
  localize,
  mapFeatureCollections as mapFeatureSeed,
  mapLayers as layerSeed,
  marketSnapshot as marketSnapshotSeed,
  mediaFeeds as mediaFeedSeed,
  news as newsSeed,
  officialImpact as officialImpactSeed,
  publicCctvCameras as publicCctvCameraSeed,
  projects as projectSeed,
  resilience as resilienceSeed,
  socialListening as socialListeningSeed,
  sources as sourceSeed,
  impactArenaEvents as impactArenaEventsSeed,
  mttTrafficSnapshot as mttTrafficSnapshotSeed,
  createMucSnapshot,
  mttIncidents as incidentSeed,
  mttFloodRisk as floodRiskSeed,
  mttTransit as transitSeed,
  utilitySnapshot as utilitySeed
} from "@smart-city/shared";
import type {
  ActivityLogItem,
  AuditEventRecord,
  AssistantQueryRequest,
  AssistantResponse,
  AssistantStatus,
  CommandCenterSnapshot,
  ChangePulse,
  DashboardView,
  DecisionQueueItem,
  DistrictProfile,
  GeoFeatureRecord,
  Locale,
  LocalizedText,
  MapFeatureCollection,
  MarketSnapshot,
  MediaFeedItem,
  NewsItem,
  OfficialImpactSnapshot,
  OverviewSnapshot,
  ProjectRecord,
  PublicCctvCamera,
  ResilienceSnapshot,
  SatelliteDigest,
  SocialListeningSnapshot,
  SourceRecord,
  TimeRange,
  TimeSnapshot,
  ImpactArenaEvent,
  MucSnapshot,
  CctvGridLayout,
  IncidentRecord,
  FloodRiskSnapshot,
  TransitSnapshot,
  CommunityIntelSnapshot,
  UtilitySnapshot
} from "@smart-city/shared";
import {
  startTransition,
  useCallback,
  useEffect,
  useDeferredValue,
  useMemo,
  useRef,
  useState
} from "react";
import { NavLink, Route, Routes, useSearchParams } from "react-router-dom";
import {
  assistantQuestionClusters,
  createDashboardScaffoldSnippets,
  createGoogleTrendsUrl,
  globalReferenceCities,
  pickLocalized,
  toolkitLinks,
  trendWatchItems,
  undpQuickLinks
} from "./content";
import { getEoTileConfigs } from "./eoTiles";
import InteractiveMap from "./InteractiveMap";

function normalizeApiBase(baseUrl: string) {
  const trimmed = baseUrl.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : "";
}

function getApiBaseCandidates() {
  const configuredBase = normalizeApiBase((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "");
  return configuredBase ? [configuredBase] : [""];
}

const API_BASE_CANDIDATES = getApiBaseCandidates();
const API_BASE_URL = API_BASE_CANDIDATES[0] ?? "";
const LIVE_POLL_INTERVAL_MS = 180000;
const SATELLITE_DOCS_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html";
const APP_VERSION = "4.0.0";
const PUBLIC_DASHBOARD_BRAND = Object.freeze({
  title: (import.meta.env.VITE_SITE_TITLE as string | undefined) || "Muang Thong Thani Super Dashboard",
  eyebrow: {
    th: "เมืองทองธานี ซูเปอร์แดชบอร์ด",
    en: "Muang Thong Thani"
  }
});
const PUBLIC_DASHBOARD_ATTRIBUTION = Object.freeze({
  copyright: "Copyright Dr Non Arkaraprasertkul, Digital Economy Promotion Agency (depa), Thailand 2026",
  email: "non.ar@depa.or.th",
  linkedInUrl: "https://www.linkedin.com/in/drnon/",
  linkedInHandle: "/in/drnon"
});
const COVERAGE_DOMAIN_KEYWORDS: Record<string, string[]> = {
  environment: ["environment", "resilience", "water", "coastal", "green", "climate", "canal", "flood"],
  economy: ["economy", "industrial", "trade", "tourism", "innovation", "growth", "logistics"],
  mobility: ["mobility", "transport", "transit", "corridor", "gateway", "connectivity", "traffic"],
  energy: ["energy", "power", "utility", "grid"],
  people: ["people", "community", "education", "campus", "university", "civic"],
  living: ["living", "livability", "health", "safety", "public-space", "tourism", "services"],
  governance: ["governance", "administration", "service", "management", "municipal", "public", "policy"]
};

const SATELLITE_CREDENTIAL_SOURCE_IDS = [
  "sentinel-hub-process",
  "sentinel-hub-statistics",
  "sentinel-hub-ogc",
  "copernicus-stac",
  "copernicus-odata",
  "copernicus-openeo"
] as const;
const SATELLITE_PRESETS = [
  {
    id: "satellite-flood",
    label: { th: "Flood watch", en: "Flood watch" },
    detail: {
      th: "เปิดฝนดาวเทียม น้ำ และ resilience สำหรับดูบริบทมรสุมระดับประเทศ",
      en: "Turns on precipitation, water, and resilience layers for national monsoon context."
    },
    layers: ["smart-city-thailand", "water", "resilience", "eo-precipitation", "jaxa-rainfall"]
  },
  {
    id: "satellite-haze",
    label: { th: "Haze watch", en: "Haze watch" },
    detail: {
      th: "จับคู่ aerosol กับ AQI และ weather เพื่อดูหมอกควันและฝุ่นในภาพรวม",
      en: "Pairs aerosol with AQI and weather for a national haze and dust view."
    },
    layers: ["smart-city-thailand", "pollution", "weather", "eo-aerosol"]
  },
  {
    id: "satellite-green",
    label: { th: "Green cover", en: "Green cover" },
    detail: {
      th: "ใช้ NDVI กับ land use และ agriculture เพื่อดูพื้นที่สีเขียวและ land-change",
      en: "Uses NDVI with land use and agriculture for green-cover and land-change context."
    },
    layers: ["smart-city-thailand", "land-use", "agriculture", "eo-vegetation"]
  }
] as const;
const TIME_RANGE_OPTIONS = ["24h", "7d", "30d", "90d"] as const;
const BLEND_MODE_OPTIONS = [
  { id: "normal", label: { th: "ปกติ", en: "Normal" } },
  { id: "multiply", label: { th: "เข้ม", en: "Multiply" } },
  { id: "screen", label: { th: "สว่าง", en: "Screen" } },
  { id: "overlay", label: { th: "ซ้อน", en: "Overlay" } }
] as const;
const THAILAND_SATELLITE_PRIORITIES = [
  {
    id: "sentinel-1",
    title: { th: "Sentinel-1 GRD", en: "Sentinel-1 GRD" },
    detail: {
      th: "เหมาะสุดสำหรับน้ำท่วมและฤดูมรสุมของไทย เพราะเรดาร์มองทะลุเมฆได้",
      en: "Best for Thailand flood and monsoon monitoring because radar works through cloud."
    }
  },
  {
    id: "sentinel-2",
    title: { th: "Sentinel-2 L2A", en: "Sentinel-2 L2A" },
    detail: {
      th: "ใช้ดูพืชพรรณ น้ำ พื้นที่เมือง และ true-color / NDVI / NDWI",
      en: "Use for vegetation, water, urban surfaces, and true-color / NDVI / NDWI products."
    }
  },
  {
    id: "sentinel-5p",
    title: { th: "Sentinel-5P L2", en: "Sentinel-5P L2" },
    detail: {
      th: "ใช้เสริมบริบทชั้นบรรยากาศและมลพิษระดับภูมิภาค ไม่ใช่ AQI ระดับถนน",
      en: "Good for regional atmospheric context, not street-level AQI."
    }
  }
] as const;

interface ToggleOption {
  id: string;
  label: {
    th: string;
    en: string;
  };
  detail: {
    th: string;
    en: string;
  };
  color: string;
}

type BlendModeOption = (typeof BLEND_MODE_OPTIONS)[number]["id"];

interface OverlayStudioSetting {
  opacity: number;
  blendMode: BlendModeOption;
  order: number;
}

interface OpsDrawerState {
  title: string;
  subtitle: string;
  citySlug: string;
  reason: string;
  layers: string[];
  sourceLabel: string;
  confidence: number;
}

interface ScreenshotScene {
  id: string;
  title: {
    th: string;
    en: string;
  };
  detail: {
    th: string;
    en: string;
  };
  shot: {
    th: string;
    en: string;
  };
  state: {
    view: DashboardView;
    city?: string;
    basemap: "atlas" | "satellite" | "street" | "hybrid";
    timeRange: TimeRange;
    layers: string[];
  };
}

interface SlicThailandCity {
  id: string;
  rank: number;
  nameEn: string;
  nameTh: string;
  region: string;
  provinceType: string;
  overall: number;
  avgMonthlyIncome: number;
  pm25Annual: number;
  greenCoverage: number;
  tagline: string;
  highlights: string[];
  status: string;
}

interface SlicThailandSnapshot {
  updatedAt: string;
  source: {
    name: string;
    url: string;
    freshnessStatus: "live" | "stale" | "manual";
  };
  topCities: SlicThailandCity[];
}

interface ImportedLayerReference {
  id: string;
  label: LocalizedText;
  detail: LocalizedText;
  family: LocalizedText;
  sourceProject: string;
  sourceLabel: string;
  status: "ready" | "planned";
  color: string;
}

interface CctvSampleTemplate {
  id: string;
  cameraId: string;
  zone: LocalizedText;
  detection: LocalizedText;
  detail: LocalizedText;
  severity: "watch" | "alert" | "stable";
  status: LocalizedText;
  model: string;
  minutesAgo: number;
  targetLayers: string[];
}

interface ReporterSampleTemplate {
  id: string;
  ticketNumber: string;
  problemType: LocalizedText;
  description: LocalizedText;
  locationText: string;
  urgency: "low" | "medium" | "high";
  status: "received" | "assigned" | "in_progress" | "completed";
  teamName: string;
  staffName: string;
  aiSummary: LocalizedText;
  matchedCameraId?: string;
  minutesAgo: number;
  targetLayers: string[];
}

const importedLayerReferences: ImportedLayerReference[] = [
  {
    id: "phuket-false-color",
    label: { th: "False color", en: "False Color" },
    detail: {
      th: "ชั้นภาพ MODIS false-color จาก Phuket Dashboard สำหรับดูภูมิประเทศและพืชพรรณ",
      en: "MODIS false-color terrain and vegetation contrast from the Phuket Dashboard overlay catalog."
    },
    family: { th: "ฐานภาพ", en: "Base imagery" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "NASA GIBS / MODIS",
    status: "ready",
    color: "#8b5cf6"
  },
  {
    id: "phuket-relief",
    label: { th: "Relief", en: "Relief" },
    detail: {
      th: "Blue Marble relief สำหรับอ่านแนวถนน เนิน และขอบเมืองแบบกว้าง",
      en: "Blue Marble relief framing for roads, ridgelines, and city-edge orientation."
    },
    family: { th: "ฐานภาพ", en: "Base imagery" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "NASA GIBS / Blue Marble",
    status: "ready",
    color: "#6b7280"
  },
  {
    id: "phuket-signal-heatmap",
    label: { th: "Signal heatmap", en: "Signal Heatmap" },
    detail: {
      th: "heatmap สำหรับจุดสัญญาณและเหตุการณ์ที่ Phuket Dashboard ใช้ในพื้นที่ท่องเที่ยว",
      en: "Clustered signal heatmap pattern reused from the Phuket Dashboard operations map."
    },
    family: { th: "ปฏิบัติการ", en: "Operations" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Incident / reference feeds",
    status: "ready",
    color: "#ef4444"
  },
  {
    id: "phuket-thermal-hotspots",
    label: { th: "Thermal hotspots", en: "Thermal Hotspots" },
    detail: {
      th: "จุดความร้อนและ active fire detections จาก overlay catalog ของ Phuket Dashboard",
      en: "Thermal anomaly and active-fire layer carried over from the Phuket Dashboard catalog."
    },
    family: { th: "สิ่งแวดล้อม", en: "Environment" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "NASA FIRMS",
    status: "ready",
    color: "#f97316"
  },
  {
    id: "phuket-aqi-heatmap",
    label: { th: "AQI heatmap", en: "AQI Heatmap" },
    detail: {
      th: "surface AQI ที่ทำไว้ใน Phuket Dashboard สำหรับดูแรงกดดันอากาศแบบเชิงพื้นที่",
      en: "AQI surface carried over from the Phuket Dashboard for spatial air-quality context."
    },
    family: { th: "คุณภาพอากาศ", en: "Air quality" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Open-Meteo",
    status: "ready",
    color: "#0ea5e9"
  },
  {
    id: "phuket-pm25-heatmap",
    label: { th: "PM2.5 heatmap", en: "PM2.5 Heatmap" },
    detail: {
      th: "overlay PM2.5 hotspot จาก Phuket Dashboard สำหรับ smoke pressure และ roadside pollution",
      en: "PM2.5 hotspot surface from the Phuket Dashboard for smoke pressure and roadside pollution."
    },
    family: { th: "คุณภาพอากาศ", en: "Air quality" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Open-Meteo",
    status: "ready",
    color: "#7c3aed"
  },
  {
    id: "phuket-rainfall-shifts",
    label: { th: "Rainfall shifts", en: "Rainfall Shifts" },
    detail: {
      th: "จุด anomaly ฝนเฉพาะพื้นที่สำหรับการตีความน้ำขังและการเดินทาง",
      en: "Localized rainfall anomaly layer for standing water and mobility interpretation."
    },
    family: { th: "อากาศ", en: "Weather" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Rainfall cache",
    status: "ready",
    color: "#2563eb"
  },
  {
    id: "phuket-movement",
    label: { th: "Visitor movement", en: "Visitor Movement" },
    detail: {
      th: "trace การเคลื่อนที่ผู้ใช้งาน / นักท่องเที่ยวจาก Phuket Dashboard",
      en: "Movement traces between hubs and venues reused from the Phuket Dashboard."
    },
    family: { th: "การเดินทาง", en: "Mobility" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Movement cache",
    status: "ready",
    color: "#14b8a6"
  },
  {
    id: "phuket-province-labels",
    label: { th: "Province labels", en: "Province Labels" },
    detail: {
      th: "ป้ายจังหวัดและ boundary markers สำหรับใช้เป็น reference layer",
      en: "Province labels and boundary markers for quick geographic orientation."
    },
    family: { th: "อ้างอิง", en: "Reference" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "Reference data",
    status: "ready",
    color: "#475569"
  },
  {
    id: "phuket-flight-paths",
    label: { th: "Flight paths", en: "Flight Paths" },
    detail: {
      th: "flight path และ aircraft position layer ที่พร้อมนำ logic มาปรับใช้",
      en: "Flight-path and aircraft-position logic ready to adapt into this monitor."
    },
    family: { th: "การเดินทาง", en: "Mobility" },
    sourceProject: "Phuket Dashboard",
    sourceLabel: "OpenSky",
    status: "planned",
    color: "#f59e0b"
  }
];

const cctvSampleTemplates: CctvSampleTemplate[] = [
  {
    id: "cctv-impact-dropoff",
    cameraId: "SCTH-CAM-01",
    zone: { th: "Impact Challenger drop-off", en: "Impact Challenger drop-off" },
    detection: { th: "จอดแช่ผิดกฎหมาย", en: "Illegal Parking" },
    detail: {
      th: "รถจอดค้างในช่องรับส่งเกินเวลาที่กำหนดและเริ่มกีดขวางรถรับส่ง",
      en: "Vehicle dwell time passed the curb limit and is blocking the shuttle loop."
    },
    severity: "alert",
    status: { th: "ส่งต่อทีมจราจร", en: "Escalate to traffic team" },
    model: "Parking Vision v0.8",
    minutesAgo: 2,
    targetLayers: ["itic-traffic", "projects"]
  },
  {
    id: "cctv-beehive-incident",
    cameraId: "SCTH-CAM-02",
    zone: { th: "Beehive connector", en: "Beehive connector" },
    detection: { th: "เหตุเฉี่ยวชนเล็กน้อย", en: "Minor Incident" },
    detail: {
      th: "พบการหยุดรถผิดปกติหลังฝนและ crowd movement เริ่มสะสม",
      en: "Short stop and spillback pattern suggest a minor roadside incident after rain."
    },
    severity: "watch",
    status: { th: "รอตรวจภาพย้อนหลัง", en: "Review clip" },
    model: "Incident Sense v0.5",
    minutesAgo: 6,
    targetLayers: ["itic-traffic", "weather"]
  },
  {
    id: "cctv-cosmo-sidewalk",
    cameraId: "SCTH-CAM-03",
    zone: { th: "Cosmo Bazaar frontage", en: "Cosmo Bazaar frontage" },
    detection: { th: "คนล้นทางเท้า", en: "Pedestrian Spillover" },
    detail: {
      th: "พื้นที่ขายของล้นลงมาที่ทางเท้าและ crowd lane เริ่มเบียดแนวจอดรถ",
      en: "Pedestrian spillover is compressing the walkway and pushing movement into the curb lane."
    },
    severity: "watch",
    status: { th: "เตรียมผูกกับ reporter", en: "Match with reporter feed" },
    model: "Crowd Flow v0.4",
    minutesAgo: 11,
    targetLayers: ["bangkok-passages", "itic-traffic"]
  },
  {
    id: "cctv-p2-wrong-way",
    cameraId: "SCTH-CAM-04",
    zone: { th: "P2 feeder road", en: "P2 feeder road" },
    detection: { th: "รถย้อนศร", en: "Wrong-way Vehicle" },
    detail: {
      th: "รถจักรยานยนต์เข้าผิดทิศในช่วงสัญญาณจราจรชะลอตัว",
      en: "Motorbike entered the feeder road against flow during a congestion wave."
    },
    severity: "alert",
    status: { th: "ส่งเข้าบอร์ดเหตุการณ์", en: "Send to incident board" },
    model: "Road Behavior v0.6",
    minutesAgo: 18,
    targetLayers: ["itic-traffic", "weather", "disaster"]
  },
  {
    id: "cctv-lakefront-smoke",
    cameraId: "SCTH-CAM-05",
    zone: { th: "Lakefront gate", en: "Lakefront gate" },
    detection: { th: "ควัน / ความร้อนผิดปกติ", en: "Smoke / Thermal Alert" },
    detail: {
      th: "กลุ่มควันบางและแหล่งความร้อนเล็กถูกตั้งเป็น watch sample สำหรับเชื่อมระบบ EO ภายหลัง",
      en: "Light smoke and a small heat signature are staged as a future EO-linked watch sample."
    },
    severity: "stable",
    status: { th: "ตัวอย่างสำหรับต่อ EO", en: "EO-ready sample" },
    model: "Thermal Watch v0.3",
    minutesAgo: 27,
    targetLayers: ["weather", "resilience", "disaster"]
  }
];

const reporterSampleTemplates: ReporterSampleTemplate[] = [
  {
    id: "report-road",
    ticketNumber: "SCTH-4921",
    problemType: { th: "ถนน", en: "Road" },
    description: {
      th: "หลุมถนนตรงแนวรถรับส่งหน้า Challenger Hall ทำให้รถเบี่ยงหลบกะทันหัน",
      en: "Road surface damage near the Challenger shuttle lane is causing sudden swerves."
    },
    locationText: "Impact Challenger service lane",
    urgency: "high",
    status: "assigned",
    teamName: "Road Ops",
    staffName: "Field Team A",
    aiSummary: {
      th: "AI summary: พื้นผิวเสียหายและมีความเสี่ยงต่อรถที่ชะลอรับส่ง",
      en: "AI summary: damaged pavement with elevated risk for drop-off traffic."
    },
    minutesAgo: 14,
    targetLayers: ["itic-traffic", "projects"]
  },
  {
    id: "report-flood",
    ticketNumber: "SCTH-4927",
    problemType: { th: "น้ำท่วม", en: "Flooding" },
    description: {
      th: "น้ำขังหน้าท่อระบายน้ำฝั่ง lakefront หลังฝน ทำให้รถสองแถวเลี่ยงเส้นทาง",
      en: "Standing water near the lakefront drain is diverting local shuttle movement."
    },
    locationText: "Lakefront drain pocket",
    urgency: "high",
    status: "received",
    teamName: "Drainage Ops",
    staffName: "Pending assignment",
    aiSummary: {
      th: "AI summary: จุดน้ำขังสัมพันธ์กับฝนสะสมและท่อระบายช้า",
      en: "AI summary: drainage chokepoint likely linked to recent rainfall accumulation."
    },
    matchedCameraId: "SCTH-CAM-05",
    minutesAgo: 22,
    targetLayers: ["water", "weather", "resilience"]
  },
  {
    id: "report-sidewalk",
    ticketNumber: "SCTH-4930",
    problemType: { th: "ทางเท้า", en: "Sidewalk" },
    description: {
      th: "พื้นที่ขายของล้นลงทางเท้าเชื่อม Beehive ทำให้คนต้องลงมาเดินที่ขอบถนน",
      en: "Vendor spillover is pushing pedestrians from the Beehive walkway into the curb lane."
    },
    locationText: "Beehive connector walkway",
    urgency: "medium",
    status: "in_progress",
    teamName: "Public Space",
    staffName: "Officer Nicha",
    aiSummary: {
      th: "AI summary: crowding and obstruction align with walkway pinch point",
      en: "AI summary: crowding and obstruction align with a walkway pinch point."
    },
    matchedCameraId: "SCTH-CAM-03",
    minutesAgo: 36,
    targetLayers: ["bangkok-passages", "itic-traffic"]
  },
  {
    id: "report-lighting",
    ticketNumber: "SCTH-4933",
    problemType: { th: "ไฟฟ้า", en: "Lighting" },
    description: {
      th: "ไฟส่องสว่างดับเป็นช่วงบริเวณที่จอดรถด้าน Cosmo ทำให้มองเห็นป้ายยากตอนค่ำ",
      en: "Intermittent lighting outage at the Cosmo parking edge is reducing nighttime visibility."
    },
    locationText: "Cosmo parking edge",
    urgency: "medium",
    status: "received",
    teamName: "Electrical Unit",
    staffName: "Pending assignment",
    aiSummary: {
      th: "AI summary: lighting coverage gap, likely maintenance issue",
      en: "AI summary: lighting coverage gap with likely maintenance root cause."
    },
    minutesAgo: 58,
    targetLayers: ["projects", "news"]
  },
  {
    id: "report-waste",
    ticketNumber: "SCTH-4918",
    problemType: { th: "ขยะ", en: "Waste" },
    description: {
      th: "ถังขยะล้นในจุดรวมอาหารริมทะเลสาบแต่ทีมเก็บกวาดเข้าจัดการแล้ว",
      en: "Overflowing waste near the lakeside food cluster has already been cleared."
    },
    locationText: "Lake food cluster",
    urgency: "low",
    status: "completed",
    teamName: "Sanitation",
    staffName: "Night Shift Crew",
    aiSummary: {
      th: "AI summary: sanitation issue resolved after peak-hour cleanup",
      en: "AI summary: sanitation issue resolved after peak-hour cleanup."
    },
    minutesAgo: 94,
    targetLayers: ["projects", "news"]
  }
];

const operationalLayerToggleIds = [
  "smart-city-thailand",
  "bangkok-passages",
  "cctv-cameras",
  "weather",
  "pollution",
  "itic-traffic",
  "projects",
  "news",
  "resilience",
  "economy",
  "water",
  "land-use",
  "agriculture",
  "disaster"
] as const;

const satelliteToggleOptions: ToggleOption[] = [
  {
    id: "satellite-imagery",
    label: { th: "ภาพจริง", en: "True Color" },
    detail: { th: "ภาพดาวเทียมสีจริง", en: "NASA true-color imagery" },
    color: "#d5e7ff"
  },
  {
    id: "satellite-cloudless",
    label: { th: "คลาวด์เลส", en: "Cloudless" },
    detail: { th: "โมเสก Sentinel-2 ความละเอียดสูงแบบไร้เมฆ", en: "High-resolution Sentinel-2 cloudless mosaic" },
    color: "#93c5fd"
  },
  {
    id: "satellite-surface-water",
    label: { th: "น้ำผิวดิน", en: "Surface Water" },
    detail: { th: "ความถี่การเกิดน้ำผิวดินสำหรับ floodplain และพื้นที่ชุ่มน้ำ", en: "Surface-water occurrence for floodplain and wetland context" },
    color: "#0ea5e9"
  },
  {
    id: "satellite-bathymetry",
    label: { th: "ความลึกทะเล", en: "Bathymetry" },
    detail: { th: "ความลึกทะเลและภูมิประเทศชายฝั่งสำหรับเมืองชายทะเล", en: "Ocean depth and coastal terrain context" },
    color: "#14b8a6"
  },
  {
    id: "eo-vegetation",
    label: { th: "ป่าไม้และพืช", en: "Forests & Plants" },
    detail: { th: "แสดงพื้นที่ป่าไม้และพืชพรรณที่สมบูรณ์หรือเสื่อมโทรม", en: "Shows where plants and forests are healthy or stressed" },
    color: "#65a30d"
  },
  {
    id: "eo-aerosol",
    label: { th: "ฝุ่นและหมอกควัน", en: "Dust & Haze" },
    detail: { th: "ติดตามฝุ่นละอองและหมอกควันในอากาศ", en: "Tracks airborne dust and smoke particles" },
    color: "#9333ea"
  },
  {
    id: "eo-precipitation",
    label: { th: "รูปแบบฝน", en: "Rainfall Pattern" },
    detail: { th: "แสดงว่าฝนตกที่ไหนทั่วประเทศ", en: "Shows where rain is falling across the country" },
    color: "#2563eb"
  },
  {
    id: "jaxa-rainfall",
    label: { th: "ฝน", en: "Rain" },
    detail: { th: "ภาพฝนดาวเทียมรายวันจาก JAXA", en: "Daily JAXA rainfall raster" },
    color: "#0f8cff"
  },
  {
    id: "satellite-surface-temp",
    label: { th: "ความร้อนพื้นดิน", en: "Ground Heat" },
    detail: { th: "วัดว่าพื้นดินร้อนแค่ไหน", en: "Measures how hot the ground surface is" },
    color: "#fb7185"
  },
  {
    id: "satellite-thermal",
    label: { th: "จุดความร้อน", en: "Heat Detection" },
    detail: { th: "ตรวจจับจุดร้อนผิดปกติ", en: "Detects unusual heat sources and hot spots" },
    color: "#f97316"
  },
  {
    id: "satellite-water-vapor",
    label: { th: "ความชื้น", en: "Humidity" },
    detail: { th: "แสดงความชื้นในอากาศ", en: "Shows moisture in the atmosphere" },
    color: "#38bdf8"
  },
  {
    id: "satellite-sea-surface-temp",
    label: { th: "อุณหภูมิทะเล", en: "Sea Surface" },
    detail: { th: "อุณหภูมิผิวน้ำทะเลสำหรับเมืองชายฝั่ง", en: "Sea-surface temperature for coastal cities" },
    color: "#14b8a6"
  },
  {
    id: "satellite-night-lights",
    label: { th: "แสงกลางคืน", en: "Night Lights" },
    detail: { th: "ความหนาแน่นแสงเมืองยามค่ำ", en: "Night-time urban light intensity" },
    color: "#8b5cf6"
  },
  {
    id: "eo-soil-moisture",
    label: { th: "ดินชื้น", en: "Soil Moisture" },
    detail: { th: "ความชื้นดินจาก NASA SMAP สำหรับเกษตรและน้ำท่วม", en: "NASA SMAP soil moisture for agriculture and flood context" },
    color: "#b45309"
  },
  {
    id: "eo-fire-thermal",
    label: { th: "เฝ้าระวังความร้อน", en: "Heat Watch" },
    detail: { th: "แถบอินฟราเรด MODIS Aqua สำหรับเฝ้าระวังภาวะร้อนจัด", en: "MODIS Aqua thermal infrared watch for elevated heat stress" },
    color: "#ef4444"
  },
  {
    id: "eo-snow-cover",
    label: { th: "หิมะ", en: "Snow Cover" },
    detail: { th: "พื้นที่หิมะปกคลุมจาก MODIS สำหรับลุ่มน้ำเอเชีย", en: "MODIS snow cover for Himalayan and Asian watershed monitoring" },
    color: "#e0f2fe"
  },
  {
    id: "eo-chlorophyll",
    label: { th: "สุขภาพทะเล", en: "Ocean Health" },
    detail: { th: "ติดตามคุณภาพน้ำทะเล", en: "Monitors ocean water quality" },
    color: "#059669"
  },
  {
    id: "eo-cloud-phase",
    label: { th: "ประเภทเมฆ", en: "Cloud Type" },
    detail: { th: "จำแนกประเภทเมฆสำหรับพยากรณ์อากาศ", en: "Identifies cloud type for weather forecasting" },
    color: "#94a3b8"
  }
];

const screenshotManualScenes: ScreenshotScene[] = [
  {
    id: "national-command",
    title: { th: "ภาพรวมประเทศ", en: "National command view" },
    detail: {
      th: "ใช้สำหรับภาพเปิดเดโมที่เน้น command bar, smart-city footprint, และสัญญาณหลักของประเทศ",
      en: "Use as the opening demo shot with the command bar, nationwide footprint, and headline signals."
    },
    shot: {
      th: "เก็บทั้ง command bar, map hero, และคำอธิบายชั้นข้อมูล",
      en: "Capture the command bar, map hero, and layer legend together."
    },
    state: {
      view: "national",
      basemap: "atlas",
      timeRange: "7d",
      layers: ["smart-city-thailand", "projects", "news", "economy"]
    }
  },
  {
    id: "flood-watch",
    title: { th: "ภาพมรสุมและน้ำ", en: "Flood and monsoon watch" },
    detail: {
      th: "เปิดชั้นภาพฝน, มรสุม, น้ำ และ resilience เพื่ออธิบายมุมมองเชิงปฏิบัติการ",
      en: "Turn on rain, monsoon, water, and resilience layers for an operations-focused flood frame."
    },
    shot: {
      th: "ใช้แผนที่ aerial และซูมระดับประเทศเพื่อให้เห็น pattern ฝนสะสม",
      en: "Use the aerial base and a national zoom to show the rainfall pattern clearly."
    },
    state: {
      view: "national",
      basemap: "satellite",
      timeRange: "24h",
      layers: ["satellite-imagery", "eo-precipitation", "jaxa-rainfall", "water", "resilience"]
    }
  },
  {
    id: "haze-watch",
    title: { th: "ภาพฝุ่นและหมอกควัน", en: "Haze and aerosol watch" },
    detail: {
      th: "จับคู่ aerosol กับ AQI และ weather เพื่อใช้ในสไลด์ด้านสิ่งแวดล้อม",
      en: "Pair aerosol with AQI and weather for the environmental demo section."
    },
    shot: {
      th: "เน้น hotspot strip และ right drawer เพื่ออธิบายเหตุผลของภาพ",
      en: "Include the hotspot strip and the right drawer to explain why the view matters."
    },
    state: {
      view: "national",
      basemap: "satellite",
      timeRange: "7d",
      layers: ["satellite-imagery", "eo-aerosol", "pollution", "weather"]
    }
  },
  {
    id: "green-cover",
    title: { th: "ภาพพื้นที่สีเขียว", en: "Green cover view" },
    detail: {
      th: "ใช้ vegetation, land use, และ agriculture เพื่อเล่าเรื่อง land-change",
      en: "Use vegetation, land use, and agriculture to tell the land-change story."
    },
    shot: {
      th: "เหมาะกับภาพ side-by-side ใน compare panel",
      en: "Works best as a side-by-side reference in the compare panel."
    },
    state: {
      view: "national",
      basemap: "atlas",
      timeRange: "30d",
      layers: ["eo-vegetation", "land-use", "agriculture", "smart-city-thailand"]
    }
  },
  {
    id: "bangkok-ops",
    title: { th: "ภาพเมืองเชิงปฏิบัติการ", en: "City operations view" },
    detail: {
      th: "ใช้สำหรับภาพเมืองที่มี AQI, weather, projects และ drawer อธิบายด้านขวา",
      en: "Use for a city screenshot with AQI, weather, projects, and the explanation drawer."
    },
    shot: {
      th: "เปิด drawer แล้วเก็บ map hero พร้อม city compare ด้านล่าง",
      en: "Open the drawer and capture the map hero with the compare panel below."
    },
    state: {
      view: "city",
      city: "bangkok",
      basemap: "atlas",
      timeRange: "7d",
      layers: ["weather", "pollution", "projects", "news"]
    }
  }
];

const groundTruthDirectory: Record<
  string,
  Array<{
    id: string;
    label: { th: string; en: string };
    note: { th: string; en: string };
    url: string;
  }>
> = {
  national: [
    {
      id: "tmd-radar",
      label: { th: "เรดาร์อุตุ", en: "TMD weather radar" },
      note: { th: "ตรวจสอบกลุ่มฝนและพายุจากกรมอุตุนิยมวิทยา", en: "Check live rainfall cells and storms from Thailand’s meteorological radar." },
      url: "https://weather.tmd.go.th/radar/"
    },
    {
      id: "thaipbs-live",
      label: { th: "Thai PBS Live", en: "Thai PBS Live" },
      note: { th: "ใช้ยืนยันเหตุการณ์ระดับประเทศหรือข่าวสด", en: "Use for live national confirmation and breaking-news context." },
      url: "https://www.thaipbs.or.th/live"
    },
    {
      id: "eonet",
      label: { th: "NASA EONET", en: "NASA EONET" },
      note: { th: "ดูเหตุการณ์ธรรมชาติที่รายงานแบบ near real-time", en: "See near-real-time natural event reports." },
      url: "https://eonet.gsfc.nasa.gov/map"
    }
  ],
  bangkok: [
    {
      id: "longdo",
      label: { th: "Longdo Traffic", en: "Longdo Traffic" },
      note: { th: "ยืนยันสภาพจราจรกรุงเทพฯ แบบสด", en: "Check live Bangkok traffic conditions." },
      url: "https://traffic.longdo.com"
    },
    {
      id: "bma",
      label: { th: "กรุงเทพมหานคร", en: "Bangkok Metropolitan Administration" },
      note: { th: "หน้าอ้างอิงภาครัฐของกรุงเทพฯ", en: "Official city reference page." },
      url: "https://www.bangkok.go.th"
    }
  ],
  "chiang-mai": [
    {
      id: "chiang-mai-news",
      label: { th: "Chiang Mai News", en: "Chiang Mai News" },
      note: { th: "ใช้ประกอบบริบทฝุ่นและไฟป่า", en: "Use for local haze and wildfire context." },
      url: "https://www.chiangmainews.co.th"
    }
  ],
  phuket: [
    {
      id: "phuket-city",
      label: { th: "เทศบาลนครภูเก็ต", en: "Phuket City Municipality" },
      note: { th: "หน้าอ้างอิงเมืองและประกาศท้องถิ่น", en: "Official city reference page and local notices." },
      url: "https://www.phuketcity.go.th"
    }
  ],
  "khon-kaen": [
    {
      id: "khon-kaen-city",
      label: { th: "เทศบาลนครขอนแก่น", en: "Khon Kaen City Municipality" },
      note: { th: "ข้อมูลภาครัฐและประกาศท้องถิ่น", en: "Official city reference and local notices." },
      url: "https://www.kkmuni.go.th"
    }
  ]
};

function getDefaultOverlayOpacity(id: string) {
  switch (id) {
    case "satellite-imagery":
      return 0.92;
    case "satellite-cloudless":
      return 0.78;
    case "satellite-surface-water":
      return 0.58;
    case "satellite-bathymetry":
      return 0.54;
    case "satellite-surface-temp":
      return 0.68;
    case "satellite-thermal":
      return 0.7;
    case "eo-vegetation":
      return 0.6;
    case "eo-aerosol":
      return 0.54;
    case "eo-precipitation":
      return 0.58;
    case "eo-fire-thermal":
      return 0.68;
    case "jaxa-rainfall":
      return 0.42;
    case "satellite-night-lights":
      return 0.5;
    default:
      return 0.6;
  }
}

function getDefaultBlendMode(id: string): BlendModeOption {
  switch (id) {
    case "satellite-imagery":
    case "satellite-cloudless":
      return "normal";
    case "satellite-night-lights":
      return "screen";
    case "satellite-surface-water":
      return "overlay";
    case "satellite-surface-temp":
    case "satellite-thermal":
    case "eo-fire-thermal":
      return "screen";
    case "eo-aerosol":
      return "multiply";
    case "eo-precipitation":
      return "overlay";
    case "jaxa-rainfall":
      return "overlay";
    default:
      return "multiply";
  }
}

function createDefaultOverlayStudioSettings() {
  return Object.fromEntries(
    satelliteToggleOptions.map((item, index) => [
      item.id,
      {
        opacity: getDefaultOverlayOpacity(item.id),
        blendMode: getDefaultBlendMode(item.id),
        order: index
      }
    ])
  ) as Record<string, OverlayStudioSetting>;
}

const slicCitySlugMap: Record<string, string> = {
  bangkok: "bangkok",
  "chiang-mai": "chiang-mai",
  "khon-kaen": "khon-kaen",
  phuket: "phuket",
  "chon-buri": "chon-buri",
  "chonburi-pattaya": "chon-buri",
  nonthaburi: "nonthaburi",
  "pathum-thani": "pathum-thani",
  "nakhon-ratchasima": "nakhon-ratchasima",
  korat: "nakhon-ratchasima",
  lampang: "lampang"
};

const coreApiSourceIds = [
  "citydata",
  "open-meteo-weather",
  "open-meteo-air",
  "google-news-rss",
  "jaxa-earth",
  "itic-traffic"
] as const;

function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function createSatelliteDigestFallback(): SatelliteDigest {
  const updatedAt = new Date().toISOString();
  return {
    updatedAt,
    area: {
      id: "thailand",
      label: {
        th: "ประเทศไทย",
        en: "Thailand"
      },
      bbox: [97.343, 5.612, 105.639, 20.465]
    },
    status: {
      provider: "copernicus-data-space",
      configured: false,
      available: false,
      mode: "not-configured",
      message: "Set Copernicus OAuth credentials to enable live Sentinel Hub previews.",
      docsUrl: SATELLITE_DOCS_URL
    },
    previews: [
      {
        id: "true-color",
        title: {
          th: "True color",
          en: "True color"
        },
        description: {
          th: "ภาพสีจริงล่าสุดของประเทศไทยจาก Sentinel-2",
          en: "Latest true-color nationwide view from Sentinel-2."
        },
        collectionId: "sentinel-2-l2a",
        previewUrl: "/api/satellite/preview/true-color",
        legend: {
          th: "สีจริงจาก Sentinel-2",
          en: "Sentinel-2 true color"
        },
        note: {
          th: "เพิ่ม OAuth credentials เพื่อดึงภาพสด",
          en: "Add OAuth credentials to load live imagery."
        },
        available: false,
        generatedAt: updatedAt
      },
      {
        id: "vegetation",
        title: {
          th: "Vegetation",
          en: "Vegetation"
        },
        description: {
          th: "มุมมอง NDVI สำหรับไทย",
          en: "NDVI view for Thailand."
        },
        collectionId: "sentinel-2-l2a",
        previewUrl: "/api/satellite/preview/vegetation",
        legend: {
          th: "แดง = พืชพรรณเด่น",
          en: "Red = stronger vegetation response"
        },
        note: {
          th: "เพิ่ม OAuth credentials เพื่อดึงภาพสด",
          en: "Add OAuth credentials to load live imagery."
        },
        available: false,
        generatedAt: updatedAt
      },
      {
        id: "flood-radar",
        title: {
          th: "Flood radar",
          en: "Flood radar"
        },
        description: {
          th: "ภาพเรดาร์ Sentinel-1 สำหรับฤดูฝนและน้ำท่วม",
          en: "Sentinel-1 radar view for flood and monsoon context."
        },
        collectionId: "sentinel-1-grd",
        previewUrl: "/api/satellite/preview/flood-radar",
        legend: {
          th: "มืด = น้ำมากขึ้น",
          en: "Darker zones often indicate more surface water"
        },
        note: {
          th: "เพิ่ม OAuth credentials เพื่อดึงภาพสด",
          en: "Add OAuth credentials to load live imagery."
        },
        available: false,
        generatedAt: updatedAt
      }
    ],
    metrics: [
      {
        id: "ndvi-median",
        title: {
          th: "NDVI median",
          en: "NDVI median"
        },
        description: {
          th: "ค่ากลาง NDVI ทั่วประเทศ",
          en: "Nationwide NDVI median."
        },
        collectionId: "sentinel-2-l2a",
        value: null,
        displayValue: "--"
      },
      {
        id: "latest-scene-age",
        title: {
          th: "Latest scene age",
          en: "Latest scene age"
        },
        description: {
          th: "เวลาตั้งแต่ภาพล่าสุด",
          en: "Elapsed time since the latest scene."
        },
        collectionId: "sentinel-2-l2a",
        value: null,
        displayValue: "--"
      },
      {
        id: "best-cloud-cover",
        title: {
          th: "Best cloud cover",
          en: "Best cloud cover"
        },
        description: {
          th: "เมฆปกคลุมน้อยที่สุดในชุดล่าสุด",
          en: "Best cloud-cover value in the latest scene set."
        },
        collectionId: "sentinel-2-l2a",
        value: null,
        displayValue: "--"
      }
    ],
    scenes: []
  };
}

const copyDeck = {
  th: {
    title: PUBLIC_DASHBOARD_BRAND.title,
    brandEyebrow: PUBLIC_DASHBOARD_BRAND.eyebrow.th,
    subtitle: "แดชบอร์ดปฏิบัติการสำหรับติดตามสัญญาณเมืองอัจฉริยะไทย",
    view: "มุมมอง",
    range: "ช่วงเวลา",
    share: "คัดลอกลิงก์",
    copied: "คัดลอกแล้ว",
    sync: "ความสดของข้อมูล",
    search: "ค้นหาเมือง โครงการ หรือหัวข้อ",
    publicView: "สาธารณะ",
    admin: "คอนโซล",
    topLine: "สัญญาณหลัก",
    projects: "โครงการ",
    news: "ข่าว",
    resilience: "สภาพอากาศ",
    compare: "เปรียบเทียบเมือง",
    sources: "แหล่งข้อมูล",
    briefing: "สรุปสถานการณ์",
    time: "เวลาอ้างอิง",
    map: "แผนที่สัญญาณ",
    mapAtlas: "ถนน",
    mapSatellite: "ภาพถ่ายทางอากาศ",
    official: "ข่าวภายใน",
    external: "ข่าวภายนอก",
    adminToken: "โทเค็นผู้ดูแล",
    syncNow: "ซิงก์แหล่งข้อมูล",
    publishBriefing: "เผยแพร่สรุป",
    refreshHealth: "ดึงสถานะ",
    adminHelp: "คอนโซลนี้เรียกใช้ API ฝั่งหลังบ้านผ่าน `x-admin-token` เท่านั้น",
    trendWatch: "Google Trends Watch",
    research: "Why This Dashboard Exists",
    toolkit: "Build It Yourself",
    exportJson: "คัดลอก JSON โครงร่าง",
    exported: "คัดลอก JSON แล้ว",
    exportCode: "คัดลอกโค้ด",
    exportLanguage: "ภาษาโค้ด",
    apiDirectory: "Core APIs / Data Ports",
    stack: "Applications Used",
    finePrint: "ข้อกำหนดและคำชี้แจง",
    contactTitle: "ติดต่อผู้จัดทำ",
    contactLead: "ดร. นน อัครประเสริฐกุล | Senior Expert in Smart City Promotion, depa",
    contactPrompt: "หากต้องการร่วมงาน วิจัย ออกแบบแดชบอร์ด หรือพัฒนาโครงการ สามารถติดต่อได้ผ่านช่องทางด้านล่าง",
    contactEmailLabel: "อีเมล",
    contactLinkedInLabel: "LinkedIn",
    privacy: "แดชบอร์ดสาธารณะนี้ไม่ตั้งใจเก็บข้อมูลส่วนบุคคลของผู้ใช้งานทั่วไป และแสดงผลจากข้อมูลสาธารณะ ข้อมูลทดลอง และข้อมูลที่จัดการภายในตามบริบทของต้นแบบ",
    experimental:
      "ต้นแบบนี้เป็นแดชบอร์ดเชิงทดลอง ออกแบบโดย ดร. นน อัครประเสริฐกุล Senior Expert in Smart City Promotion ที่ depa ในฐานะงานทดลองส่วนตัวเพื่อชวนให้คนอื่นสร้างแอปเมืองของตนเองได้",
    builder:
      "แนวคิดหลักคือวันนี้ไม่ควรมีข้ออ้างอีกต่อไปว่าต้องมีพื้นฐาน computer science แบบเดิมถึงจะสร้างเครื่องมือดิจิทัลได้ คุณสามารถใช้ Codex หรือ no-code platform เพื่อเริ่มจากโครงร่างนี้แล้วต่อยอดเอง",
    trendNote:
      "แต่ละแถวแสดงค่าดัชนีล่าสุด การเปลี่ยนแปลง ค่าสูงสุด และค่าเฉลี่ยของคำค้น พร้อมลิงก์เปิด Google Trends ประเทศไทยโดยตรง",
    trendNow: "ล่าสุด",
    trendDelta: "เปลี่ยน",
    trendPeak: "สูงสุด",
    trendAverage: "เฉลี่ย",
    sourceResearch:
      "แหล่งอ้างอิงภายนอกใช้เพื่ออธิบายวิธีคิดของเมืองต่อ dashboards, livability, และ city-as-a-platform",
    changes: "สิ่งที่เปลี่ยน",
    activity: "อัปเดตล่าสุด",
    social: "กระแสสังคม",
    impact: "มาตรการภาครัฐ",
    recenter: "กลับแผนที่",
    eoOverlay: "Rain",
    hotspots: "จุดเด่นตอนนี้",
    focusPresets: "มุมมองด่วน",
    focusAirRisk: "ความเสี่ยงอากาศ",
    focusMonsoonWatch: "ฝน / มรสุม",
    focusCandidates: "เมืองผู้สมัคร",
    focusMediaWatch: "จับตาสื่อ",
    focusEconomyContext: "บริบทเศรษฐกิจ",
    mapLegend: "คำอธิบายแผนที่",
    aqiScale: "ระดับ AQI",
    activeLayersLegend: "เลเยอร์ที่เปิดอยู่",
    clickToFocus: "กดเพื่อโฟกัสบนแผนที่",
    mediaHotspot: "สัญญาณสื่อ",
    weatherLegend: "วงกลมสีฟ้า = อุณหภูมิ / ลม / ฝน",
    projectLegend: "สีน้ำเงิน = ความหนาแน่นของโครงการ",
    newsLegend: "สีเขียว = จุดความเคลื่อนไหวข่าว",
    resilienceLegend: "สีส้ม = พื้นที่เฝ้าระวัง",
    economyLegend: "สีม่วง = ศักยภาพเศรษฐกิจเมือง",
    agricultureLegend: "สีเขียวมะกอก = เขตเกษตรและแปลงเพาะปลูก",
    waterLegend: "สีน้ำเงิน = ลุ่มน้ำ คลอง และแหล่งกักเก็บ",
    landUseLegend: "สีเทา = รูปแบบการใช้ที่ดินและพื้นที่เมือง",
    aerosolLegend: "สีม่วง = ชั้นละอองลอย MODIS จาก NASA GIBS สำหรับหมอกควันและฝุ่นในภาพรวม",
    precipitationLegend: "สีน้ำเงินเข้ม = ฝนดาวเทียม IMERG จาก NASA GIBS สำหรับการกระจายฝนทั่วประเทศ",
    vegetationLegend: "สีเขียว = ชั้น NDVI จาก MODIS สำหรับพื้นที่สีเขียวและแนวพืชพรรณ",
    disasterLegend: "สีส้มเข้ม = โซนเฝ้าระวังภัย",
    coverageLegend: "สีแดง = พื้นที่ smart city ทั่วประเทศ",
    jaxaLegend: "สีน้ำเงินฟ้า = ภาพซ้อนปริมาณฝนจาก JAXA",
    soilMoistureLegend: "สีน้ำตาล = ความชื้นดินจาก NASA SMAP",
    fireThermalLegend: "สีแดง = แถบความร้อนอินฟราเรดจาก MODIS Aqua สำหรับเฝ้าระวังความร้อน",
    snowCoverLegend: "สีขาวฟ้า = พื้นที่หิมะปกคลุมจาก MODIS",
    chlorophyllLegend: "สีเขียวเข้ม = คลอโรฟิลล์ทะเลจาก MODIS Aqua / ESA OC-CCI",
    cloudPhaseLegend: "สีเทา = เฟสเมฆอินฟราเรดจาก MODIS Aqua",
    bangkokPlacesLegend: "สีเขียว = จุดฐานข้อมูลกรุงเทพฯ",
    thresholdWatch: "เกณฑ์เฝ้าระวัง",
    thisWeek: "ใหม่ในรอบนี้",
    mentions: "การกล่าวถึง",
    sentiment: "โทน",
    sourceMix: "แหล่งอ้างอิง",
    markets: "บริบทตลาด",
    globalSignals: "สัญญาณโลก",
    worldWatch: "จับตาโลก",
    apiWatch: "แหล่งข้อมูล",
    noExternalSignals: "ยังไม่มีสัญญาณภายนอกเพิ่มเติม",
    sourceStatus: "สถานะแหล่งข้อมูล",
    worldContext: "บริบทโลก",
    placeLookup: "ข้อมูลเมือง",
    askAssistant: "ถาม Smart City",
    askLead: "AI ผู้ช่วย",
    askQuestionMap: "แผนที่คำถาม",
    askQuestionMapNote: "คำถามเหล่านี้มาจากกรอบคิดที่ซ้ำกันใน Hitachi Review และ Smart City Primer",
    askPlaceholder: "ถามอะไรก็ได้เกี่ยวกับเมืองหรือข้อมูลที่คุณเห็น",
    askSubmit: "ถาม",
    askClose: "ปิด",
    askContext: "บริบทที่ส่งให้ผู้ช่วย",
    askGrounding: "อ้างอิงจาก Knowledge + มุมมองปัจจุบัน",
    askNoAnswer: "ยังไม่มีคำตอบ",
    askSources: "เอกสารอ้างอิง",
    askLocalOnly: "Local RAG",
    askGeminiReady: "Gemini พร้อมเชื่อม",
    population: "ประชากร",
    region: "ภูมิภาค",
    smartFocus: "ประเด็นเมืองอัจฉริยะ",
    leadingDomains: "มิติเด่น",
    liveWatch: "เฝ้าระวังสด",
    airHotspot: "จุด AQI สูง",
    weatherHotspot: "อากาศร้อนสุด",
    latestSignal: "สัญญาณล่าสุด",
    syncWindow: "รอบซิงก์",
    candidateCompare: "เทียบเมืองผู้สมัคร",
    modelCity: "เมืองต้นแบบ",
    fitSignal: "เหตุผลที่เหมาะ",
    transferIdeas: "แนวทางที่ย้ายมาใช้ได้",
    livabilityLens: "กรอบ Livability",
    eiuRank: "อันดับ EIU 2025",
    satellite: "Satellite Intelligence",
    satelliteMapStack: "สไตล์แผนที่ + ชั้นภาพ",
    satelliteLivePreviews: "ภาพสดจาก Copernicus / Sentinel",
    satelliteLiveLayers: "แผนที่ฐานและชั้นภาพที่เปิดใช้ได้ทันที",
    satelliteReadySources: "Copernicus / Sentinel ที่พร้อมเชื่อม",
    satelliteThailandPriority: "ลำดับความสำคัญสำหรับไทย",
    satelliteSignalReady: "NASA GIBS และ JAXA เปิดใช้ได้แล้ว ขณะที่ Copernicus / Sentinel พร้อมต่อด้วย OAuth",
    satelliteMetrics: "ความสดของภาพและดัชนี EO",
    satelliteRecentScenes: "ชุดภาพล่าสุด",
    satelliteSceneDate: "วันที่ภาพ",
    satelliteCloudCover: "เมฆ",
    satelliteDocs: "ดูเอกสาร API",
    satelliteCredentialsStatus: "ต้องมี credentials",
    satelliteCredentialsNeeded: "ต้องเพิ่ม OAuth credentials เพื่อเปิดภาพสด",
    satelliteOauthLive: "OAuth live",
    satelliteDegraded: "Degraded",
    copyright:
      "ลิขสิทธิ์ เครื่องหมายการค้า และข้อมูลภายนอกเป็นของเจ้าของแต่ละราย ต้นแบบนี้เผยแพร่เป็นทรัพยากรการเรียนรู้แบบเปิด และควรตรวจสอบข้อมูลซ้ำก่อนใช้เชิงปฏิบัติการ"
  },
  en: {
    title: PUBLIC_DASHBOARD_BRAND.title,
    brandEyebrow: PUBLIC_DASHBOARD_BRAND.eyebrow.en,
    subtitle: "Live operations dashboard for Thailand's smart city intelligence",
    view: "View",
    range: "Time Range",
    share: "Copy Link",
    copied: "Copied",
    sync: "Data Freshness",
    search: "Search cities, projects, or topics",
    publicView: "Public",
    admin: "Console",
    topLine: "Current Pulse",
    projects: "Projects",
    news: "News",
    resilience: "Weather & Environment",
    compare: "City Compare",
    sources: "Sources",
    briefing: "Briefing",
    time: "Reference Time",
    map: "Signal Map",
    mapAtlas: "Street",
    mapSatellite: "Aerial",
    official: "Official",
    external: "External",
    adminToken: "Admin token",
    syncNow: "Run sync",
    publishBriefing: "Publish briefing",
    refreshHealth: "Load source health",
    adminHelp: "This console only calls backend admin APIs with an `x-admin-token` header.",
    trendWatch: "Google Trends Watch",
    research: "Why This Dashboard Exists",
    toolkit: "Build It Yourself",
    exportJson: "Copy JSON Skeleton",
    exported: "JSON copied",
    exportCode: "Copy Code",
    exportLanguage: "Code Language",
    apiDirectory: "Core APIs / Data Ports",
    stack: "Applications Used",
    finePrint: "Fine Print",
    contactTitle: "Contact",
    contactLead: "Dr. Non Arkaraprasertkul | Senior Expert in Smart City Promotion, depa",
    contactPrompt: "For collaboration, research, dashboard design, or project work, use the contact channels below.",
    contactEmailLabel: "Email",
    contactLinkedInLabel: "LinkedIn",
    privacy:
      "This public dashboard is not intended to collect personal data from general visitors and is designed to surface public, experimental, and manually curated operational signals.",
    experimental:
      "This is an experimental dashboard designed by Dr. Non Arkaraprasertkul, Senior Expert in Smart City Promotion at depa, as a hobby project that became a practical civic design exercise.",
    builder:
      "The point is simple: there is no longer a credible excuse that building useful civic software must wait for formal computer-science training. This skeleton is meant to help others build their own tools with Codex or any no-code platform.",
    trendNote:
      "Each row shows the current index, change, peak, and average for the tracked term, and opens Google Trends for Thailand directly.",
    trendNow: "Now",
    trendDelta: "Delta",
    trendPeak: "Peak",
    trendAverage: "Avg",
    sourceResearch:
      "External references are included to show how cities use dashboards for operations, livability, and city-as-a-platform thinking.",
    changes: "What Changed",
    activity: "Recent Updates",
    social: "Public Sentiment",
    impact: "Government Actions",
    recenter: "Center Map",
    eoOverlay: "Rain",
    hotspots: "Hotspots Now",
    focusPresets: "Focus Presets",
    focusAirRisk: "Air Risk",
    focusMonsoonWatch: "Rain / Monsoon",
    focusCandidates: "Candidate Cities",
    focusMediaWatch: "Media Watch",
    focusEconomyContext: "Economic Context",
    mapLegend: "Map Legend",
    aqiScale: "AQI Scale",
    activeLayersLegend: "Active Layers",
    clickToFocus: "Click to focus on the map",
    mediaHotspot: "Media Spike",
    weatherLegend: "Blue circles = temperature / wind / rain",
    projectLegend: "Blue = project density",
    newsLegend: "Green = news signal points",
    resilienceLegend: "Amber = watch areas",
    economyLegend: "Purple = city economic strength",
    agricultureLegend: "Olive = crop belts and farming zones",
    waterLegend: "Blue = basins, canals, and storage nodes",
    landUseLegend: "Gray = land-use and urban pattern zones",
    aerosolLegend: "Purple = NASA GIBS MODIS aerosol optical depth for haze and dust context",
    precipitationLegend: "Blue = NASA GIBS IMERG satellite precipitation for nationwide rainfall context",
    vegetationLegend: "Green = NASA GIBS MODIS NDVI for vegetation and green-corridor context",
    disasterLegend: "Deep orange = hazard watch zone",
    coverageLegend: "Red = nationwide smart city footprint",
    jaxaLegend: "Sky blue = JAXA rainfall raster overlay",
    soilMoistureLegend: "Brown = NASA SMAP soil moisture for agriculture and flood planning",
    fireThermalLegend: "Red = MODIS Aqua thermal infrared watch for elevated heat stress",
    snowCoverLegend: "Ice blue = MODIS snow cover for Himalayan and Asian watershed monitoring",
    chlorophyllLegend: "Teal = MODIS Aqua ocean chlorophyll, merged with ESA OC-CCI program",
    cloudPhaseLegend: "Gray = MODIS Aqua cloud phase infrared for weather context",
    bangkokPlacesLegend: "Green = Bangkok shared places",
    thresholdWatch: "Threshold Watch",
    thisWeek: "New This Cycle",
    mentions: "Mentions",
    sentiment: "Tone",
    sourceMix: "Source Mix",
    markets: "Market Context",
    globalSignals: "Global Signals",
    worldWatch: "World Watch",
    apiWatch: "Data Sources",
    noExternalSignals: "No additional external signals yet",
    sourceStatus: "Source Status",
    worldContext: "World Context",
    placeLookup: "City Lookup",
    askAssistant: "Ask Smart City",
    askLead: "Knowledge AI",
    askQuestionMap: "Question Map",
    askQuestionMapNote: "These prompts come from the recurring frames in the Hitachi Review and the Smart City Primer",
    askPlaceholder: "Ask anything about your city or the data you see",
    askSubmit: "Ask",
    askClose: "Close",
    askContext: "Current context",
    askGrounding: "Grounded in the local Knowledge folder + the current dashboard view",
    askNoAnswer: "No answer yet",
    askSources: "Citations",
    askLocalOnly: "Local RAG",
    askGeminiReady: "Gemini hook ready",
    population: "Population",
    region: "Region",
    smartFocus: "Smart City Focus",
    leadingDomains: "Leading Domains",
    liveWatch: "Live Watch",
    airHotspot: "AQI Hotspot",
    weatherHotspot: "Heat Watch",
    latestSignal: "Latest Signal",
    syncWindow: "Sync Window",
    candidateCompare: "Candidate Compare",
    modelCity: "Model City",
    fitSignal: "Why It Fits",
    transferIdeas: "Transferable Ideas",
    livabilityLens: "Livability Lens",
    eiuRank: "EIU 2025 Rank",
    satellite: "Satellite Intelligence",
    satelliteMapStack: "Map styles + overlays",
    satelliteLivePreviews: "Live Copernicus / Sentinel previews",
    satelliteLiveLayers: "Live basemaps + overlays",
    satelliteReadySources: "Copernicus / Sentinel ready",
    satelliteThailandPriority: "Thailand priorities",
    satelliteSignalReady: "NASA GIBS and JAXA are live now, while Copernicus / Sentinel are ready for OAuth-backed integration.",
    satelliteMetrics: "Scene freshness + EO metrics",
    satelliteRecentScenes: "Recent scenes",
    satelliteSceneDate: "Scene date",
    satelliteCloudCover: "Cloud",
    satelliteDocs: "API docs",
    satelliteCredentialsStatus: "Credentials needed",
    satelliteCredentialsNeeded: "Add OAuth credentials to enable live previews",
    satelliteOauthLive: "OAuth live",
    satelliteDegraded: "Degraded",
    copyright:
      "Copyright, trademarks, and external datasets remain with their respective owners. This prototype is shared as an open learning resource and should be independently validated before operational use."
  }
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOverviewSnapshotPayload(value: unknown) {
  return (
    isObject(value) &&
    Array.isArray(value.cities) &&
    Array.isArray(value.domains) &&
    Array.isArray(value.metrics) &&
    isObject(value.briefing)
  );
}

function isMapFeatureCollectionPayload(value: unknown) {
  return Array.isArray(value) && value.every((item) => isObject(item) && typeof item.layerId === "string" && Array.isArray(item.features));
}

function isSourceRecordPayload(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every((item) => isObject(item) && typeof item.id === "string" && typeof item.name === "string" && typeof item.category === "string")
  );
}

function isDistrictProfilePayload(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.slug === "string" &&
        typeof item.citySlug === "string"
    )
  );
}

function isDecisionQueuePayload(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.citySlug === "string" &&
        typeof item.domainSlug === "string"
    )
  );
}

function isTimeSnapshotPayload(value: unknown) {
  return isObject(value) && Array.isArray(value.zones);
}

function isSatelliteDigestPayload(value: unknown) {
  return (
    isObject(value) &&
    Array.isArray(value.previews) &&
    Array.isArray(value.metrics) &&
    Array.isArray(value.scenes) &&
    isObject(value.status)
  );
}

function isSlicThailandPayload(value: unknown) {
  return isObject(value) && Array.isArray(value.topCities) && isObject(value.source);
}

function isPublicCctvPayload(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.cameraId === "string" &&
        typeof item.source === "string" &&
        typeof item.lat === "number" &&
        typeof item.lon === "number" &&
        typeof item.imageUrl === "string" &&
        typeof item.status === "string" &&
        typeof item.zone === "string" &&
        (typeof item.previewUrl === "string" || typeof item.previewUrl === "undefined") &&
        (typeof item.lastCheckedAt === "string" || typeof item.lastCheckedAt === "undefined") &&
        (typeof item.lastSuccessfulAt === "string" || typeof item.lastSuccessfulAt === "undefined") &&
        (typeof item.statusCode === "number" || item.statusCode === null || typeof item.statusCode === "undefined") &&
        (isObject(item.statusDetail)
          ? typeof item.statusDetail.th === "string" && typeof item.statusDetail.en === "string"
          : typeof item.statusDetail === "undefined") &&
        isObject(item.label) &&
        typeof item.label.th === "string" &&
        typeof item.label.en === "string"
    )
  );
}

async function fetchFromApi<T>(path: string, fallback: T, validate?: (value: unknown) => boolean): Promise<T> {
  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`);
      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      if (payload === null) {
        continue;
      }

      if (validate && !validate(payload)) {
        continue;
      }

      return payload as T;
    } catch {
      // Try the next configured API base before falling back to seed data.
    }
  }

  return fallback;
}

async function postToApi<TResponse>(path: string, body: unknown): Promise<TResponse> {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        lastError = new Error(payload.message ?? "Request failed");
        continue;
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Request failed");
    }
  }

  throw lastError ?? new Error("Request failed");
}

function createQueryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  return query.toString();
}

function getDefaultLayers(view: DashboardView, citySlug: string) {
  if (view === "national") {
    return ["smart-city-thailand", "weather", "pollution", "projects", "resilience"];
  }

  if (citySlug === "muang-thong-thani") {
    return ["mtt-boundary", "mtt-zones", "mtt-grid", "projects", "itic-traffic", "cctv-cameras", "incidents"];
  }

  return [
    "weather",
    "pollution",
    "projects",
    "itic-traffic",
    "resilience",
    ...(citySlug === "bangkok" ? ["bangkok-passages"] : [])
  ];
}

function parseLayerSet(raw: string | null, view: DashboardView, citySlug: string) {
  if (!raw) {
    return getDefaultLayers(view, citySlug);
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeArray<T>(value: T[] | undefined | null, fallback: T[]) {
  return Array.isArray(value) ? value : fallback;
}

function normalizeOverviewSnapshot(value: OverviewSnapshot | undefined, fallback: OverviewSnapshot): OverviewSnapshot {
  if (
    !value ||
    !Array.isArray(value.cities) ||
    value.cities.length === 0 ||
    !Array.isArray(value.domains) ||
    !Array.isArray(value.metrics) ||
    !value.briefing ||
    typeof value.updatedAt !== "string"
  ) {
    return fallback;
  }

  return value;
}

function normalizeTimeSnapshot(value: TimeSnapshot | undefined, fallback: TimeSnapshot): TimeSnapshot {
  if (!value || !Array.isArray(value.zones) || typeof value.updatedAt !== "string") {
    return fallback;
  }

  return value;
}

function Sparkline({ values }: { values: number[] }) {
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - value}`).join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function getTrendStats(values: number[]) {
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? latest;
  const peak = Math.max(...values);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));

  return {
    latest,
    delta: latest - previous,
    peak,
    average
  };
}

function formatUtcClock(value?: string) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toISOString().slice(11, 16);
}

function formatUtcDateTime(value?: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function formatPopulation(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function aqiLabel(value: number, lang: Locale): string {
  if (value <= 50) return lang === "th" ? "ดี" : "Good";
  if (value <= 100) return lang === "th" ? "ปานกลาง" : "Moderate";
  if (value <= 150) return lang === "th" ? "ไม่ดีต่อกลุ่มเสี่ยง" : "Sensitive groups";
  if (value <= 200) return lang === "th" ? "ไม่ดีต่อสุขภาพ" : "Unhealthy";
  if (value <= 300) return lang === "th" ? "อันตราย" : "Very unhealthy";
  return lang === "th" ? "อันตรายมาก" : "Hazardous";
}

function formatSignalLabel(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeCitySlug(value?: string) {
  if (!value) {
    return "";
  }

  return value.toLowerCase().replace(/\s+/g, "-");
}

const cityFeatureAliases: Record<string, string[]> = {
  bangkok: ["bangkok", "krung-thep"],
  phuket: ["phuket"],
  "khon-kaen": ["khon-kaen", "khonkaen"],
  "chiang-mai": ["chiang-mai", "chiangmai"],
  "nonthaburi": ["nonthaburi", "nonthaburii"]
};

function featureMatchesCity(feature: GeoFeatureRecord, citySlug: string) {
  const aliases = cityFeatureAliases[citySlug] ?? [citySlug];
  const cityTokens = new Set(aliases);
  const candidates = [feature.properties.city, feature.title];

  return candidates.some((candidate) => cityTokens.has(normalizeCitySlug(String(candidate ?? ""))));
}

function featureMatchesDistrict(feature: GeoFeatureRecord, districtSlug: string) {
  const explicitDistrict = normalizeCitySlug(String(feature.properties.districtSlug ?? ""));
  if (explicitDistrict) {
    return explicitDistrict === districtSlug;
  }

  const namedDistrict = normalizeCitySlug(String(feature.properties.district ?? ""));
  if (namedDistrict) {
    return namedDistrict === districtSlug;
  }

  return true;
}

function fillPromptTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, value);
  }, template);
}

function numericProperty(feature: GeoFeatureRecord, key: string) {
  const raw = feature.properties[key];
  return typeof raw === "number" ? raw : Number(raw ?? 0);
}

function stringProperty(feature: GeoFeatureRecord, key: string) {
  const raw = feature.properties[key];
  return raw === null || raw === undefined ? "" : String(raw);
}

function timeValue(value?: string) {
  const parsed = new Date(value ?? "").getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function matchesCoverageDomain(feature: GeoFeatureRecord, domainSlug?: string) {
  if (!domainSlug) {
    return true;
  }

  const keywords = COVERAGE_DOMAIN_KEYWORDS[domainSlug];
  if (!keywords) {
    return true;
  }

  const haystack = [
    feature.title,
    feature.description ?? "",
    ...Object.values(feature.properties).map((value) => String(value ?? ""))
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword));
}

function useDashboardData(searchParams: URLSearchParams) {
  const lang = (searchParams.get("lang") === "th" ? "th" : "en") as Locale;
  const defaultCity = (import.meta.env.VITE_DEFAULT_CITY as string | undefined) || "muang-thong-thani";
  const isMttSite = defaultCity === "muang-thong-thani";
  const defaultView = ((import.meta.env.VITE_DEFAULT_VIEW as string | undefined) || (isMttSite ? "city" : "national")) as DashboardView;
  const view = (searchParams.get("view") as DashboardView) || defaultView;
  const timeRange = (searchParams.get("timeRange") as TimeRange) || "7d";
  const city = searchParams.get("city") ?? defaultCity;
  const district = searchParams.get("district") ?? "";
  const domain = searchParams.get("domain") ?? "";
  const rawLayers = searchParams.get("layers");
  const layers = useMemo(() => parseLayerSet(rawLayers, view, city), [city, rawLayers, view]);
  const cityFilter = view === "national" ? "" : city;
  const districtFilter = view === "national" ? "" : district;
  const queryString = new URLSearchParams(searchParams);

  queryString.set("view", view);
  queryString.set("timeRange", timeRange);
  queryString.set("city", city);
  queryString.set("layers", layers.join(","));
  queryString.set("lang", lang);
  if (domain) {
    queryString.set("domain", domain);
  } else {
    queryString.delete("domain");
  }
  if (districtFilter) {
    queryString.set("district", districtFilter);
  } else {
    queryString.delete("district");
  }

  const overviewFallback = createOverviewSnapshot({
    view,
    timeRange,
    city,
    domain: domain || undefined,
    layers
  });
  const districtFallback = cloneSeed(districtSeed.filter((item) => !cityFilter || item.citySlug === cityFilter));
  const projectFallback = cloneSeed(
    projectSeed.filter((project) => {
      if (cityFilter && project.citySlug !== cityFilter) return false;
      if (districtFilter && project.districtSlug && project.districtSlug !== districtFilter) return false;
      return true;
    })
  );
  const newsFallback = cloneSeed(
    newsSeed.filter((item) => {
      if (cityFilter && item.citySlug && item.citySlug !== cityFilter) return false;
      if (districtFilter && item.districtSlug && item.districtSlug !== districtFilter) return false;
      if (domain && item.domainSlug && item.domainSlug !== domain) return false;
      return true;
    })
  );
  const decisionFallback = cloneSeed(
    decisionQueueSeed.filter((item) => {
      if (cityFilter && item.citySlug !== cityFilter) return false;
      if (districtFilter && item.districtSlug && item.districtSlug !== districtFilter) return false;
      if (domain && item.domainSlug !== domain) return false;
      return true;
    })
  );
  const globalNewsFallback = cloneSeed(newsSeed.filter((item) => item.kind === "external").slice(0, 6));
  const activityFallback = cloneSeed(activityLogSeed).slice(0, 6);
  const sourcesFallback = cloneSeed(sourceSeed);
  const mapFeaturesFallback = cloneSeed(
    mapFeatureSeed.filter((collection) => layers.includes(collection.layerId) || collection.layerId === "bangkok-passages")
  );
  const mediaFeedsFallback = cloneSeed(mediaFeedSeed);
  const commandCenterFallback = createCommandCenterSnapshot();
  const timeFallback = createTimeSnapshot();

  const overviewQuery = useQuery({
    queryKey: ["overview", queryString.toString()],
    queryFn: () =>
      fetchFromApi<OverviewSnapshot>(`/api/overview?${queryString.toString()}`, overviewFallback, isOverviewSnapshotPayload),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", city, districtFilter, domain],
    queryFn: () =>
      fetchFromApi<ProjectRecord[]>(
        `/api/projects?${createQueryString({
          city: cityFilter || undefined,
          district: districtFilter || undefined,
          domain: domain || undefined
        })}`,
        projectFallback,
        Array.isArray
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const newsQuery = useQuery({
    queryKey: ["news", city, districtFilter, domain],
    queryFn: () =>
      fetchFromApi<NewsItem[]>(
        `/api/news?${createQueryString({
          limit: "8",
          city: cityFilter || undefined,
          district: districtFilter || undefined,
          domain: domain || undefined
        })}`,
        newsFallback,
        Array.isArray
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const globalNewsQuery = useQuery({
    queryKey: ["news-global"],
    queryFn: () => fetchFromApi<NewsItem[]>("/api/news?kind=external&limit=6", globalNewsFallback, Array.isArray),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const resilienceQuery = useQuery({
    queryKey: ["resilience"],
    queryFn: () =>
      fetchFromApi<ResilienceSnapshot>(
        "/api/resilience",
        cloneSeed(resilienceSeed),
        (value) => isObject(value) && Array.isArray(value.warnings) && Array.isArray(value.stressors)
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const changesQuery = useQuery({
    queryKey: ["changes"],
    queryFn: () =>
      fetchFromApi<ChangePulse>("/api/changes", cloneSeed(changePulseSeed), (value) => isObject(value) && Array.isArray(value.items)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const activityQuery = useQuery({
    queryKey: ["activity"],
    queryFn: () => fetchFromApi<ActivityLogItem[]>("/api/activity?limit=6", activityFallback, Array.isArray),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const districtsQuery = useQuery({
    queryKey: ["districts", cityFilter],
    queryFn: () =>
      fetchFromApi<DistrictProfile[]>(
        `/api/districts${cityFilter ? `?city=${cityFilter}` : ""}`,
        districtFallback,
        isDistrictProfilePayload
      ),
    staleTime: 60000
  });

  const decisionsQuery = useQuery({
    queryKey: ["decisions", city, districtFilter, domain],
    queryFn: () =>
      fetchFromApi<DecisionQueueItem[]>(
        `/api/decisions?${createQueryString({
          limit: "8",
          city: cityFilter || undefined,
          district: districtFilter || undefined,
          domain: domain || undefined
        })}`,
        decisionFallback,
        isDecisionQueuePayload
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const socialListeningQuery = useQuery({
    queryKey: ["social-listening"],
    queryFn: () =>
      fetchFromApi<SocialListeningSnapshot>(
        "/api/social-listening",
        cloneSeed(socialListeningSeed),
        (value) => isObject(value) && typeof value.mentionCount === "number" && Array.isArray(value.topTerms)
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const impactQuery = useQuery({
    queryKey: ["impact"],
    queryFn: () =>
      fetchFromApi<OfficialImpactSnapshot>(
        "/api/impact",
        cloneSeed(officialImpactSeed),
        (value) => isObject(value) && typeof value.officialUpdates === "number" && isObject(value.source)
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const marketQuery = useQuery({
    queryKey: ["markets"],
    queryFn: () => fetchFromApi<MarketSnapshot>("/api/markets", cloneSeed(marketSnapshotSeed), (value) => isObject(value) && Array.isArray(value.items)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const sourcesQuery = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchFromApi<SourceRecord[]>("/api/sources", sourcesFallback, isSourceRecordPayload),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const satelliteDigestQuery = useQuery({
    queryKey: ["satellite-digest"],
    queryFn: () =>
      fetchFromApi<SatelliteDigest>("/api/satellite/digest", createSatelliteDigestFallback(), isSatelliteDigestPayload),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const mapFeaturesQuery = useQuery({
    queryKey: ["map-features", layers.join(","), city],
    queryFn: () =>
      fetchFromApi<MapFeatureCollection[]>(
        `/api/map/features?layers=${encodeURIComponent(layers.join(","))}`,
        mapFeaturesFallback,
        isMapFeatureCollectionPayload
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const mediaFeedsQuery = useQuery({
    queryKey: ["media-feeds"],
    queryFn: () => fetchFromApi<MediaFeedItem[]>("/api/media/feeds", mediaFeedsFallback, Array.isArray),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const publicCctvFallback = cloneSeed(publicCctvCameraSeed);
  const publicCctvQuery = useQuery({
    queryKey: ["public-cctv"],
    queryFn: () => fetchFromApi<PublicCctvCamera[]>("/api/cctv/public", publicCctvFallback, isPublicCctvPayload),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const commandCenterQuery = useQuery({
    queryKey: ["command-center"],
    queryFn: () =>
      fetchFromApi<CommandCenterSnapshot>(
        "/api/command-center",
        commandCenterFallback,
        (value) => isObject(value) && Array.isArray(value.connectors) && Array.isArray(value.cameraEvents)
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const timeQuery = useQuery({
    queryKey: ["time"],
    queryFn: () => fetchFromApi<TimeSnapshot>("/api/time", timeFallback, isTimeSnapshotPayload),
    refetchInterval: 1000
  });

  const arenaEventsQuery = useQuery({
    queryKey: ["arena-events"],
    queryFn: () => fetchFromApi<ImpactArenaEvent[]>("/api/arena-events", cloneSeed(impactArenaEventsSeed), Array.isArray),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const mucFallback = createMucSnapshot();
  const mucQuery = useQuery({
    queryKey: ["muc"],
    queryFn: () => fetchFromApi<MucSnapshot>("/api/muc", mucFallback, (v) => isObject(v) && isObject((v as Record<string, unknown>).gateFlow)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const incidentQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchFromApi<IncidentRecord[]>("/api/incidents", cloneSeed(incidentSeed), Array.isArray),
    refetchInterval: LIVE_POLL_INTERVAL_MS
  });

  const communityIntelFallback: CommunityIntelSnapshot = { updatedAt: new Date().toISOString(), uvIndex: 8.2, uvLabel: "very-high", sunriseLocal: "06:12", sunsetLocal: "18:28", flightsOverhead: 14, nearbyEarthquakes: [], thaiHolidays: [{ date: "2026-04-06", localName: "วันจักรี", name: "Chakri Memorial Day" }, { date: "2026-04-13", localName: "วันสงกรานต์", name: "Songkran" }], populationThailand: 71801279, lotteryLatest: { date: "2026-03-16", firstPrize: "835127" } };
  const communityIntelQuery = useQuery({
    queryKey: ["community-intel"],
    queryFn: () => fetchFromApi<CommunityIntelSnapshot>("/api/community-intel", communityIntelFallback, (v) => isObject(v) && typeof (v as Record<string, unknown>).uvIndex === "number"),
    refetchInterval: 600_000 // 10 min
  });

  const floodRiskQuery = useQuery({
    queryKey: ["flood-risk"],
    queryFn: () => fetchFromApi<FloodRiskSnapshot>("/api/flood-risk", cloneSeed(floodRiskSeed), (v) => isObject(v) && Array.isArray((v as Record<string, unknown>).stations)),
    refetchInterval: LIVE_POLL_INTERVAL_MS
  });

  const transitQuery = useQuery({
    queryKey: ["transit"],
    queryFn: () => fetchFromApi<TransitSnapshot>("/api/transit", cloneSeed(transitSeed), (v) => isObject(v) && Array.isArray((v as Record<string, unknown>).connections)),
    refetchInterval: LIVE_POLL_INTERVAL_MS
  });

  const overview = normalizeOverviewSnapshot(overviewQuery.data, overviewFallback);

  return {
    lang,
    view,
    timeRange,
    city,
    district,
    domain,
    layers,
    overview,
    districts: safeArray(districtsQuery.data, districtFallback),
    decisions: safeArray(decisionsQuery.data, decisionFallback),
    projects: safeArray(projectsQuery.data, projectFallback),
    news: safeArray(newsQuery.data, newsFallback),
    globalNews: safeArray(globalNewsQuery.data, globalNewsFallback),
    resilience: resilienceQuery.data ?? cloneSeed(resilienceSeed),
    changes: changesQuery.data ?? cloneSeed(changePulseSeed),
    activity: safeArray(activityQuery.data, activityFallback),
    socialListening: socialListeningQuery.data ?? cloneSeed(socialListeningSeed),
    impact: impactQuery.data ?? cloneSeed(officialImpactSeed),
    markets: marketQuery.data ?? cloneSeed(marketSnapshotSeed),
    sources: safeArray(sourcesQuery.data, sourcesFallback),
    satelliteDigest: satelliteDigestQuery.data ?? createSatelliteDigestFallback(),
    mapFeatures: safeArray(mapFeaturesQuery.data, mapFeaturesFallback),
    mediaFeeds: safeArray(mediaFeedsQuery.data, mediaFeedsFallback),
    publicCctvCameras: safeArray(publicCctvQuery.data, publicCctvFallback),
    commandCenter: commandCenterQuery.data ?? commandCenterFallback,
    time: normalizeTimeSnapshot(timeQuery.data, timeFallback),
    arenaEvents: safeArray(arenaEventsQuery.data, cloneSeed(impactArenaEventsSeed)),
    muc: mucQuery.data ?? mucFallback,
    incidents: safeArray(incidentQuery.data, cloneSeed(incidentSeed)),
    floodRisk: floodRiskQuery.data ?? cloneSeed(floodRiskSeed),
    transit: transitQuery.data ?? cloneSeed(transitSeed),
    communityIntel: communityIntelQuery.data ?? communityIntelFallback
  };
}

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSkeleton, setCopiedSkeleton] = useState(false);
  const [exportLanguage, setExportLanguage] = useState<"json" | "typescript" | "python">("json");
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "satellite" | "cctv" | "traffic" | "air" | "insights" | "data">("map");
  const [cctvGridLayout, setCctvGridLayout] = useState<CctvGridLayout>("3x3");
  const [activeCctvGroup, setActiveCctvGroup] = useState<string | null>(null);
  const [expandedCameraId, setExpandedCameraId] = useState<string | null>(null);
  const [layerPaletteOpen, setLayerPaletteOpen] = useState(false);
  const [opsDrawerState, setOpsDrawerState] = useState<OpsDrawerState | null>(null);
  const [timeCompareEnabled, setTimeCompareEnabled] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>(["bangkok", "chiang-mai", "phuket"]);
  const [overlayStudioSettings, setOverlayStudioSettings] = useState<Record<string, OverlayStudioSetting>>(
    () => createDefaultOverlayStudioSettings()
  );
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const assistantStatusQuery = useQuery({
    queryKey: ["assistant-status"],
    queryFn: () =>
      fetchFromApi<AssistantStatus>(
        "/api/assistant/status",
        { available: false, documentCount: 0, geminiReady: false },
        (value) => isObject(value) && typeof value.available === "boolean"
      ),
    staleTime: 60000
  });
  const assistantStatus = assistantStatusQuery.data ?? null;
  const deferredSearchText = useDeferredValue(searchText);
  const modelCityParam = searchParams.get("modelCity") ?? "";
  const basemap = ((): "atlas" | "satellite" | "street" | "hybrid" => {
    const param = searchParams.get("basemap");
    if (param === "satellite" || param === "street" || param === "hybrid") return param;
    return "atlas";
  })();

  useEffect(() => {
    document.title = PUBLIC_DASHBOARD_BRAND.title;
  }, []);

  const {
    lang,
    view,
    timeRange,
    city,
    district,
    domain,
    layers,
    overview,
    districts,
    decisions,
    projects,
    news,
    globalNews,
    resilience,
    changes,
    activity,
    socialListening,
    impact,
    markets,
    sources,
    satelliteDigest,
    mapFeatures,
    mediaFeeds,
    publicCctvCameras,
    commandCenter,
    time,
    arenaEvents,
    muc,
    incidents,
    floodRisk,
    transit,
    communityIntel
  } = useDashboardData(searchParams);

  const copy = copyDeck[lang];
  const cityBySlug = new Map(overview.cities.map((item) => [item.slug, item]));
  const selectedCity = cityBySlug.get(city) ?? overview.cities[0];
  const isMuangThongCityView = view === "city" && city === "muang-thong-thani";

  /* ── MUC Operator Status ── */
  const mucBottleneckCount = muc.trafficFlow.bottlenecks.filter((b) => b.severity === "bottleneck" || b.severity === "gridlock").length;
  const mucAqiAlertCount = muc.airQuality.zones.filter((z) => z.isAboveThreshold).length;
  const mucCctvAlertCount = muc.cctvConsole.detectionHistory.filter((d) => d.severity === "alert").length;
  const mucOverCapGates = muc.gateFlow.gates.filter((g) => {
    const nowH = new Date().getUTCHours();
    const bucket = muc.gateFlow.buckets.find((b) => b.gateId === g.id && new Date(b.periodStart).getUTCHours() === nowH);
    return bucket ? (bucket.countIn + bucket.countOut) > g.capacity : false;
  }).length;
  const mucIssueTotal = mucBottleneckCount + mucAqiAlertCount + mucCctvAlertCount + mucOverCapGates;
  const mucStatus: "green" | "amber" | "red" = mucIssueTotal === 0 ? "green" : (mucBottleneckCount > 1 || mucAqiAlertCount > 1 || mucCctvAlertCount > 0) ? "red" : "amber";
  const mucStatusParts: string[] = [];
  if (mucBottleneckCount > 0) mucStatusParts.push(lang === "th" ? `${mucBottleneckCount} จุดคอขวด` : `${mucBottleneckCount} bottleneck${mucBottleneckCount > 1 ? "s" : ""}`);
  if (mucAqiAlertCount > 0) mucStatusParts.push(lang === "th" ? `${mucAqiAlertCount} เขต AQI เกิน` : `${mucAqiAlertCount} AQI alert${mucAqiAlertCount > 1 ? "s" : ""}`);
  if (mucCctvAlertCount > 0) mucStatusParts.push(lang === "th" ? `${mucCctvAlertCount} แจ้งเตือนกล้อง` : `${mucCctvAlertCount} camera alert${mucCctvAlertCount > 1 ? "s" : ""}`);
  if (mucOverCapGates > 0) mucStatusParts.push(lang === "th" ? `${mucOverCapGates} ประตูเกินรองรับ` : `${mucOverCapGates} gate${mucOverCapGates > 1 ? "s" : ""} over capacity`);
  const mucStatusLine = mucStatusParts.length > 0 ? mucStatusParts.join(" · ") : (lang === "th" ? "ปกติ — ไม่มีเหตุการณ์" : "All clear — no incidents");

  const totalVehiclesToday = muc.gateFlow.buckets.reduce((s, b) => s + b.countIn + b.countOut, 0);
  const peakHourData = muc.trafficFlow.hourlyPatterns.reduce((best, p) => (p.avgVolumeIn + p.avgVolumeOut) > (best.avgVolumeIn + best.avgVolumeOut) ? p : best, muc.trafficFlow.hourlyPatterns[0]);
  const avgSpeedAll = muc.trafficFlow.hourlyPatterns.length > 0 ? Math.round(muc.trafficFlow.hourlyPatterns.reduce((s, p) => s + p.avgSpeedKmh, 0) / muc.trafficFlow.hourlyPatterns.length) : 0;
  const peakGate = muc.gateFlow.gates.reduce((best, g) => {
    const vol = muc.gateFlow.buckets.filter((b) => b.gateId === g.id).reduce((s, b) => s + b.countIn + b.countOut, 0);
    const bestVol = muc.gateFlow.buckets.filter((b) => b.gateId === best.id).reduce((s, b) => s + b.countIn + b.countOut, 0);
    return vol > bestVol ? g : best;
  }, muc.gateFlow.gates[0]);
  const liveCamCount = publicCctvCameras.filter((c) => c.status === "live").length;
  const matchCount = muc.gateFlow.matches.length;
  const nowHourBuckets = muc.gateFlow.buckets.filter((b) => new Date(b.periodStart).getUTCHours() === new Date().getUTCHours());
  const vehiclesThisHour = nowHourBuckets.reduce((s, b) => s + b.countIn + b.countOut, 0);
  const installedSensorCount = muc.airQuality.sensors.filter((s) => s.installed).length;
  const activePhase = muc.airQuality.constructionPhases.find((p) => p.status === "active");

  const todayEvents = arenaEvents.filter((e) => e.status === "confirmed").slice(0, 3);

  const cityDistricts = districts.filter((item) => item.citySlug === selectedCity.slug);
  const districtByKey = new Map(districts.map((item) => [`${item.citySlug}:${item.slug}`, item]));
  const selectedDistrict = cityDistricts.find((item) => item.slug === district) ?? null;
  const knownDistrictSlugs = new Set(cityDistricts.map((item) => item.slug));
  const selectedDomain = overview.domains.find((item) => item.slug === domain);
  const knownCitySlugs = new Set(overview.cities.map((item) => item.slug));
  const knownCitySlugsKey = overview.cities.map((item) => item.slug).join(",");
  const knownDistrictSlugsKey = cityDistricts.map((item) => item.slug).join(",");
  const normalizedSearch = deferredSearchText.trim().toLowerCase();
  const suggestedModelCityId =
    selectedCity.slug === "phuket"
      ? "vancouver"
      : selectedCity.slug === "nonthaburi"
        ? "osaka"
        : selectedCity.slug === "khon-kaen"
          ? "osaka"
          : selectedCity.slug === "chiang-mai"
            ? "vienna"
            : "copenhagen";
  const selectedModelCity =
    globalReferenceCities.find((item) => item.id === modelCityParam) ??
    globalReferenceCities.find((item) => item.id === suggestedModelCityId) ??
    globalReferenceCities[0];
  const eoTileConfigs = useMemo(() => getEoTileConfigs(), []);
  const uiText = {
    screenshotManual: lang === "th" ? "คู่มือภาพหน้าจอ" : "Screenshot Manual",
    explainView: lang === "th" ? "อธิบายมุมมอง" : "Explain View",
    commandBar: lang === "th" ? "National Command Bar" : "National Command Bar",
    layerStudio: lang === "th" ? "Layer Studio" : "Layer Studio",
    comparePanel: lang === "th" ? "Map compare" : "Map compare",
    compareWindow: lang === "th" ? "เทียบช่วงก่อนหน้า" : "Compare previous window",
    compareWindowOff: lang === "th" ? "โหมด snapshot" : "Snapshot mode",
    cityProvinceCompare: lang === "th" ? "City / Province Compare" : "City / Province Compare",
    comparePick: lang === "th" ? "เลือก 2-4 เมืองเพื่อเทียบกัน" : "Pick 2-4 cities to compare",
    groundTruth: lang === "th" ? "Ground Truth Links" : "Ground Truth Links",
    drawerProjects: lang === "th" ? "โครงการที่เกี่ยวข้อง" : "Relevant projects",
    drawerNews: lang === "th" ? "ข่าวล่าสุด" : "Latest news",
    drawerSources: lang === "th" ? "แหล่งข้อมูลสนับสนุน" : "Supporting sources",
    drawerSatellite: lang === "th" ? "บริบทดาวเทียม" : "Satellite context",
    drawerOpen: lang === "th" ? "เปิดที่มาภายนอก" : "Open external reference",
    opacity: lang === "th" ? "ความทึบ" : "Opacity",
    blend: lang === "th" ? "โหมดผสม" : "Blend mode",
    order: lang === "th" ? "ลำดับชั้น" : "Layer order",
    moveUp: lang === "th" ? "ขึ้น" : "Up",
    moveDown: lang === "th" ? "ลง" : "Down",
    active: lang === "th" ? "เปิดอยู่" : "Active",
    inactive: lang === "th" ? "ปิดอยู่" : "Inactive",
    shot: lang === "th" ? "ช็อตที่ควรเก็บ" : "Recommended shot",
    applyScene: lang === "th" ? "จัดฉากนี้" : "Apply scene",
    focusMap: lang === "th" ? "โฟกัสบนแผนที่" : "Focus map",
    openDrawer: lang === "th" ? "เปิดคำอธิบาย" : "Open explanation",
    confidence: lang === "th" ? "ความเชื่อมั่น" : "Confidence",
    sourceFreshness: lang === "th" ? "ความสดของแหล่งข้อมูล" : "Source freshness",
    liveWindow: lang === "th" ? "ช่วงเวลาที่กำลังดู" : "Viewing window",
    compareMode: lang === "th" ? "โหมดเปรียบเทียบ" : "Compare mode"
  };
  const slicThailandFallback = useMemo<SlicThailandSnapshot>(() => {
    const fallbackCities = [...overview.cities]
      .map((item) => ({
        id: item.slug,
        rank: 0,
        nameEn: item.name.en,
        nameTh: item.name.th,
        region: item.region.en,
        provinceType: "tracked",
        overall: Math.round(item.scores.reduce((sum, score) => sum + score.score, 0) / Math.max(item.scores.length, 1)),
        avgMonthlyIncome: 0,
        pm25Annual: 0,
        greenCoverage: 0,
        tagline: item.focus.en,
        highlights: [item.focus.en],
        status: "manual"
      }))
      .sort((left, right) => right.overall - left.overall)
      .slice(0, 8)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return {
      updatedAt: new Date().toISOString(),
      source: {
        name: "SLIC Thailand",
        url: "https://slic-index.onrender.com/thailand",
        freshnessStatus: "manual"
      },
      topCities: fallbackCities
    };
  }, [overview.cities]);
  const slicThailandQuery = useQuery({
    queryKey: ["slic-thailand"],
    queryFn: () => fetchFromApi<SlicThailandSnapshot>("/api/external/slic-thailand", slicThailandFallback, isSlicThailandPayload),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });
  const slicThailand =
    slicThailandQuery.data &&
    Array.isArray(slicThailandQuery.data.topCities) &&
    slicThailandQuery.data.topCities.length > 0 &&
    slicThailandQuery.data.source &&
    typeof slicThailandQuery.data.updatedAt === "string"
      ? slicThailandQuery.data
      : slicThailandFallback;
  const operationalLayerOptions = operationalLayerToggleIds
    .map((id) => layerSeed.find((layer) => layer.id === id))
    .filter((item): item is (typeof layerSeed)[number] => Boolean(item));

  const filteredProjects = normalizedSearch
    ? projects.filter((project) => {
      return (
        project.title.en.toLowerCase().includes(normalizedSearch) ||
        project.title.th.includes(deferredSearchText) ||
        project.summary.en.toLowerCase().includes(normalizedSearch) ||
        project.summary.th.includes(deferredSearchText)
      );
    })
    : projects;

  const filteredDecisions = normalizedSearch
    ? decisions.filter((item) => {
      return (
        item.title.en.toLowerCase().includes(normalizedSearch) ||
        item.title.th.includes(deferredSearchText) ||
        item.summary.en.toLowerCase().includes(normalizedSearch) ||
        item.summary.th.includes(deferredSearchText) ||
        item.recommendedAction.en.toLowerCase().includes(normalizedSearch) ||
        item.recommendedAction.th.includes(deferredSearchText)
      );
    })
    : decisions;

  const filteredNews = normalizedSearch
    ? news.filter((item) => {
      return (
        item.title.en.toLowerCase().includes(normalizedSearch) ||
        item.title.th.includes(deferredSearchText) ||
        item.excerpt.en.toLowerCase().includes(normalizedSearch) ||
        item.excerpt.th.includes(deferredSearchText)
      );
    })
    : news;

  const sortedFilteredNews = [...filteredNews].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );
  const officialNews = sortedFilteredNews.filter((item) => item.kind === "official").slice(0, 2);
  const externalNews = sortedFilteredNews.filter((item) => item.kind === "external").slice(0, 3);
  const globalSignalNews = globalNews.slice(0, 4);
  const compactProjects = filteredProjects.slice(0, 3);
  const visibleTrends = trendWatchItems.slice(0, 3);
  const compactMedia = mediaFeeds.slice(0, 3);
  const activityItems = activity.slice(0, 6);
  const timeZones = time.zones.slice(0, 3);
  const decisionItems = filteredDecisions.slice(0, 5);
  const topCityScores = [...selectedCity.scores]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((score) => ({
      ...score,
      domain: overview.domains.find((item) => item.slug === score.domainSlug)
    }));
  const trackedPopulation = overview.cities.reduce((sum, item) => sum + item.population, 0);
  const nationalTopDomains = useMemo(() => {
    return overview.domains
      .map((domainItem) => {
        const scores = overview.cities.map(
          (cityItem) => cityItem.scores.find((score) => score.domainSlug === domainItem.slug)?.score ?? 0
        );
        const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1));

        return {
          domainSlug: domainItem.slug,
          domain: domainItem,
          score: average
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [overview.cities, overview.domains]);
  const selectedModelStrengths = new Set(selectedModelCity.strengths);
  const fitDomains = topCityScores.flatMap((item) =>
    item.domain && selectedModelStrengths.has(item.domain.slug) ? [item.domain] : []
  );
  const liveNewsSource =
    sources.find((source) => source.category === "news" && source.freshnessStatus === "live") ??
    sources.find((source) => source.category === "news") ??
    null;
  const globalWatchSources = sources.filter((source) =>
    ["gdelt-signals", "google-news-rss", "nasa-eonet", "youtube-signals", "undp-data"].includes(source.id)
  );
  const activeSatelliteLayers = satelliteToggleOptions.filter((item) => layers.includes(item.id));
  const satelliteLiveSources = sources.filter((source) => ["nasa-gibs", "jaxa-earth"].includes(source.id));
  const satelliteReadySources = sources.filter((source) =>
    SATELLITE_CREDENTIAL_SOURCE_IDS.includes(source.id as (typeof SATELLITE_CREDENTIAL_SOURCE_IDS)[number])
  );
  const satellitePreviewCards = satelliteDigest.previews.slice(0, 3);
  const satelliteMetrics = satelliteDigest.metrics.slice(0, 3);
  const satelliteRecentScenes = satelliteDigest.scenes.slice(0, 4);
  const satelliteStatusLabel = satelliteDigest.status.available
    ? copy.satelliteOauthLive
    : satelliteDigest.status.mode === "degraded"
      ? copy.satelliteDegraded
      : copy.satelliteCredentialsStatus;
  const undpDataSource = sources.find((source) => source.id === "undp-data") ?? null;
  const pollutionCollection = mapFeatures.find((collection) => collection.layerId === "pollution");
  const weatherCollection = mapFeatures.find((collection) => collection.layerId === "weather");
  const trafficCollection = mapFeatures.find((collection) => collection.layerId === "itic-traffic");
  const topAqiFeature =
    pollutionCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      return !best || numericProperty(feature, "aqi") > numericProperty(best, "aqi") ? feature : best;
    }, null) ?? null;
  const hottestWeatherFeature =
    weatherCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      return !best || numericProperty(feature, "temperatureC") > numericProperty(best, "temperatureC") ? feature : best;
    }, null) ?? null;
  const wettestWeatherFeature =
    weatherCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      const precipitationScore =
        numericProperty(feature, "precipitationMm") * 100 + numericProperty(feature, "precipitationProbability");
      const bestScore = best
        ? numericProperty(best, "precipitationMm") * 100 + numericProperty(best, "precipitationProbability")
        : -1;

      return !best || precipitationScore > bestScore ? feature : best;
    }, null) ?? null;
  const weatherLeadFeature =
    wettestWeatherFeature &&
    (numericProperty(wettestWeatherFeature, "precipitationMm") > 0 ||
      numericProperty(wettestWeatherFeature, "precipitationProbability") >= 40 ||
      numericProperty(wettestWeatherFeature, "windKph") >= 18)
      ? wettestWeatherFeature
      : hottestWeatherFeature;
  const topTrafficFeature =
    trafficCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      const priority = numericProperty(feature, "priorityScore");
      const bestPriority = best ? numericProperty(best, "priorityScore") : -1;

      if (!best || priority > bestPriority) {
        return feature;
      }

      if (priority === bestPriority) {
        const featureTime = timeValue(stringProperty(feature, "startedAt") || feature.source.publishedAt);
        const bestTime = timeValue(stringProperty(best, "startedAt") || best.source.publishedAt);
        return featureTime > bestTime ? feature : best;
      }

      return best;
    }, null) ?? null;
  const trafficWatchItems = [...(trafficCollection?.features ?? [])]
    .sort((left, right) => {
      const priorityDelta = numericProperty(right, "priorityScore") - numericProperty(left, "priorityScore");
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return (
        timeValue(stringProperty(right, "startedAt") || right.source.publishedAt) -
        timeValue(stringProperty(left, "startedAt") || left.source.publishedAt)
      );
    })
    .slice(0, 4);
  const latestExternalSignal = sortedFilteredNews.find((item) => item.kind === "external") ?? null;
  const latestExternalSignalCity = latestExternalSignal?.citySlug ? cityBySlug.get(latestExternalSignal.citySlug) ?? null : null;
  const nationalCoverageCollection = mapFeatures.find((collection) => collection.layerId === "smart-city-thailand");
  const coverageFeatureCount = nationalCoverageCollection?.features.length ?? 0;
  const coverageCountsByDomain = useMemo(() => {
    const entries: Array<[string, number]> = overview.domains.map((item) => [
      item.slug,
      nationalCoverageCollection?.features.filter((feature) => matchesCoverageDomain(feature, item.slug)).length ?? 0
    ]);

    return new Map<string, number>(entries);
  }, [nationalCoverageCollection, overview.domains]);
  const mapFeaturesForView = useMemo(() => {
    if (view === "national") {
      return mapFeatures;
    }

      return mapFeatures
      .map((collection) => {
        if (collection.layerId === "bangkok-passages") {
          if (city !== "bangkok") {
            return { ...collection, features: [] };
          }

          const features = selectedDistrict
            ? collection.features.filter((feature) => featureMatchesDistrict(feature, selectedDistrict.slug))
            : collection.features;
          return { ...collection, features };
        }

        const features = collection.features.filter((feature) => {
          if (!featureMatchesCity(feature, city)) {
            return false;
          }

          if (selectedDistrict && !featureMatchesDistrict(feature, selectedDistrict.slug)) {
            return false;
          }

          return true;
        });
        return { ...collection, features };
      })
      .filter((collection) => collection.features.length > 0);
  }, [city, mapFeatures, selectedDistrict, view]);
  const nextNewsCheckAt = (() => {
    if (!liveNewsSource) {
      return "";
    }

    const lastCheckMs = new Date(liveNewsSource.lastCheckedAt).getTime();
    if (Number.isNaN(lastCheckMs)) {
      return "";
    }

    return new Date(lastCheckMs + 300000).toISOString();
  })();
  const latestSyncSource =
    [...sources].sort(
      (left, right) => new Date(right.lastCheckedAt).getTime() - new Date(left.lastCheckedAt).getTime()
    )[0] ?? null;
  const nextGlobalSyncAt = latestSyncSource
    ? new Date(new Date(latestSyncSource.lastCheckedAt).getTime() + LIVE_POLL_INTERVAL_MS).toISOString()
    : "";
  const executiveSignal = (() => {
    // MUC: Gridlock alerts take top priority
    const gridlockBn = muc.trafficFlow.bottlenecks.find((b) => b.severity === "gridlock");
    if (gridlockBn) {
      return lang === "th"
        ? `GRIDLOCK: ${localize(lang, gridlockBn.label)} — ${localize(lang, gridlockBn.suggestion)}`
        : `GRIDLOCK: ${localize(lang, gridlockBn.label)} — ${localize(lang, gridlockBn.suggestion)}`;
    }

    // MUC: AQI zone rising above threshold
    const risingAqiZone = muc.airQuality.zones.find((z) => z.isAboveThreshold && z.trend === "up");
    if (risingAqiZone) {
      return lang === "th"
        ? `AQI เตือน: ${localize(lang, risingAqiZone.label)} เกินเกณฑ์ ${risingAqiZone.threshold} (ปัจจุบัน ${risingAqiZone.currentAqi})`
        : `AQI ALERT: ${localize(lang, risingAqiZone.label)} above ${risingAqiZone.threshold} (now ${risingAqiZone.currentAqi})`;
    }

    // MUC: Bottleneck alerts
    const worstBn = muc.trafficFlow.bottlenecks.find((b) => b.severity === "bottleneck");
    if (worstBn) {
      return lang === "th"
        ? `คอขวด: ${localize(lang, worstBn.label)} — ${localize(lang, worstBn.suggestion)}`
        : `Bottleneck: ${localize(lang, worstBn.label)} — ${localize(lang, worstBn.suggestion)}`;
    }

    // Flood risk warning
    if (floodRisk.floodRiskLevel === "high" || floodRisk.floodRiskLevel === "critical") {
      return lang === "th"
        ? `เตือนน้ำท่วม: ระดับความเสี่ยง ${floodRisk.floodRiskLevel} — ฝนคาด ${floodRisk.precipitationForecast24h} มม./24ชม.`
        : `FLOOD WARNING: Risk level ${floodRisk.floodRiskLevel} — ${floodRisk.precipitationForecast24h}mm rain forecast 24h`;
    }

    // Heavy rain warning
    if (floodRisk.precipitationForecast24h > 30) {
      return lang === "th"
        ? `เตือนฝนหนัก: คาดฝน ${floodRisk.precipitationForecast24h} มม. ใน 24 ชม. — เฝ้าระวังน้ำท่วม`
        : `RAIN WARNING: ${floodRisk.precipitationForecast24h}mm expected in 24h — flood watch`;
    }

    const leadDecision = filteredDecisions[0];
    if (leadDecision) {
      return localize(lang, leadDecision.title);
    }

    if (!isMuangThongCityView && topAqiFeature && numericProperty(topAqiFeature, "aqi") >= 70) {
      return lang === "th"
        ? `ความเสี่ยงด้านอากาศเพิ่มขึ้นใน${topAqiFeature.title}`
        : `Air risk rising in ${topAqiFeature.title}`;
    }

    return localize(lang, overview.briefing.headline);
  })();
  const topAqiCitySlug = normalizeCitySlug(String(topAqiFeature?.properties.city ?? topAqiFeature?.title ?? ""));
  const hottestCitySlug = normalizeCitySlug(
    String(hottestWeatherFeature?.properties.city ?? hottestWeatherFeature?.title ?? "")
  );
  const weatherLeadSummary = weatherLeadFeature
    ? (() => {
        const rain = numericProperty(weatherLeadFeature, "precipitationMm");
        const rainChance = numericProperty(weatherLeadFeature, "precipitationProbability");
        const wind = numericProperty(weatherLeadFeature, "windKph");
        const temperature = numericProperty(weatherLeadFeature, "temperatureC");
        const humidity = numericProperty(weatherLeadFeature, "humidity");

        if (rain > 0 || rainChance >= 40 || wind >= 18) {
          return lang === "th"
            ? `ลม ${wind} กม./ชม. · ฝน ${rain.toFixed(1)} มม. · โอกาสฝน ${rainChance}%`
            : `wind ${wind} km/h · rain ${rain.toFixed(1)} mm · chance ${rainChance}%`;
        }

        return lang === "th" ? `${temperature}°C · ความชื้น ${humidity}%` : `${temperature}°C · ${humidity}% humidity`;
      })()
    : "";
  const topTrafficCitySlug = normalizeCitySlug(
    String(topTrafficFeature?.properties.citySlug ?? topTrafficFeature?.properties.city ?? "")
  );
  const topTrafficSummary = topTrafficFeature
    ? [formatSignalLabel(stringProperty(topTrafficFeature, "eventClass")), formatSignalLabel(stringProperty(topTrafficFeature, "status"))]
        .filter(Boolean)
        .join(" · ")
    : "";
  const layerLegendDetails: Record<string, string> = {
    pollution: copy.clickToFocus,
    weather: copy.weatherLegend,
    projects: copy.projectLegend,
    news: copy.newsLegend,
    resilience: copy.resilienceLegend,
    "itic-traffic":
      lang === "th"
        ? "สีแดง = อุบัติเหตุ การปิดถนน และเหตุจราจรสด"
        : "Red = live accidents, road closures, and traffic incidents",
    economy: copy.economyLegend,
    agriculture: copy.agricultureLegend,
    water: copy.waterLegend,
    "land-use": copy.landUseLegend,
    "eo-aerosol": copy.aerosolLegend,
    "eo-precipitation": copy.precipitationLegend,
    "eo-vegetation": copy.vegetationLegend,
    disaster: copy.disasterLegend,
    "jaxa-rainfall": copy.jaxaLegend,
    "satellite-imagery": lang === "th" ? "ภาพสีจริงจาก NASA GIBS" : "NASA GIBS true-color imagery",
    "satellite-cloudless":
      lang === "th"
        ? "โมเสก Sentinel-2 แบบไร้เมฆจาก EOX สำหรับมุมมองภาพจริงความละเอียดสูง"
        : "EOX Sentinel-2 cloudless mosaic for a high-resolution visual baseline",
    "satellite-surface-water":
      lang === "th"
        ? "ชั้นข้อมูลน้ำผิวดินจาก JRC สำหรับ floodplain และพื้นที่ชุ่มน้ำ"
        : "JRC Global Surface Water occurrence for floodplain and wetland context",
    "satellite-bathymetry":
      lang === "th"
        ? "ความลึกทะเลและภูมิประเทศชายฝั่งจาก EMODnet Bathymetry"
        : "EMODnet bathymetry and coastal terrain context",
    "satellite-vegetation": lang === "th" ? "ค่าพืชพรรณ NDVI จาก NASA GIBS" : "NASA GIBS NDVI vegetation index",
    "satellite-aerosol": lang === "th" ? "ดัชนีละอองลอยจาก NASA GIBS" : "NASA GIBS aerosol index",
    "satellite-surface-temp":
      lang === "th"
        ? "อุณหภูมิพื้นผิวดินจาก MODIS Aqua สำหรับความร้อนเมืองและความแห้ง"
        : "MODIS Aqua land-surface temperature for urban heat and dry stress",
    "satellite-thermal":
      lang === "th"
        ? "แถบอินฟราเรดความร้อนจาก MODIS Terra สำหรับอ่านลายเซ็นความร้อน"
        : "MODIS Terra thermal infrared band for heat signatures",
    "satellite-water-vapor":
      lang === "th"
        ? "ไอน้ำในชั้นบรรยากาศจาก NASA GIBS สำหรับแนวชื้นและมรสุม"
        : "NASA GIBS atmospheric water vapor for moisture and monsoon context",
    "satellite-sea-surface-temp":
      lang === "th"
        ? "อุณหภูมิผิวน้ำทะเลจาก NASA GIBS สำหรับชายฝั่งและทะเล"
        : "NASA GIBS sea-surface temperature for coastal context",
    "satellite-night-lights": lang === "th" ? "แสงเมืองยามค่ำจาก NASA GIBS" : "NASA GIBS night-light intensity",
    "eo-soil-moisture": copy.soilMoistureLegend,
    "eo-fire-thermal": copy.fireThermalLegend,
    "eo-snow-cover": copy.snowCoverLegend,
    "eo-chlorophyll": copy.chlorophyllLegend,
    "eo-cloud-phase": copy.cloudPhaseLegend,
    "smart-city-thailand": copy.coverageLegend,
    "bangkok-passages": copy.bangkokPlacesLegend
  };
  const activeLegendItems = [
    ...layerSeed.map((item) => ({
      id: item.id,
      color: item.color,
      label: localize(lang, item.label)
    })),
    ...satelliteToggleOptions.map((item) => ({
      id: item.id,
      color: item.color,
      label: localize(lang, item.label)
    }))
  ]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .filter((item) => layers.includes(item.id))
    .map((item) => ({
      id: item.id,
      color: item.color,
      label: item.label,
      detail: layerLegendDetails[item.id] ?? copy.bangkokPlacesLegend
    }));
  const apiWatchSources = [
    ...coreApiSourceIds
      .map((id) => sources.find((source) => source.id === id))
      .filter((source): source is SourceRecord => Boolean(source)),
    {
      id: "nasa-gibs",
      name: "NASA GIBS",
      category: "geospatial" as const,
      url: "https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs",
      freshnessStatus: "live" as const,
      lastCheckedAt: new Date().toISOString(),
      message:
        lang === "th"
          ? "ภาพจริง พืชพรรณ ละอองลอย ความร้อน ไอน้ำ ทะเล และแสงกลางคืนพร้อมใช้งาน"
          : "True color, vegetation, aerosol, heat, water-vapor, sea-surface, and night-light layers are online."
    },
    {
      id: "slic-thailand",
      name: "SLIC Thailand",
      category: "catalog" as const,
      url: slicThailand.source.url,
      freshnessStatus: slicThailand.source.freshnessStatus,
      lastCheckedAt: slicThailand.updatedAt,
      message:
        lang === "th"
          ? "อันดับเมืองไทยสดจากหน้า SLIC Thailand"
          : "Live Thailand city rankings from the SLIC Thailand page."
    }
  ];
  const apiReadyCount = apiWatchSources.filter(
    (source) => source.freshnessStatus !== "delayed" && source.freshnessStatus !== "stale"
  ).length;
  const apiStatusLabel =
    apiReadyCount === apiWatchSources.length ? "HIGH" : apiReadyCount >= apiWatchSources.length - 1 ? "WATCH" : "LOW";
  const slicTopCities = slicThailand.topCities.slice(0, 5);
  const warningHaystack = resilience.warnings.map((item) => `${item.en} ${item.th}`.toLowerCase()).join(" ");
  const hottestTemperature = hottestWeatherFeature ? numericProperty(hottestWeatherFeature, "temperatureC") : 0;
  const hottestHumidity = hottestWeatherFeature ? numericProperty(hottestWeatherFeature, "humidity") : 0;
  const floodTrigger = /flood|rain|low-lying|storm|น้ำท่วม|ฝน|ระบายน้ำ/.test(warningHaystack);
  const waterTrigger =
    /water|canal|drain|coastal|น้ำ|คลอง|ชลประทาน/.test(warningHaystack) ||
    layers.includes("resilience") ||
    layers.includes("bangkok-passages") ||
    layers.includes("water");
  const landTrigger =
    view === "national" ||
    layers.includes("smart-city-thailand") ||
    layers.includes("land-use") ||
    layers.includes("agriculture");
  const droughtTrigger = hottestTemperature >= 34 || (hottestTemperature >= 32 && hottestHumidity <= 55);
  const satelliteNarrative =
    layers.includes("eo-aerosol") || (topAqiFeature && numericProperty(topAqiFeature, "aqi") >= 70)
      ? lang === "th"
        ? "หมอกควันและฝุ่นเป็นสัญญาณดาวเทียมที่เด่นที่สุดตอนนี้ ควรดู aerosol คู่กับ AQI และ weather"
        : "Haze is the strongest satellite signal right now. Pair aerosol with AQI and weather."
      : layers.includes("eo-precipitation") || layers.includes("jaxa-rainfall") || floodTrigger
        ? lang === "th"
          ? "บริบทมรสุมและฝนทั่วประเทศกำลังเหมาะกับการใช้ precipitation และ JAXA rain ร่วมกัน"
          : "National monsoon context is strong right now. Combine precipitation with JAXA rain."
        : layers.includes("eo-vegetation")
          ? lang === "th"
            ? "NDVI กำลังช่วยอ่านพื้นที่สีเขียว การใช้ที่ดิน และแนวเขตเกษตรในภาพรวม"
            : "NDVI is currently the best lens for green cover, land use, and agriculture."
          : copy.satelliteSignalReady;
  const eoWatchItems = [
    {
      id: "drought",
      title: lang === "th" ? "ภัยแล้ง / ความร้อน" : "Drought / heat",
      detail: droughtTrigger
        ? lang === "th"
          ? "ความร้อนสูงขึ้น ควรเปิดภาพรวมฝุ่น พืชพรรณ และพื้นที่แห้ง"
          : "Heat is elevated. Jump to aerosol, vegetation, and dry-zone context."
        : lang === "th"
          ? "ใช้ดูแนวโน้มพื้นที่แห้งและผลกระทบอากาศ"
          : "Use for dry-zone and climate-stress context.",
      tone: droughtTrigger ? "jump" : "context",
      targetLayers: ["weather", "resilience", "eo-aerosol", "eo-vegetation"]
    },
    {
      id: "flood",
      title: lang === "th" ? "น้ำท่วม / น้ำหลาก" : "Flood / runoff",
      detail: floodTrigger
        ? lang === "th"
          ? "มีสัญญาณฝนหรือน้ำท่วม ควรดูภาพรวมเชิงพื้นที่เพิ่ม"
          : "Flood or rainfall warnings are active. EO context is useful now."
        : lang === "th"
          ? "ใช้ดูพื้นที่ลุ่มต่ำและฝนสะสม"
          : "Use for basin, rainfall, and flood-plain context.",
      tone: floodTrigger ? "jump" : "watch",
      targetLayers: ["eo-precipitation", "jaxa-rainfall", "water", "resilience"]
    },
    {
      id: "water",
      title: lang === "th" ? "น้ำ / ลุ่มน้ำ" : "Water / basins",
      detail: waterTrigger
        ? lang === "th"
          ? "กำลังดูชั้นข้อมูลน้ำ ควรเทียบกับภาพรวมดาวเทียม"
          : "Water-sensitive layers are active. Pair them with EO context."
        : lang === "th"
          ? "ใช้ติดตามคลอง อ่างเก็บน้ำ และพื้นที่น้ำสัมพันธ์"
          : "Use for canals, reservoirs, and water-linked land patterns.",
      tone: waterTrigger ? "watch" : "context",
      targetLayers: ["water", "eo-vegetation", "eo-precipitation", "jaxa-rainfall"]
    },
    {
      id: "land",
      title: lang === "th" ? "การใช้ที่ดิน" : "Land-change",
      detail: landTrigger
        ? lang === "th"
          ? "โหมดประเทศเหมาะกับการเทียบ footprint เมืองกับการใช้พื้นที่"
          : "National mode is ideal for comparing city footprint with land use."
        : lang === "th"
          ? "ใช้ดูการขยายตัวเมืองและรูปแบบพื้นที่"
          : "Use for urban expansion and land-use pattern context.",
      tone: landTrigger ? "watch" : "context",
      targetLayers: ["land-use", "agriculture", "smart-city-thailand", "eo-vegetation"]
    }
  ];
  const focusPresets = [
    {
      id: "air-risk",
      label: copy.focusAirRisk,
      layers: ["pollution", "weather", "eo-aerosol", "resilience"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["pollution", "weather", "eo-aerosol", "resilience"].join(","));
        next.set("basemap", "satellite");
        next.delete("district");
        next.delete("domain");
        if (topAqiCitySlug && knownCitySlugs.has(topAqiCitySlug)) {
          next.set("city", topAqiCitySlug);
          next.set("view", "city");
        } else {
          next.set("view", "national");
        }
        startTransition(() => {
          setSearchParams(next);
          setRecenterSignal((value) => value + 1);
        });
      }
    },
    {
      id: "monsoon-watch",
      label: copy.focusMonsoonWatch,
      layers: ["eo-precipitation", "jaxa-rainfall", "water", "resilience"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["eo-precipitation", "jaxa-rainfall", "water", "resilience"].join(","));
        next.set("basemap", "satellite");
        next.set("view", "national");
        next.delete("district");
        next.delete("domain");
        startTransition(() => {
          setSearchParams(next);
          setRecenterSignal((value) => value + 1);
        });
      }
    },
    {
      id: "candidate-cities",
      label: copy.focusCandidates,
      layers: ["smart-city-thailand", "projects", "economy"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["smart-city-thailand", "projects", "economy"].join(","));
        next.set("view", "national");
        startTransition(() => {
          setSearchParams(next);
          setRecenterSignal((value) => value + 1);
        });
      }
    },
    {
      id: "media-watch",
      label: copy.focusMediaWatch,
      layers: ["smart-city-thailand", "news"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["smart-city-thailand", "news"].join(","));
        if (latestExternalSignal?.citySlug && knownCitySlugs.has(latestExternalSignal.citySlug)) {
          next.set("city", latestExternalSignal.citySlug);
          next.set("view", "city");
        } else {
          next.set("view", "national");
        }
        startTransition(() => {
          setSearchParams(next);
          setRecenterSignal((value) => value + 1);
        });
      }
    },
    {
      id: "economic-context",
      label: copy.focusEconomyContext,
      layers: ["smart-city-thailand", "economy", "weather"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["smart-city-thailand", "economy", "weather"].join(","));
        next.set("view", "national");
        startTransition(() => {
          setSearchParams(next);
          setRecenterSignal((value) => value + 1);
        });
      }
    }
  ];
  const activeFocusPresetId =
    focusPresets.find((preset) => preset.layers.length === layers.length && preset.layers.every((layerId) => layers.includes(layerId)))?.id ??
    null;
  const airRiskPreset = focusPresets.find((preset) => preset.id === "air-risk");
  const monsoonPreset = focusPresets.find((preset) => preset.id === "monsoon-watch");
  const candidatePreset = focusPresets.find((preset) => preset.id === "candidate-cities");
  const mediaPreset = focusPresets.find((preset) => preset.id === "media-watch");
  const economyPreset = focusPresets.find((preset) => preset.id === "economic-context");
  const footerQuickActions = [
    {
      id: "air-risk",
      label: lang === "th" ? "อากาศ" : "Air",
      active: activeFocusPresetId === "air-risk",
      onClick: airRiskPreset?.run
    },
    {
      id: "monsoon-watch",
      label: lang === "th" ? "ฝน" : "Rain",
      active: activeFocusPresetId === "monsoon-watch",
      onClick: monsoonPreset?.run
    },
    {
      id: "candidate-cities",
      label: lang === "th" ? "เมืองเด่น" : "Candidates",
      active: activeFocusPresetId === "candidate-cities",
      onClick: candidatePreset?.run
    },
    {
      id: "media-watch",
      label: lang === "th" ? "สื่อ" : "Media",
      active: activeFocusPresetId === "media-watch",
      onClick: mediaPreset?.run
    },
    {
      id: "economic-context",
      label: lang === "th" ? "เศรษฐกิจ" : "Economy",
      active: activeFocusPresetId === "economic-context",
      onClick: economyPreset?.run
    },
    {
      id: "basemap",
      label: basemap === "satellite" ? copy.mapAtlas : copy.mapSatellite,
      active: false,
      onClick: () => updateParam("basemap", basemap === "satellite" ? "atlas" : "satellite")
    },
    {
      id: "recenter",
      label: lang === "th" ? "จัดกึ่งกลาง" : "Recenter",
      active: false,
      onClick: () => setRecenterSignal((value) => value + 1)
    }
  ];
  const satellitePresets = SATELLITE_PRESETS.map((preset) => ({
    ...preset,
    active: preset.layers.length === layers.length && preset.layers.every((layerId) => layers.includes(layerId))
  }));
  const timeRangeIndex = TIME_RANGE_OPTIONS.indexOf(timeRange);
  const compareCitySlugs = [selectedCity.slug, ...compareSelection.filter((item) => item !== selectedCity.slug)].slice(0, 4);
  const compareProfiles = compareCitySlugs
    .map((slug) => overview.cities.find((item) => item.slug === slug))
    .filter((item): item is (typeof overview.cities)[number] => Boolean(item));
  const orderedOverlayItems = [...satelliteToggleOptions].sort(
    (left, right) => overlayStudioSettings[left.id].order - overlayStudioSettings[right.id].order
  );
  const groundTruthLinks = [
    ...(groundTruthDirectory[selectedCity.slug] ?? []),
    ...groundTruthDirectory.national
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
  const mapCompareCards = [
    {
      id: "street",
      title: { th: "ถนน", en: "Street" },
      detail: { th: "ฐาน OpenStreetMap สำหรับอ่านตำแหน่งและชื่อพื้นที่", en: "OpenStreetMap base for labels, roads, and civic context." },
      active: basemap === "atlas",
      previewUrl: "https://tile.openstreetmap.org/6/52/31.png",
      action: () => updateParam("basemap", "atlas")
    },
    {
      id: "aerial",
      title: { th: "ภาพถ่ายทางอากาศ", en: "Aerial" },
      detail: { th: "ฐานภาพถ่ายสำหรับดูโครงสร้างภูมิประเทศและพื้นที่เมือง", en: "Aerial imagery base for terrain, coastline, and built-form context." },
      active: basemap === "satellite",
      previewUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/31/52",
      action: () => updateParam("basemap", "satellite")
    },
    {
      id: "satellite-imagery",
      title: { th: "ภาพจริง", en: "True Color" },
      detail: { th: "ภาพจริงจาก NASA GIBS", en: "NASA GIBS true-color imagery." },
      active: layers.includes("satellite-imagery"),
      previewUrl:
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/6/31/52.jpg",
      action: () => toggleSatelliteLayer("satellite-imagery")
    },
    {
      id: "satellite-cloudless",
      title: { th: "คลาวด์เลส", en: "Cloudless" },
      detail: { th: "ฐานภาพ Sentinel-2 แบบไร้เมฆ", en: "Sentinel-2 cloudless high-resolution base." },
      active: layers.includes("satellite-cloudless"),
      previewUrl: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/6/31/52.jpg",
      action: () => toggleSatelliteLayer("satellite-cloudless")
    },
    {
      id: "satellite-surface-water",
      title: { th: "น้ำผิวดิน", en: "Surface Water" },
      detail: { th: "ดูแนวพื้นที่ชุ่มน้ำและ floodplain", en: "Wetland and floodplain occurrence context." },
      active: layers.includes("satellite-surface-water"),
      previewUrl: "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/6/52/31.png",
      action: () => toggleSatelliteLayer("satellite-surface-water")
    },
    {
      id: "satellite-bathymetry",
      title: { th: "ความลึกทะเล", en: "Bathymetry" },
      detail: { th: "ภูมิประเทศชายฝั่งและความลึกทะเล", en: "Coastal depth and seabed terrain context." },
      active: layers.includes("satellite-bathymetry"),
      previewUrl: "https://tiles.emodnet-bathymetry.eu/v12/mean_atlas_land_latest/web_mercator/6/52/31.png",
      action: () => toggleSatelliteLayer("satellite-bathymetry")
    },
    {
      id: "eo-vegetation",
      title: { th: "พืชพรรณ", en: "Vegetation" },
      detail: { th: "NDVI สำหรับพื้นที่สีเขียว", en: "NDVI context for green cover." },
      active: layers.includes("eo-vegetation"),
      previewUrl: eoTileConfigs["eo-vegetation"].url.replace("{z}", "6").replace("{y}", "31").replace("{x}", "52"),
      action: () => toggleSatelliteLayer("eo-vegetation")
    },
    {
      id: "eo-aerosol",
      title: { th: "ละอองลอย", en: "Aerosol" },
      detail: { th: "บริบทหมอกควันและฝุ่น", en: "Aerosol context for haze and dust." },
      active: layers.includes("eo-aerosol"),
      previewUrl: eoTileConfigs["eo-aerosol"].url.replace("{z}", "6").replace("{y}", "31").replace("{x}", "52"),
      action: () => toggleSatelliteLayer("eo-aerosol")
    },
    {
      id: "eo-precipitation",
      title: { th: "มรสุม", en: "Monsoon" },
      detail: { th: "การกระจายฝนระดับประเทศ", en: "Nationwide precipitation distribution." },
      active: layers.includes("eo-precipitation"),
      previewUrl: eoTileConfigs["eo-precipitation"].url.replace("{z}", "6").replace("{y}", "31").replace("{x}", "52"),
      action: () => toggleSatelliteLayer("eo-precipitation")
    },
    {
      id: "jaxa-rainfall",
      title: { th: "ฝน", en: "Rain" },
      detail: { th: "ภาพฝนและเรดาร์สำรองสำหรับฤดูมรสุม", en: "Rain and radar fallback for monsoon operations." },
      active: layers.includes("jaxa-rainfall"),
      previewUrl: buildApiUrl("/api/satellite/preview/flood-radar"),
      action: () => toggleSatelliteLayer("jaxa-rainfall")
    },
    {
      id: "satellite-night-lights",
      title: { th: "แสงกลางคืน", en: "Night Lights" },
      detail: { th: "ดูความหนาแน่นเมืองยามค่ำคืน", en: "Night-light intensity for urban density context." },
      active: layers.includes("satellite-night-lights"),
      previewUrl:
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/all/VIIRS_Black_Marble/default/default/GoogleMapsCompatible_Level8/6/31/52.png",
      action: () => toggleSatelliteLayer("satellite-night-lights")
    }
  ];
  const commandAlerts = [
    topAqiFeature
      ? {
          id: "air",
          location: topAqiFeature.title,
          title:
            lang === "th"
              ? `AQI ${numericProperty(topAqiFeature, "aqi")} กำลังนำสัญญาณ`
              : `AQI ${numericProperty(topAqiFeature, "aqi")} is leading the watchlist`,
          reason:
            lang === "th"
              ? "Aerosol, AQI และ weather ควรถูกอ่านคู่กันทันที"
              : "Aerosol, AQI, and weather should be read together now.",
          layers: ["pollution", "weather", "eo-aerosol"],
          citySlug: topAqiCitySlug || selectedCity.slug,
          basemap: "satellite" as const,
          confidence: topAqiFeature.source.confidence,
          freshness: topAqiFeature.source.freshnessStatus
        }
      : null,
    {
      id: "monsoon",
      location: lang === "th" ? "ประเทศไทย" : "Thailand",
      title: lang === "th" ? "บริบทฝนและมรสุมกำลังเด่น" : "Monsoon context is elevated",
      reason:
        floodTrigger
          ? lang === "th"
            ? "คำเตือน resilience ชี้ว่าควรเปิดชั้นฝนและน้ำทันที"
            : "Resilience warnings suggest switching to precipitation and water context."
          : lang === "th"
            ? "ใช้เป็นมุมมองมาตรฐานเพื่อตรวจ pattern ฝนสะสม"
            : "Use as the baseline view for rainfall accumulation patterns.",
      layers: ["eo-precipitation", "jaxa-rainfall", "water", "resilience"],
      citySlug: selectedCity.slug,
      basemap: "satellite" as const,
      confidence: floodTrigger ? 0.81 : 0.68,
      freshness: satelliteLiveSources[0]?.freshnessStatus ?? "live"
    },
    hottestWeatherFeature
      ? {
          id: "heat",
          location: hottestWeatherFeature.title,
          title:
            lang === "th"
              ? `${numericProperty(hottestWeatherFeature, "temperatureC")}C คือจุดร้อนสุด`
              : `${numericProperty(hottestWeatherFeature, "temperatureC")}C is the hottest current reading`,
          reason:
            lang === "th"
              ? "ใช้ weather คู่กับ vegetation เพื่ออ่าน heat stress"
              : "Pair weather with vegetation to read heat stress.",
          layers: ["weather", "eo-vegetation", "resilience"],
          citySlug: hottestCitySlug || selectedCity.slug,
          basemap: "atlas" as const,
          confidence: hottestWeatherFeature.source.confidence,
          freshness: hottestWeatherFeature.source.freshnessStatus
        }
      : null,
    latestExternalSignal
      ? {
          id: "media",
          location: latestExternalSignalCity ? localize(lang, latestExternalSignalCity.name) : (lang === "th" ? "สื่อภายนอก" : "External media"),
          title: lang === "th" ? "สื่อและข่าวภายนอกมีน้ำหนัก" : "Media attention is materially shaping the view",
          reason:
            lang === "th"
              ? "ใช้ news, projects และ world watch ประกอบการอธิบาย"
              : "Use news, projects, and world-watch signals as supporting context.",
          layers: ["news", "projects", "smart-city-thailand"],
          citySlug: latestExternalSignal.citySlug ?? selectedCity.slug,
          basemap: "atlas" as const,
          confidence: latestExternalSignal.source.confidence,
          freshness: latestExternalSignal.source.freshnessStatus
        }
      : null,
    {
      id: "green",
      location: lang === "th" ? "แนวพื้นที่สีเขียว" : "Green cover",
      title: lang === "th" ? "NDVI พร้อมสำหรับ land-change story" : "NDVI is ready for the land-change story",
      reason:
        lang === "th"
          ? "ใช้ vegetation, land use และ agriculture ร่วมกันในภาพเดียว"
          : "Use vegetation, land use, and agriculture together in one frame.",
      layers: ["eo-vegetation", "land-use", "agriculture"],
      citySlug: selectedCity.slug,
      basemap: "atlas" as const,
      confidence: 0.73,
      freshness: "live" as const
    }
  ].filter(Boolean) as Array<{
    id: string;
    location: string;
    title: string;
    reason: string;
    layers: string[];
    citySlug: string;
    basemap: "atlas" | "satellite" | "street" | "hybrid";
    confidence: number;
    freshness: string;
  }>;
  const primaryScopeLabel = view === "national" ? (lang === "th" ? "ประเทศไทย" : "Thailand") : localize(lang, selectedCity.name);
  const primaryScopeDetail =
    view === "national"
      ? selectedDomain
        ? localize(lang, selectedDomain.description)
        : lang === "th"
          ? `${overview.cities.length} เมืองที่ติดตาม • ${coverageFeatureCount} จุดครอบคลุม`
          : `${overview.cities.length} tracked cities • ${coverageFeatureCount} coverage footprints`
      : selectedDistrict
        ? localize(lang, selectedDistrict.priority)
        : localize(lang, selectedCity.focus);
  const scopePopulationLabel = view === "national" ? (lang === "th" ? "ประชากรเมืองที่ติดตาม" : "Tracked population") : copy.population;
  const scopePopulationValue = view === "national" ? formatPopulation(trackedPopulation) : formatPopulation(selectedCity.population);
  const scopeDomainScores = view === "national" ? nationalTopDomains : topCityScores;
  const overviewWarnings = resilience.warnings.slice(0, 3);
  const overviewQueue = decisionItems.slice(0, 3);
  const overviewOfficialNews = officialNews.slice(0, 2);
  const overviewExternalNews = externalNews.slice(0, 2);
  const overviewProjects = compactProjects.slice(0, 3);
  const overviewSources = apiWatchSources.slice(0, 4);
  const compareRows = [
    {
      id: "population",
      label: lang === "th" ? "Population" : "Population",
      getValue: (profile: (typeof compareProfiles)[number]) => formatPopulation(profile.population)
    },
    {
      id: "score",
      label: lang === "th" ? "Avg score" : "Avg score",
      getValue: (profile: (typeof compareProfiles)[number]) =>
        `${Math.round(profile.scores.reduce((sum, score) => sum + score.score, 0) / Math.max(profile.scores.length, 1))}`
    },
    {
      id: "projects",
      label: lang === "th" ? "Projects" : "Projects",
      getValue: (profile: (typeof compareProfiles)[number]) =>
        `${projects.filter((project) => project.citySlug === profile.slug).length}`
    },
    {
      id: "news",
      label: lang === "th" ? "News" : "News",
      getValue: (profile: (typeof compareProfiles)[number]) =>
        `${news.filter((item) => item.citySlug === profile.slug).length}`
    },
    {
      id: "domain",
      label: lang === "th" ? "Leading domain" : "Leading domain",
      getValue: (profile: (typeof compareProfiles)[number]) => {
        const topScore = [...profile.scores].sort((left, right) => right.score - left.score)[0];
        const topDomain = overview.domains.find((item) => item.slug === topScore?.domainSlug);
        return topDomain ? localize(lang, topDomain.title) : "--";
      }
    },
    {
      id: "watch",
      label: lang === "th" ? "Watch" : "Watch",
      getValue: (profile: (typeof compareProfiles)[number]) => {
        if (profile.slug === topAqiCitySlug) {
          return lang === "th" ? "AQI hotspot" : "AQI hotspot";
        }
        if (profile.slug === hottestCitySlug) {
          return lang === "th" ? "Heat watch" : "Heat watch";
        }
        return lang === "th" ? "Tracked" : "Tracked";
      }
    }
  ];
  const workspaceTitle = PUBLIC_DASHBOARD_BRAND.title;
  const workspaceNarrative =
    localize(lang, commandCenter.screenMode);
  const reporterStatusMeta = {
    received: {
      label: lang === "th" ? "Received" : "Received",
      tone: "watch",
      detail: lang === "th" ? "รอทีมรับเรื่อง" : "Waiting for ownership"
    },
    assigned: {
      label: lang === "th" ? "Assigned" : "Assigned",
      tone: "pilot",
      detail: lang === "th" ? "มีเจ้าของแล้ว" : "Owner assigned"
    },
    in_progress: {
      label: lang === "th" ? "In progress" : "In Progress",
      tone: "live",
      detail: lang === "th" ? "กำลังลงพื้นที่" : "Fieldwork underway"
    },
    completed: {
      label: lang === "th" ? "Completed" : "Completed",
      tone: "stable",
      detail: lang === "th" ? "ปิดงานแล้ว" : "Closed loop"
    }
  } as const;
  const cctvSamples = commandCenter.cameraEvents.map((item) => ({
    ...item,
    capturedAt: new Date(Date.now() - item.minutesAgo * 60000).toISOString()
  }));
  const reporterSamples = commandCenter.reporterCases.map((item) => ({
    ...item,
    createdAt: new Date(Date.now() - item.minutesAgo * 60000).toISOString()
  }));
  const sensorFeeds = commandCenter.sensorFeeds;
  const openReporterCount = reporterSamples.filter((item) => item.status !== "completed").length;
  const escalatedCctvCount = cctvSamples.filter((item) => item.severity === "alert").length;
  const integrationBoards = commandCenter.workflowBoards.map((item) => ({
    ...item,
    title: localize(lang, item.title),
    detail: localize(lang, item.detail)
  }));
  const mergeQueue = commandCenter.fusionQueue.map((item) => ({
    ...item,
    title: localize(lang, item.title),
    detail: localize(lang, item.detail)
  }));
  const commandConnectors = commandCenter.connectors;
  const connectorReadyCount = commandConnectors.filter((item) => item.status === "live" || item.status === "ready").length;
  const expansionTracks = commandCenter.expansionTracks;
  const layerRailSections = [
    {
      id: "base",
      title: lang === "th" ? "Map views" : "Map Views",
      note: lang === "th" ? "ถนน ภาพถ่าย และฐานภาพที่เปิดใช้ได้ทันที" : "Roads, aerial, and base imagery you can switch immediately.",
      items: [
        {
          id: "base-roads",
          label: lang === "th" ? "Roads" : "Roads",
          detail: lang === "th" ? "OpenStreetMap labels และโครงข่ายถนน" : "OpenStreetMap labels and road network.",
          source: "Built in",
          state: basemap === "atlas" ? "active" : "live",
          color: "#6b7280",
          onClick: () => updateParam("basemap", "atlas")
        },
        {
          id: "base-aerial",
          label: lang === "th" ? "Aerial" : "Aerial",
          detail: lang === "th" ? "ภาพถ่ายทางอากาศสำหรับบริบทพื้นที่จริง" : "Aerial imagery for built-form and terrain context.",
          source: "ArcGIS",
          state: basemap === "satellite" ? "active" : "live",
          color: "#94a3b8",
          onClick: () => updateParam("basemap", "satellite")
        },
        {
          id: "base-true-color",
          label: lang === "th" ? "True Color" : "True Color",
          detail: lang === "th" ? "ภาพจริงจาก NASA GIBS" : "NASA GIBS true-color imagery.",
          source: "Smart City Monitor",
          state: layers.includes("satellite-imagery") ? "active" : "live",
          color: "#cbd5e1",
          onClick: () => toggleSatelliteLayer("satellite-imagery")
        },
        {
          id: "base-night-lights",
          label: lang === "th" ? "Night Lights" : "Night Lights",
          detail: lang === "th" ? "ความหนาแน่นแสงกลางคืน" : "Night-light density for urban activity.",
          source: "Smart City Monitor",
          state: layers.includes("satellite-night-lights") ? "active" : "live",
          color: "#8b5cf6",
          onClick: () => toggleSatelliteLayer("satellite-night-lights")
        }
      ]
    },
    {
      id: "operations",
      title: lang === "th" ? "Live operations layers" : "Live Operations Layers",
      note: lang === "th" ? "ชั้นข้อมูลหลักที่ผู้ใช้เปิดดูได้ตอนนี้" : "Core layers already wired into this monitor.",
      items: operationalLayerOptions.map((item) => ({
        id: item.id,
        label: localize(lang, item.label),
        detail: item.kind === "signal" ? (lang === "th" ? "สัญญาณปฏิบัติการสด" : "Live operational signal.") : (lang === "th" ? "ข้อมูลอ้างอิงบนแผนที่" : "Reference layer on the map."),
        source: "Smart City Monitor",
        state: layers.includes(item.id) ? "active" : "live",
        color: item.color,
        onClick: () => toggleLayer(item.id)
      }))
    },
    {
      id: "earth-observation",
      title: lang === "th" ? "Earth observation" : "Earth Observation",
      note: lang === "th" ? "พืชพรรณ ฝน ละอองลอย และบริบทดาวเทียม" : "Vegetation, rainfall, aerosol, and satellite context.",
      items: satelliteToggleOptions.map((item) => ({
        id: item.id,
        label: localize(lang, item.label),
        detail: localize(lang, item.detail),
        source: "Smart City Monitor",
        state: layers.includes(item.id) ? "active" : "live",
        color: item.color,
        onClick: () => toggleSatelliteLayer(item.id)
      }))
    },
    {
      id: "imported",
      title: lang === "th" ? "Imported from other projects" : "Imported From Other Projects",
      note:
        lang === "th"
          ? "layer vocab ที่หยิบมาจาก Phuket Dashboard เพื่อให้ right rail เป็น shared catalog"
          : "Overlay vocabulary brought in from the Phuket Dashboard so this right rail becomes a shared catalog.",
      items: importedLayerReferences.map((item) => ({
        id: item.id,
        label: localize(lang, item.label),
        detail: localize(lang, item.detail),
        source: `${item.sourceProject} • ${item.sourceLabel}`,
        state: item.status,
        color: item.color
      }))
    }
  ] as const;
  const catalogedLayerCount = layerRailSections.reduce((total, section) => total + section.items.length, 0);
  const drawerCity = overview.cities.find((item) => item.slug === opsDrawerState?.citySlug) ?? selectedCity;
  const drawerProjects = projects.filter((project) => project.citySlug === drawerCity.slug).slice(0, 3);
  const drawerNews = news
    .filter((item) => item.citySlug === drawerCity.slug || (!item.citySlug && item.kind === "external"))
    .slice(0, 3);
  const drawerSourceIds = new Set(
    (opsDrawerState?.layers ?? layers)
      .map((layerId) => {
        const seededLayer = layerSeed.find((item) => item.id === layerId);
        if (seededLayer?.sourceId) {
          return seededLayer.sourceId;
        }
        if (layerId === "satellite-imagery" || layerId === "satellite-night-lights") {
          return "nasa-gibs";
        }
        if (layerId === "jaxa-rainfall") {
          return "jaxa-earth";
        }
        return null;
      })
      .filter((value): value is string => Boolean(value))
  );
  const drawerSources = sources.filter((source) => drawerSourceIds.has(source.id)).slice(0, 4);
  const drawerGroundTruthLinks = [
    ...(groundTruthDirectory[drawerCity.slug] ?? []),
    ...groundTruthDirectory.national
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
  const drawerSatelliteLayers = satelliteToggleOptions.filter((item) => (opsDrawerState?.layers ?? layers).includes(item.id));

  const exportSnippets = useMemo(() => createDashboardScaffoldSnippets(), []);
  const activeExportSnippet = exportSnippets[exportLanguage];
  const activeExportLabel =
    exportLanguage === "json" ? "JSON" : exportLanguage === "typescript" ? "TypeScript" : "Python";
  const exportOptions = [
    {
      id: "json" as const,
      label: "JSON",
      mark: "{ }",
      detail: lang === "th" ? "สคีมา / ข้อมูล" : "Schema / data"
    },
    {
      id: "typescript" as const,
      label: "TypeScript",
      mark: "TS",
      detail: lang === "th" ? "โครงร่างแบบมีชนิด" : "Typed scaffold"
    },
    {
      id: "python" as const,
      label: "Python",
      mark: "Py",
      detail: lang === "th" ? "ฝั่งหลังบ้าน / สคริปต์" : "Backend / scripting"
    }
  ];
  const thisCycleItems = changes.items.slice(0, 3);
  const assistantContext = useMemo<AssistantQueryRequest["context"]>(
    () => ({
      view,
      citySlug: selectedCity.slug,
      cityName: selectedCity.name.en,
      districtSlug: selectedDistrict?.slug,
      districtName: selectedDistrict?.name.en,
      domainSlug: selectedDomain?.slug,
      domainLabel: selectedDomain?.title.en,
      activeLayers: layers,
      executiveSignal,
      watchpoints: [topAqiFeature?.title, hottestWeatherFeature?.title].filter(Boolean) as string[]
    }),
    [view, selectedCity, selectedDistrict, selectedDomain, layers, executiveSignal, topAqiFeature, hottestWeatherFeature]
  );
  const assistantContextTags = [
    view,
    localize(lang, selectedCity.name),
    selectedDistrict ? localize(lang, selectedDistrict.name) : "",
    selectedDomain ? localize(lang, selectedDomain.title) : "",
    ...layers.slice(0, 3)
  ].filter(Boolean) as string[];
  const localizedCityName = localize(lang, selectedCity.name);
  const resolvedQuestionClusters = assistantQuestionClusters.map((cluster) => ({
    ...cluster,
    title: localize(lang, cluster.title),
    sourceNote: localize(lang, cluster.sourceNote),
    prompts: cluster.prompts.map((prompt) =>
      fillPromptTemplate(localize(lang, prompt), {
        city: localizedCityName
      })
    )
  }));

  useEffect(() => {
    if (view === "national" || knownCitySlugs.size === 0 || knownCitySlugs.has(city) || selectedCity.slug === city) {
      return;
    }

    const next = buildStableParams();
    next.set("city", selectedCity.slug);

    startTransition(() => {
      setSearchParams(next, { replace: true });
    });
  }, [city, knownCitySlugsKey, selectedCity.slug, setSearchParams, view]);

  useEffect(() => {
    if (!district) {
      return;
    }

    if (view === "national" || knownDistrictSlugs.has(district)) {
      return;
    }

    const next = buildStableParams();
    next.delete("district");

    startTransition(() => {
      setSearchParams(next, { replace: true });
    });
  }, [cityDistricts.length, district, knownDistrictSlugs, knownDistrictSlugsKey, setSearchParams, view]);

  function buildStableParams() {
    const next = new URLSearchParams();
    next.set("lang", lang);
    next.set("view", view);
    next.set("timeRange", timeRange);
    next.set("city", city);
    next.set("basemap", basemap);
    if (district) {
      next.set("district", district);
    }
    if (domain) {
      next.set("domain", domain);
    }
    next.set("layers", layers.join(","));
    if (modelCityParam) {
      next.set("modelCity", modelCityParam);
    }
    return next;
  }

  function applyLayerPreset(nextLayers: string[], nextView: DashboardView = "national") {
    const next = buildStableParams();
    next.set("layers", nextLayers.join(","));
    next.set("view", nextView);
    if (nextView === "national") {
      next.delete("domain");
    }

    startTransition(() => {
      setSearchParams(next);
      setRecenterSignal((value) => value + 1);
    });
  }

  function applyDashboardScene(scene: {
    view?: DashboardView;
    city?: string;
    domain?: string;
    basemap?: "atlas" | "satellite" | "street" | "hybrid";
    timeRange?: TimeRange;
    layers?: string[];
  }) {
    const next = buildStableParams();

    if (scene.view) {
      next.set("view", scene.view);
      if (scene.view === "national" && scene.domain === undefined) {
        next.delete("domain");
      }
    }

    if (scene.city) {
      next.set("city", scene.city);
    }

    if (scene.domain !== undefined) {
      if (scene.domain) {
        next.set("domain", scene.domain);
      } else {
        next.delete("domain");
      }
    }

    if (scene.basemap) {
      next.set("basemap", scene.basemap);
    }

    if (scene.timeRange) {
      next.set("timeRange", scene.timeRange);
    }

    if (scene.layers) {
      next.set("layers", scene.layers.join(","));
    }

    startTransition(() => {
      setSearchParams(next);
      setRecenterSignal((value) => value + 1);
    });
  }

  const stableParamsString = buildStableParams().toString();

  useEffect(() => {
    if (searchParams.toString() === stableParamsString) {
      return;
    }

    startTransition(() => {
      setSearchParams(buildStableParams(), { replace: true });
    });
  }, [searchParams, stableParamsString, setSearchParams]);

  useEffect(() => {
    setCompareSelection((current) => {
      const next = [selectedCity.slug, ...current.filter((item) => item !== selectedCity.slug)];
      const normalized = next.slice(0, 4);
      return normalized.join(",") === current.join(",") ? current : normalized;
    });
  }, [selectedCity.slug]);

  function updateParam(key: string, value: string) {
    const next = buildStableParams();
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    if (key === "city") {
      next.delete("district");
      next.set("view", "city");
    }

    if (key === "view" && value === "national") {
      next.delete("district");
    }

    startTransition(() => {
      setSearchParams(next);
    });
  }

  function selectCity(citySlug: string) {
    const next = buildStableParams();
    next.set("city", citySlug);
    next.set("view", "city");
    next.delete("district");

    startTransition(() => {
      setSearchParams(next);
      setActiveTab("map");
      setRecenterSignal((value) => value + 1);
    });
  }

  function toggleLayer(id: string) {
    const next = buildStableParams();
    const nextLayers = new Set(layers);
    const enabling = !nextLayers.has(id);
    if (nextLayers.has(id)) {
      nextLayers.delete(id);
    } else {
      nextLayers.add(id);
    }

    next.set("layers", Array.from(nextLayers).join(","));
    if (id === "smart-city-thailand" && enabling) {
      next.set("view", "national");
    }

    startTransition(() => {
      setSearchParams(next);
    });
  }

  function focusCityWithLayer(citySlug: string, layerId: string) {
    const next = buildStableParams();
    const nextLayers = new Set(layers);
    nextLayers.add(layerId);
    next.set("layers", Array.from(nextLayers).join(","));
    next.delete("district");
    if (knownCitySlugs.has(citySlug)) {
      next.set("city", citySlug);
      next.set("view", "city");
    } else {
      next.set("view", "national");
    }

    startTransition(() => {
      setSearchParams(next);
      setRecenterSignal((value) => value + 1);
    });
  }

  function focusDecision(item: DecisionQueueItem) {
    const next = buildStableParams();
    const nextLayers = new Set(layers);

    item.layerIds.forEach((layerId) => nextLayers.add(layerId));

    next.set("layers", Array.from(nextLayers).join(","));
    next.set("city", item.citySlug);
    next.set("view", "city");
    next.set("domain", item.domainSlug);

    if (item.districtSlug) {
      next.set("district", item.districtSlug);
    } else {
      next.delete("district");
    }

    startTransition(() => {
      setSearchParams(next);
      setRecenterSignal((value) => value + 1);
    });
  }

  function toggleEoOverlay() {
    const next = buildStableParams();
    const nextLayers = new Set(layers);

    if (nextLayers.has("jaxa-rainfall")) {
      nextLayers.delete("jaxa-rainfall");
    } else {
      nextLayers.add("jaxa-rainfall");
      next.set("view", "national");
    }

    next.set("layers", Array.from(nextLayers).join(","));

    startTransition(() => {
      setSearchParams(next);
      setRecenterSignal((value) => value + 1);
    });
  }

  function toggleSatelliteLayer(id: string) {
    if (id === "jaxa-rainfall") {
      toggleEoOverlay();
      return;
    }

    toggleLayer(id);
  }

  function openOpsDrawer(state: OpsDrawerState) {
    setManualOpen(false);
    setOpsDrawerState(state);
  }

  function openCityOpsDrawer(citySlug: string, reason: string, layerIds: string[]) {
    const targetCity = overview.cities.find((item) => item.slug === citySlug) ?? selectedCity;
    openOpsDrawer({
      title: localize(lang, targetCity.name),
      subtitle: localize(lang, targetCity.region),
      citySlug: targetCity.slug,
      reason,
      layers: layerIds,
      sourceLabel: latestSyncSource?.name ?? "Ops",
      confidence: 0.78
    });
  }

  function toggleCompareCity(slug: string) {
    if (slug === selectedCity.slug) {
      return;
    }

    setCompareSelection((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }

      return [...current, slug].slice(-4);
    });
  }

  function updateOverlaySetting(id: string, patch: Partial<OverlayStudioSetting>) {
    setOverlayStudioSettings((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch
      }
    }));
  }

  function moveOverlayItem(id: string, direction: -1 | 1) {
    setOverlayStudioSettings((current) => {
      const orderedIds = Object.entries(current)
        .sort((left, right) => left[1].order - right[1].order)
        .map(([layerId]) => layerId);
      const currentIndex = orderedIds.indexOf(id);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedIds.length) {
        return current;
      }

      const nextIds = [...orderedIds];
      const [target] = nextIds.splice(currentIndex, 1);
      nextIds.splice(nextIndex, 0, target);

      return Object.fromEntries(
        Object.entries(current).map(([layerId, setting]) => [
          layerId,
          {
            ...setting,
            order: nextIds.indexOf(layerId)
          }
        ])
      ) as Record<string, OverlayStudioSetting>;
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1200);
  }

  async function copySkeleton() {
    await navigator.clipboard.writeText(activeExportSnippet);
    setCopiedSkeleton(true);
    window.setTimeout(() => setCopiedSkeleton(false), 1400);
  }

  async function askAssistant() {
    if (!assistantQuestion.trim()) {
      return;
    }

    const question = assistantQuestion.trim();
    setAssistantLoading(true);
    setAssistantError("");
    setAssistantQuestion("");

    try {
      const payload: AssistantQueryRequest = {
        question,
        locale: lang,
        context: assistantContext
      };
      const response = await postToApi<AssistantResponse>("/api/assistant/query", payload);

      setAssistantResponse(response);

      setTimeout(() => {
        const answer = document.querySelector(".assistant-answer");
        if (answer) {
          answer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : "Assistant unavailable");
      setAssistantQuestion(question);
    } finally {
      setAssistantLoading(false);
    }
  }

  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    try { return (localStorage.getItem("mtt-theme") as "light" | "dark") || "dark"; } catch { return "dark"; }
  });
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => {
    try { return localStorage.getItem("mtt-audio-muted") === "true"; } catch { return false; }
  });

  const siteTheme = themeMode === "dark" ? "ops-dark" : "ops";

  // Persist theme
  useEffect(() => { try { localStorage.setItem("mtt-theme", themeMode); } catch {} }, [themeMode]);
  useEffect(() => { try { localStorage.setItem("mtt-audio-muted", String(audioMuted)); } catch {} }, [audioMuted]);

  // Escape key for fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && mapFullscreen) setMapFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mapFullscreen]);

  // Audio alert system (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playAlertTone = useCallback((level: "info" | "warning" | "critical") => {
    if (audioMuted) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const freqs = level === "critical" ? [440, 520, 660] : level === "warning" ? [520, 520] : [440];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.value = 0.08;
        const start = ctx.currentTime + i * 0.18;
        osc.start(start); osc.stop(start + 0.12);
      });
    } catch {}
  }, [audioMuted]);

  return (
    <div className={`shell ${mapFullscreen ? "dashboard-layout map-fullscreen" : ""}`} data-theme={siteTheme}>
      {/* Fullscreen exit button */}
      {mapFullscreen ? <button type="button" className="fullscreen-exit-btn" onClick={() => setMapFullscreen(false)}>{lang === "th" ? "ออกเต็มจอ" : "Exit Fullscreen"} (Esc)</button> : null}

      {/* Shift Handover Modal */}
      {shiftModalOpen ? (
        <div className="shift-modal-overlay" onClick={() => setShiftModalOpen(false)}>
          <div className="shift-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{lang === "th" ? "รายงานกะ — สรุป 8 ชั่วโมง" : "Shift Report — 8 Hour Summary"}</h2>
            <div className="shift-section">
              <h3>{lang === "th" ? "เหตุการณ์" : "Incidents"}</h3>
              <div className="shift-metric"><span>{lang === "th" ? "เปิดใหม่" : "Opened"}</span><strong>{incidents.filter((i) => i.status === "new").length}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "แก้ไขแล้ว" : "Resolved"}</span><strong>{incidents.filter((i) => i.status === "resolved").length}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "ยังดำเนินการ" : "Still Active"}</span><strong>{incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length}</strong></div>
            </div>
            <div className="shift-section">
              <h3>{lang === "th" ? "จราจร" : "Traffic"}</h3>
              <div className="shift-metric"><span>{lang === "th" ? "รถวันนี้" : "Vehicles Today"}</span><strong>{totalVehiclesToday.toLocaleString()}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "คอขวด" : "Bottlenecks"}</span><strong>{mucBottleneckCount}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "ชั่วโมงพีค" : "Peak Hour"}</span><strong>{peakHourData ? `${String(peakHourData.hour).padStart(2, "0")}:00` : "--"}</strong></div>
            </div>
            <div className="shift-section">
              <h3>{lang === "th" ? "คุณภาพอากาศ" : "Air Quality"}</h3>
              <div className="shift-metric"><span>AQI</span><strong>{muc.airQuality.overallAqi}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "เขตเกินเกณฑ์" : "Zones Above Threshold"}</span><strong>{mucAqiAlertCount}</strong></div>
            </div>
            <div className="shift-section">
              <h3>{lang === "th" ? "กิจกรรม IMPACT" : "IMPACT Events"}</h3>
              <div className="shift-metric"><span>{lang === "th" ? "จำนวนงาน" : "Events"}</span><strong>{arenaEvents.filter((e) => e.status === "confirmed").length}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "คนคาด" : "Expected Crowd"}</span><strong>{arenaEvents.filter((e) => e.status === "confirmed").reduce((s, e) => s + e.expectedCrowd, 0).toLocaleString()}</strong></div>
            </div>
            <div className="shift-section">
              <h3>{lang === "th" ? "น้ำท่วม" : "Flood Risk"}</h3>
              <div className="shift-metric"><span>{lang === "th" ? "ระดับความเสี่ยง" : "Risk Level"}</span><strong>{floodRisk.floodRiskLevel}</strong></div>
              <div className="shift-metric"><span>{lang === "th" ? "ฝนคาด 24 ชม." : "Rain 24h"}</span><strong>{floodRisk.precipitationForecast24h}mm</strong></div>
            </div>
            <div className="shift-actions">
              <button type="button" className="primary" onClick={() => { navigator.clipboard?.writeText(`Shift Report — ${time.thaiDate || new Date().toLocaleDateString()}\nIncidents: ${incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length} active\nVehicles: ${totalVehiclesToday}\nAQI: ${muc.airQuality.overallAqi}\nFlood: ${floodRisk.floodRiskLevel}`); }}>{lang === "th" ? "คัดลอก" : "Copy"}</button>
              <button type="button" onClick={() => window.print()}>{lang === "th" ? "พิมพ์" : "Print"}</button>
              <button type="button" onClick={() => setShiftModalOpen(false)}>{lang === "th" ? "ปิด" : "Close"}</button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="topbar">
        <div className="brand-cluster">
          <img src="/smart-city-thailand-logo.svg" alt="Smart City Thailand" className="brand-logo" />
          <div className="brand-copy">
            <h1>{workspaceTitle}</h1>
            <small className="brand-subline">{primaryScopeDetail}</small>
          </div>
          <span className="version-badge">v{APP_VERSION}</span>
        </div>
        <div className="top-controls">
          {isMuangThongCityView ? null : (
          <div className="compact-group scope-toggle">
            <button
              className={view === "national" ? "chip active" : "chip"}
              onClick={() =>
                applyDashboardScene({
                  view: "national",
                  layers: Array.from(new Set([...layers, "smart-city-thailand"]))
                })
              }
            >
              {lang === "th" ? "ประเทศ" : "Thailand"}
            </button>
            <button className={view === "city" ? "chip active" : "chip"} onClick={() => applyDashboardScene({ view: "city", city })}>
              {lang === "th" ? "เมือง" : "City"}
            </button>
          </div>
          )}
          <span className="chip active" style={{ cursor: "default" }}>{primaryScopeLabel}</span>
          <div className="compact-group">
            <button className={lang === "en" ? "chip active" : "chip"} onClick={() => updateParam("lang", "en")}>EN</button>
            <button className={lang === "th" ? "chip active" : "chip"} onClick={() => updateParam("lang", "th")}>TH</button>
          </div>
          <button type="button" className="audio-toggle" onClick={() => setAudioMuted((m) => !m)} title={audioMuted ? "Unmute alerts" : "Mute alerts"}>{audioMuted ? "🔇" : "🔊"}</button>
          <button type="button" className="chip" onClick={() => setThemeMode((t) => t === "dark" ? "light" : "dark")} title="Toggle dark/light">{themeMode === "dark" ? "☀️" : "🌙"}</button>
          <button type="button" className="chip" onClick={() => setShiftModalOpen(true)} title="Shift Report">{lang === "th" ? "กะ" : "Shift"}</button>
          <button className="share-button" onClick={copyLink}>{copiedLink ? copy.copied : copy.share}</button>
        </div>
      </header>

      {/* Sidebar and assistant drawer removed — content moved to floating panels and tabs */}

      {/* Manual and ops panels removed — content consolidated into tabs */}

      <div className="dashboard-stage">
        <div className="map-zone">
        {/* AI Status Line - floating at top of map */}
        <button type="button" className="ai-status-line" onClick={() => setActiveTab("insights")}>
          <span className="ai-dot" />
          <span>{executiveSignal}</span>
        </button>

        {/* The Map (always mounted) */}
        <InteractiveMap
          locale={lang}
          view={view}
          citySlug={city}
          district={selectedDistrict ?? undefined}
          domainSlug={domain || undefined}
          basemap={basemap}
          layers={layers}
          overlayStyles={overlayStudioSettings}
          projects={projects}
          news={news}
          featureCollections={mapFeaturesForView}
          publicCctvCameras={publicCctvCameras}
          recenterSignal={recenterSignal}
          themeMode={themeMode}
        />

        {/* Floating Layer Palette Toggle */}
        <button
          type="button"
          className="layer-palette-toggle"
          onClick={() => setLayerPaletteOpen((v) => !v)}
        >
          {lang === "th" ? `ตัวกรองแผนที่ (${layers.length})` : `Map Filters (${layers.length})`}
        </button>

        {/* Floating Layer Palette */}
        {layerPaletteOpen ? (
          <div className="layer-palette">
            <div className="palette-header">
              <strong>{lang === "th" ? "ชั้นข้อมูล" : "Layers"}</strong>
              <button type="button" className="chip" onClick={() => setLayerPaletteOpen(false)}>&times;</button>
            </div>
            <div className="palette-section">
              <span className="palette-title">{lang === "th" ? "แผนที่ฐาน" : "Base Map"}</span>
              <button type="button" className={basemap === "atlas" ? "palette-toggle active" : "palette-toggle"} onClick={() => updateParam("basemap", "atlas")}>
                <span className="palette-dot" style={{ background: "#22c55e" }} />
                <span>{lang === "th" ? "ถนน" : "Street"}</span>
                <span className="palette-state">{basemap === "atlas" ? "ON" : "OFF"}</span>
              </button>
              <button type="button" className={basemap === "satellite" ? "palette-toggle active" : "palette-toggle"} onClick={() => updateParam("basemap", "satellite")}>
                <span className="palette-dot" style={{ background: "#3b82f6" }} />
                <span>{lang === "th" ? "ภาพถ่ายทางอากาศ" : "Aerial"}</span>
                <span className="palette-state">{basemap === "satellite" ? "ON" : "OFF"}</span>
              </button>
            </div>
            <div className="palette-section">
              <span className="palette-title">{lang === "th" ? "ปฏิบัติการ" : "Operational"}</span>
              {operationalLayerOptions.map((layer) => {
                const active = layers.includes(layer.id);
                return (
                  <button key={layer.id} type="button" className={active ? "palette-toggle active" : "palette-toggle"} onClick={() => toggleLayer(layer.id)}>
                    <span className="palette-dot" style={{ background: layer.color }} />
                    <span>{localize(lang, layer.label)}</span>
                    <span className="palette-state">{active ? "ON" : "OFF"}</span>
                  </button>
                );
              })}
            </div>
            <div className="palette-section">
              <span className="palette-title">{lang === "th" ? "ดาวเทียม" : "Satellite Overlays"}</span>
              {satelliteToggleOptions.map((item) => {
                const active = layers.includes(item.id);
                return (
                  <button key={item.id} type="button" className={active ? "palette-toggle active" : "palette-toggle"} onClick={() => toggleSatelliteLayer(item.id)}>
                    <span className="palette-dot" style={{ background: item.color }} />
                    <span>{localize(lang, item.label)}</span>
                    <span className="palette-state">{active ? "ON" : "OFF"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Floating Map Controls */}
        <div className="map-floating-controls">
          <button type="button" className="map-expand-btn" onClick={() => setMapFullscreen((f) => !f)} title={mapFullscreen ? "Exit fullscreen" : "Expand map"}>{mapFullscreen ? "✕" : "⛶"}</button>
          <div className="basemap-switcher">
            {(["atlas", "street", "satellite", "hybrid"] as const).map((bm) => (
              <button key={bm} type="button" className={`basemap-btn ${basemap === bm ? "active" : ""}`} onClick={() => updateParam("basemap", bm)}>
                {bm === "atlas" ? "Atlas" : bm === "street" ? "Street" : bm === "satellite" ? "Sat" : "Hybrid"}
              </button>
            ))}
          </div>
          <button type="button" className="map-float-btn" onClick={() => setRecenterSignal((v) => v + 1)}>
            {copy.recenter}
          </button>
        </div>

        {/* Floating Alert Chips */}
        {activeTab === "map" ? (
          <div className="map-alerts-strip">
            {isMuangThongCityView ? (
              <>
                {mttTrafficSnapshotSeed.corridors.filter((c) => c.status === "congested" || c.status === "blocked").map((c) => (
                  <button key={c.id} type="button" className="map-alert-chip warning" onClick={() => toggleLayer("itic-traffic")}>
                    {`${localize(lang, c.label)} ${c.speedKmh} km/h`}
                  </button>
                ))}
                {arenaEvents.filter((e) => e.status === "confirmed").slice(0, 1).map((e) => (
                  <button key={e.id} type="button" className="map-alert-chip" onClick={() => setActiveTab("data")}>
                    {`${localize(lang, e.title)} ~${(e.expectedCrowd / 1000).toFixed(0)}k`}
                  </button>
                ))}
                {cctvSamples.filter((s) => s.severity === "alert").slice(0, 1).map((s) => (
                  <button key={s.id} type="button" className="map-alert-chip warning" onClick={() => setActiveTab("cctv")}>
                    {`${localize(lang, s.detection)} · ${localize(lang, s.zone)}`}
                  </button>
                ))}
                {socialListening.mentionCount > 0 ? (
                  <button type="button" className="map-alert-chip" onClick={() => setActiveTab("data")}>
                    {`${socialListening.mentionCount} mentions`}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                {topAqiFeature ? (
                  <button type="button" className="map-alert-chip warning" onClick={() => focusCityWithLayer(topAqiCitySlug || city, "pollution")}>
                    {`${lang === "th" ? "อากาศ" : "Air"}: AQI ${numericProperty(topAqiFeature, "aqi")} — ${topAqiFeature.title}`}
                  </button>
                ) : null}
                <button type="button" className="map-alert-chip" onClick={() => { monsoonPreset?.run?.(); }}>
                  {lang === "th" ? "เฝ้าระวังฝนและน้ำท่วม" : "Rain & Flood Watch"}
                </button>
                {hottestWeatherFeature ? (
                  <button type="button" className="map-alert-chip" onClick={() => focusCityWithLayer(hottestCitySlug || city, "weather")}>
                    {`${lang === "th" ? "ร้อน" : "Heat"}: ${numericProperty(hottestWeatherFeature, "temperatureC")}°C — ${hottestWeatherFeature.title}`}
                  </button>
                ) : null}
                {socialListening.mentionCount > 0 ? (
                  <button type="button" className="map-alert-chip" onClick={() => setActiveTab("data")}>
                    {`${socialListening.mentionCount} ${lang === "th" ? "คนพูดถึง" : "people talking"}`}
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {/* === TAB OVERLAY PANELS === */}

        {/* SATELLITE TAB */}
        {activeTab === "satellite" ? (
          <div className="tab-overlay satellite-gallery">
            {/* ── BASE MAP (single-select) ── */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "แผนที่ฐาน" : "Base Map"}</strong>
              <small>{lang === "th" ? "เลือกได้ 1 ชั้น" : "Select one"}</small>
            </div>
            <div className="sat-tile-grid">
              {mapCompareCards.filter((c) => c.id === "street" || c.id === "aerial").map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={card.active ? "sat-preview-tile active" : "sat-preview-tile"}
                  onClick={card.action}
                >
                  <img src={card.previewUrl} alt={localize(lang, card.title)} loading="lazy" />
                  <span className="sat-tile-label">
                    {localize(lang, card.title)}
                    <span className="sat-toggle-dot" />
                  </span>
                </button>
              ))}
            </div>

            {/* ── OVERLAY LAYERS (multi-select, stacked on top) ── */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "ชั้นข้อมูลซ้อนทับ" : "Overlay Layers"}</strong>
              <small>{activeSatelliteLayers.length > 0 ? `${activeSatelliteLayers.length} active` : lang === "th" ? "เลือกได้หลายชั้น" : "Select multiple"}</small>
            </div>
            <div className="satellite-metrics-strip">
              {satelliteMetrics.map((metric) => (
                <div key={metric.id} className="sat-metric">
                  <span className="eyebrow">{localize(lang, metric.title)}</span>
                  <strong>{metric.displayValue}</strong>
                </div>
              ))}
            </div>
            <div className="sat-tile-grid">
              {mapCompareCards.filter((c) => c.id !== "street" && c.id !== "aerial").map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={card.active ? "sat-preview-tile active" : "sat-preview-tile"}
                  onClick={card.action}
                >
                  <img src={card.previewUrl} alt={localize(lang, card.title)} loading="lazy" />
                  <span className="sat-tile-label">
                    {localize(lang, card.title)}
                    <span className="sat-toggle-dot" />
                  </span>
                </button>
              ))}
            </div>

            {/* ── EO PRESETS ── */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "ชุดเฝ้าระวัง" : "Watch Presets"}</strong>
            </div>
            <div className="sat-tile-grid">
              {eoWatchItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sat-preview-tile eo ${item.tone}`}
                  onClick={() => {
                    const next = buildStableParams();
                    next.set("layers", item.targetLayers.join(","));
                    if (item.targetLayers.includes("smart-city-thailand") || item.targetLayers.includes("jaxa-rainfall")) {
                      next.set("view", "national");
                    }
                    startTransition(() => {
                      setSearchParams(next);
                      setRecenterSignal((v) => v + 1);
                    });
                    setActiveTab("map");
                  }}
                >
                  <span className="sat-tile-label">{item.title}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
            {satelliteRecentScenes.length > 0 ? (
              <>
                <div className="sat-section-header">
                  <strong>{lang === "th" ? "ฉากล่าสุด" : "Recent Scenes"}</strong>
                  <span className="status-pill">{satelliteStatusLabel}</span>
                </div>
                <div className="sat-scene-list">
                  {satelliteRecentScenes.map((scene) => (
                    <a key={scene.id} className="sat-scene-item" href={scene.quicklookUrl ?? satelliteDigest.status.docsUrl} target="_blank" rel="noreferrer">
                      <strong>{scene.title}</strong>
                      <small>
                        {formatUtcDateTime(scene.timestamp)}
                        {scene.cloudCover !== undefined ? ` · Cloud ${Math.round(scene.cloudCover)}%` : ""}
                      </small>
                    </a>
                  ))}
                </div>
              </>
            ) : null}

            {/* — Satellite API Best Practices Guide — */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "คู่มือ API ดาวเทียม" : "Satellite API Guide"}</strong>
              <small>{lang === "th" ? "มาตรฐานปี 2026" : "2026 Best Practices"}</small>
            </div>

            <div className="sat-guide">
              <div className="guide-card">
                <strong>STAC + COG: The Foundation</strong>
                <p>STAC (SpatioTemporal Asset Catalog) is the universal standard for discovering satellite data. COG (Cloud Optimized GeoTIFF) enables reading only the pixels you need — no full downloads. Together, they turn petabytes into actionable queries.</p>
                <div className="guide-tags">
                  <span className="guide-tag">Search with bbox + datetime + cloud_cover</span>
                  <span className="guide-tag">Always paginate results</span>
                  <span className="guide-tag">Use POST for complex filters</span>
                </div>
              </div>

              <div className="guide-card">
                <strong>Provider Quick Reference</strong>
                <div className="guide-providers">
                  <a href="https://cmr.earthdata.nasa.gov/stac" target="_blank" rel="noreferrer" className="guide-provider">
                    <strong>NASA Earthdata</strong>
                    <small>CMR-STAC — Earthdata Login token. Nearly all data is cloud-hosted. Python-focused recipes.</small>
                  </a>
                  <a href="https://dataspace.copernicus.eu" target="_blank" rel="noreferrer" className="guide-provider">
                    <strong>Copernicus / Sentinel Hub</strong>
                    <small>OAuth credentials — Processing API with evalscript for on-demand NDVI, band math. Catalog API first, then process.</small>
                  </a>
                  <a href="https://planetarycomputer.microsoft.com/api/stac/v1" target="_blank" rel="noreferrer" className="guide-provider">
                    <strong>Microsoft Planetary Computer</strong>
                    <small>Easiest STAC access — use pystac_client with auto-signed tokens. Free Sentinel, Landsat, MODIS.</small>
                  </a>
                  <a href="https://earthengine.googleapis.com" target="_blank" rel="noreferrer" className="guide-provider">
                    <strong>Google Earth Engine</strong>
                    <small>Planetary-scale analysis — JS/Python API on analysis-ready catalogs. No storage management.</small>
                  </a>
                  <a href="https://www.planet.com/developers/" target="_blank" rel="noreferrer" className="guide-provider">
                    <strong>Planet</strong>
                    <small>Commercial high-resolution daily imagery. STAC-like API + notebooks. Check rate limits/credits.</small>
                  </a>
                </div>
              </div>

              <div className="guide-card">
                <strong>On-Demand Processing &gt; Downloads</strong>
                <p>Never download full archives. Use Sentinel Hub Processing API to specify AOI, time range, cloud cover, and evalscript for band math — returns PNG/JPEG/GeoTIFF in seconds. Use COG partial reads with rioxarray for everything else.</p>
              </div>

              <div className="guide-card">
                <strong>Analysis Ready Data (ARD)</strong>
                <p>Prioritize CEOS-ARD compliant data — standardized corrections, per-pixel quality masks, and interoperability. Filter early by cloud cover and QA bands. Parallelize with Dask for large time-series.</p>
                <div className="guide-tags">
                  <span className="guide-tag">pystac-client for search</span>
                  <span className="guide-tag">rioxarray / stackstac for loading</span>
                  <span className="guide-tag">xarray + Dask for scale</span>
                </div>
              </div>

              <div className="guide-card">
                <strong>Common Pitfalls</strong>
                <div className="guide-tags">
                  <span className="guide-tag warn">Downloading full archives</span>
                  <span className="guide-tag warn">Ignoring cloud cover / QA</span>
                  <span className="guide-tag warn">Hardcoding URLs (use STAC links)</span>
                  <span className="guide-tag warn">Non-COG formats (slow/expensive)</span>
                  <span className="guide-tag warn">Skipping catalog search before processing</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* CCTV OPERATIONS CONSOLE TAB */}
        {activeTab === "cctv" ? (() => {
          const cctvConsole = muc.cctvConsole;
          const gateFlow = muc.gateFlow;
          const filteredCams = activeCctvGroup
            ? publicCctvCameras.filter((c) => {
                const group = cctvConsole.groups.find((g) => g.id === activeCctvGroup);
                return group ? group.cameraIds.includes(c.id) : true;
              })
            : publicCctvCameras;
          const gridCols = cctvGridLayout === "2x2" ? 2 : cctvGridLayout === "3x3" ? 3 : 4;
          const gridCount = gridCols * gridCols;
          const displayCams = filteredCams.slice(0, gridCount);
          const filteredDetections = activeCctvGroup
            ? cctvConsole.detectionHistory.filter((d) => {
                const group = cctvConsole.groups.find((g) => g.id === activeCctvGroup);
                return group ? group.cameraIds.includes(d.cameraId) : true;
              })
            : cctvConsole.detectionHistory;
          const currentHourBuckets = gateFlow.buckets.filter((b) => {
            const h = new Date(b.periodStart).getUTCHours();
            const now = new Date().getUTCHours();
            return h === now;
          });

          return (
          <div className="tab-overlay cctv-ops-console">
            {/* MUC Operator Status Banner */}
            <div className={`muc-status-banner status-${mucStatus}`}>
              <div className="muc-status-left">
                <span className={`muc-status-dot ${mucStatus}`} />
                <span className="muc-status-text">{mucStatusLine}</span>
                {time.thaiTime ? <span className="thai-time-badge">{time.thaiTime} · {time.thaiDate}</span> : null}
              </div>
              <div className="muc-quick-stats">
                <div className="muc-qs-item"><span className="muc-qs-value">{liveCamCount}</span><span className="muc-qs-label">{lang === "th" ? "กล้องออนไลน์" : "Cameras Online"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{mucCctvAlertCount}</span><span className="muc-qs-label">{lang === "th" ? "แจ้งเตือน" : "Alerts"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{vehiclesThisHour.toLocaleString()}</span><span className="muc-qs-label">{lang === "th" ? "รถชม.นี้" : "Veh/Hour"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{matchCount}</span><span className="muc-qs-label">{lang === "th" ? "จับคู่เข้า-ออก" : "Matches"}</span></div>
              </div>
            </div>
            <div className="muc-shift-summary">
              <div className="shift-stat"><span className="shift-stat-value">{totalVehiclesToday.toLocaleString()}</span><span className="shift-stat-label">{lang === "th" ? "รถวันนี้" : "Vehicles Today"}</span></div>
              <div className="shift-stat"><span className="shift-stat-value">{peakHourData ? `${String(peakHourData.hour).padStart(2, "0")}:00` : "--"}</span><span className="shift-stat-label">{lang === "th" ? "ชั่วโมงพีค" : "Peak Hour"}</span></div>
              <div className="shift-stat"><span className="shift-stat-value">{mucCctvAlertCount + mucBottleneckCount}</span><span className="shift-stat-label">{lang === "th" ? "เหตุการณ์" : "Incidents"}</span></div>
              <div className="shift-stat"><span className={`shift-stat-value trend-${muc.airQuality.overallTrend}`}>{muc.airQuality.overallTrend === "up" ? "↑" : muc.airQuality.overallTrend === "down" ? "↓" : "→"} AQI {muc.airQuality.overallAqi}</span><span className="shift-stat-label">{lang === "th" ? "แนวโน้มอากาศ" : "AQI Trend"}</span></div>
            </div>
            {todayEvents.length > 0 ? (
              <div className="impact-events-strip">
                <span className="impact-strip-label">{lang === "th" ? "กิจกรรม IMPACT วันนี้" : "IMPACT Events Today"}</span>
                <div className="impact-chips-scroll">
                  {todayEvents.map((ev) => (
                    <div key={ev.id} className={`impact-chip parking-${ev.parkingPressure}`}>
                      <strong>{localize(lang, ev.title)}</strong>
                      <small>{ev.timeStart}–{ev.timeEnd}</small>
                      <div className="impact-chip-badges">
                        <span className="crowd-badge">{ev.expectedCrowd.toLocaleString()} {lang === "th" ? "คน" : "pax"}</span>
                        <span className={`parking-badge ${ev.parkingPressure}`}>{ev.parkingPressure}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Header: Grid layout + group tabs */}
            <div className="cctv-console-header">
              <div className="cctv-grid-selector">
                {(["2x2", "3x3", "4x4"] as CctvGridLayout[]).map((layout) => (
                  <button key={layout} type="button" className={cctvGridLayout === layout ? "grid-btn active" : "grid-btn"} onClick={() => setCctvGridLayout(layout)}>{layout}</button>
                ))}
              </div>
              <div className="cctv-group-tabs">
                <button type="button" className={activeCctvGroup === null ? "group-tab active" : "group-tab"} onClick={() => setActiveCctvGroup(null)}>{lang === "th" ? "ทั้งหมด" : "All"}</button>
                {cctvConsole.groups.map((g) => (
                  <button key={g.id} type="button" className={activeCctvGroup === g.id ? "group-tab active" : "group-tab"} onClick={() => setActiveCctvGroup(g.id)}>
                    {localize(lang, g.label)}
                    <span className="group-cam-count">{g.cameraIds.length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded camera modal */}
            {expandedCameraId ? (() => {
              const cam = publicCctvCameras.find((c) => c.id === expandedCameraId);
              const camDetections = cctvConsole.detectionHistory.filter((d) => d.cameraId === expandedCameraId);
              const camGate = gateFlow.gates.find((g) => g.cameraIds.includes(expandedCameraId));
              return cam ? (
                <div className="camera-cell-enlarged" onClick={() => setExpandedCameraId(null)}>
                  <div className="enlarged-content" onClick={(e) => e.stopPropagation()}>
                    <div className="enlarged-header">
                      <strong>{localize(lang, cam.label)}</strong>
                      <span className={`status-tag ${cam.status === "live" ? "live" : "manual"}`}>{cam.status}</span>
                      <button type="button" className="close-btn" onClick={() => setExpandedCameraId(null)}>✕</button>
                    </div>
                    <div className="enlarged-preview">
                      {cam.previewUrl ? <img src={cam.previewUrl} alt={localize(lang, cam.label)} loading="lazy" /> : <div className="no-preview">{lang === "th" ? "ไม่มีภาพ" : "No Preview"}</div>}
                    </div>
                    {camGate ? (
                      <div className="enlarged-gate-info">
                        <span className="eyebrow">{lang === "th" ? "ประตู" : "Gate"}: {localize(lang, camGate.label)}</span>
                        <span>{camGate.direction === "entry" ? "→ IN" : camGate.direction === "exit" ? "← OUT" : "↔ BI"}</span>
                      </div>
                    ) : null}
                    <div className="enlarged-detections">
                      <strong>{lang === "th" ? "ประวัติตรวจจับ" : "Detection History"}</strong>
                      {camDetections.slice(0, 5).map((d) => (
                        <div key={d.id} className={`detection-row severity-${d.severity}`}>
                          <span className={`status-tag ${d.severity === "alert" ? "delayed" : d.severity === "watch" ? "watch" : "live"}`}>{d.severity}</span>
                          <span>{localize(lang, d.detail)}</span>
                          <small>{formatConfidence(d.confidence)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })() : null}

            {/* Camera Grid */}
            <div className="cctv-camera-grid" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
              {displayCams.map((cam) => (
                <button key={cam.id} type="button" className={`camera-cell cam-status-${cam.status}`} onClick={() => setExpandedCameraId(cam.id)}>
                  <div className="camera-preview">
                    {cam.previewUrl ? <img src={cam.previewUrl} alt={localize(lang, cam.label)} loading="lazy" /> : <div className="no-preview-small">{cam.cameraId}</div>}
                  </div>
                  <div className="camera-cell-footer">
                    <span className="camera-label">{localize(lang, cam.label)}</span>
                    <span className={`status-dot ${cam.status}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom panels: Detection + Gate Counts */}
            <div className="cctv-bottom-panels">
              <div className="detection-panel">
                <div className="sat-section-header">
                  <strong>{lang === "th" ? "AI ตรวจจับล่าสุด" : "AI Detection Feed"}</strong>
                  <small>{filteredDetections.length} {lang === "th" ? "รายการ" : "events"}</small>
                </div>
                <div className="detection-list">
                  {filteredDetections.slice(0, 8).map((d) => (
                    <button key={d.id} type="button" className={`detection-item severity-${d.severity}`} onClick={() => setExpandedCameraId(d.cameraId)}>
                      <div className="detection-item-head">
                        <span className="eyebrow">{d.cameraId}</span>
                        <span className={`status-tag ${d.severity === "alert" ? "delayed" : d.severity === "watch" ? "watch" : "live"}`}>{d.severity}</span>
                      </div>
                      <span className="detection-detail">{localize(lang, d.detail)}</span>
                      <div className="signal-meta">
                        <span>{formatConfidence(d.confidence)}</span>
                        <span>{d.detectionType}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="gate-count-panel">
                <div className="sat-section-header">
                  <strong>{lang === "th" ? "ปริมาณรถ ณ ประตู" : "Gate Vehicle Counts"}</strong>
                  <small>{lang === "th" ? "ชั่วโมงนี้" : "this hour"}</small>
                </div>
                <div className="gate-count-list">
                  {gateFlow.gates.map((gate) => {
                    const bucket = currentHourBuckets.find((b) => b.gateId === gate.id);
                    const countIn = bucket?.countIn ?? 0;
                    const countOut = bucket?.countOut ?? 0;
                    const utilization = gate.capacity > 0 ? Math.round(((countIn + countOut) / gate.capacity) * 100) : 0;
                    return (
                      <div key={gate.id} className={`gate-count-card ${utilization > 100 ? "over-capacity" : utilization > 80 ? "high-load" : ""}`}>
                        <div className="gate-count-head">
                          <strong>{localize(lang, gate.label)}</strong>
                          <span className="eyebrow">{gate.direction === "entry" ? "→ IN" : gate.direction === "exit" ? "← OUT" : "↔"}</span>
                        </div>
                        <div className="gate-count-numbers">
                          <span className="count-in">▼ {countIn}</span>
                          <span className="count-out">▲ {countOut}</span>
                          <span className={`utilization ${utilization > 100 ? "critical" : utilization > 80 ? "warning" : ""}`}>{utilization}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          );
        })() : null}

        {/* TRAFFIC FLOW INTELLIGENCE TAB */}
        {activeTab === "traffic" ? (() => {
          const tf = muc.trafficFlow;
          const gf = muc.gateFlow;
          const maxVolume = Math.max(...tf.hourlyPatterns.map((p) => p.avgVolumeIn + p.avgVolumeOut), 1);
          const bnCount = tf.bottlenecks.filter((b) => b.severity === "bottleneck" || b.severity === "gridlock").length;
          return (
          <div className="tab-overlay traffic-flow-tab">
            {/* MUC Operator Status Banner */}
            <div className={`muc-status-banner status-${mucStatus}`}>
              <div className="muc-status-left">
                <span className={`muc-status-dot ${mucStatus}`} />
                <span className="muc-status-text">{mucStatusLine}</span>
              </div>
              <div className="muc-quick-stats">
                <div className="muc-qs-item"><span className="muc-qs-value">{totalVehiclesToday.toLocaleString()}</span><span className="muc-qs-label">{lang === "th" ? "รถวันนี้" : "Today"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{mucBottleneckCount}</span><span className="muc-qs-label">{lang === "th" ? "คอขวด" : "Bottlenecks"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{avgSpeedAll} <small>km/h</small></span><span className="muc-qs-label">{lang === "th" ? "เฉลี่ย" : "Avg Speed"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{peakGate ? localize(lang, peakGate.label).split(" ")[0] : "--"}</span><span className="muc-qs-label">{lang === "th" ? "ประตูพีค" : "Peak Gate"}</span></div>
              </div>
            </div>
            {todayEvents.length > 0 ? (
              <div className="impact-events-strip">
                <span className="impact-strip-label">{lang === "th" ? "กิจกรรม IMPACT" : "IMPACT Events"}</span>
                <div className="impact-chips-scroll">
                  {todayEvents.map((ev) => (
                    <div key={ev.id} className={`impact-chip parking-${ev.parkingPressure}`}>
                      <strong>{localize(lang, ev.title)}</strong>
                      <small>{ev.timeStart}–{ev.timeEnd} · {ev.expectedCrowd.toLocaleString()} {lang === "th" ? "คน" : "pax"}</small>
                      <span className={`parking-badge ${ev.parkingPressure}`}>{ev.parkingPressure}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="sat-section-header">
              <strong>{lang === "th" ? "ระบบวิเคราะห์การจราจร" : "TRAFFIC FLOW INTELLIGENCE"}</strong>
              <small>
                <span className={`status-tag ${bnCount > 0 ? "delayed" : "live"}`}>{bnCount} {lang === "th" ? "จุดคอขวด" : "bottlenecks"}</span>
                {" · "}{tf.flowLines.length} {lang === "th" ? "เส้นทาง" : "flow lines"}
              </small>
            </div>

            {/* Bottleneck Alert Cards */}
            <div className="bottleneck-cards">
              {tf.bottlenecks.map((bn) => (
                <button key={bn.id} type="button" className={`bottleneck-card severity-${bn.severity}`} onClick={() => {
                  applyDashboardScene({ view: "city", city: "muang-thong-thani", basemap: "atlas", layers: [...layers, "itic-traffic"] });
                  setActiveTab("map");
                }}>
                  <div className="bottleneck-head">
                    <strong>{localize(lang, bn.label)}</strong>
                    <span className={`status-tag ${bn.severity === "bottleneck" || bn.severity === "gridlock" ? "delayed" : "watch"}`}>{bn.severity}</span>
                  </div>
                  <div className="bottleneck-metrics">
                    <div className="metric-bar">
                      <div className="metric-bar-fill" style={{ width: `${Math.min(bn.volumeRatio * 100, 200) / 2}%`, backgroundColor: bn.volumeRatio > 1.2 ? "#dc2626" : bn.volumeRatio > 0.9 ? "#f59e0b" : "#16a34a" }} />
                      <span className="metric-bar-label">{Math.round(bn.volumeRatio * 100)}%</span>
                    </div>
                    <small>{bn.estimatedDelayMinutes} {lang === "th" ? "นาที ล่าช้า" : "min delay"}</small>
                  </div>
                  <div className="bottleneck-suggestion">{localize(lang, bn.suggestion)}</div>
                  <button type="button" className={`operator-action-btn ${bn.severity === "gridlock" ? "warning" : ""}`} onClick={(e) => { e.stopPropagation(); }}>
                    {bn.corridorId?.includes("impact") ? (lang === "th" ? "สั่ง Shuttle Bus" : "Dispatch Shuttle") : (lang === "th" ? "เปิดเส้นทางเลี่ยง" : "Open Alt Route")}
                  </button>
                </button>
              ))}
            </div>

            {/* Hourly Pattern Chart */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "รูปแบบรายชั่วโมง" : "Hourly Traffic Pattern"}</strong>
              <small>{lang === "th" ? "ปริมาณรถรวมทุกประตู" : "total volume all gates"}</small>
            </div>
            <div className="hourly-chart">
              <svg viewBox="0 0 480 120" preserveAspectRatio="none">
                {tf.hourlyPatterns.map((p, i) => {
                  const total = p.avgVolumeIn + p.avgVolumeOut;
                  const h = (total / maxVolume) * 100;
                  const speedColor = p.avgSpeedKmh < 15 ? "#dc2626" : p.avgSpeedKmh < 25 ? "#f59e0b" : "#16a34a";
                  return (
                    <g key={p.hour}>
                      <rect x={i * 20} y={110 - h} width="16" height={h} rx="2" fill={speedColor} opacity="0.8">
                        <title>{`${String(p.hour).padStart(2, "0")}:00 — ${total} veh · ${p.avgSpeedKmh} km/h`}</title>
                      </rect>
                      {i % 3 === 0 ? <text x={i * 20 + 8} y={118} textAnchor="middle" fontSize="7" fill="#94a3b8">{String(p.hour).padStart(2, "0")}</text> : null}
                    </g>
                  );
                })}
              </svg>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{ backgroundColor: "#16a34a" }} />{lang === "th" ? "ปกติ >25km/h" : "Normal >25km/h"}</span>
                <span><span className="legend-dot" style={{ backgroundColor: "#f59e0b" }} />{lang === "th" ? "ช้า 15-25km/h" : "Slow 15-25km/h"}</span>
                <span><span className="legend-dot" style={{ backgroundColor: "#dc2626" }} />{lang === "th" ? "ติดขัด <15km/h" : "Congested <15km/h"}</span>
              </div>
            </div>

            {/* Gate Volume Cards */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "ปริมาณรถ ณ ประตู — วันนี้" : "Gate Volumes — Today"}</strong>
            </div>
            <div className="gate-volume-cards">
              {gf.gates.map((gate) => {
                const gateBuckets = gf.buckets.filter((b) => b.gateId === gate.id);
                const totalIn = gateBuckets.reduce((s, b) => s + b.countIn, 0);
                const totalOut = gateBuckets.reduce((s, b) => s + b.countOut, 0);
                const last8 = gateBuckets.slice(-8);
                const sparkMax = Math.max(...last8.map((b) => b.countIn + b.countOut), 1);
                return (
                  <div key={gate.id} className="gate-volume-card">
                    <div className="gate-vol-head">
                      <strong>{localize(lang, gate.label)}</strong>
                      <span className="eyebrow">{gate.direction}</span>
                    </div>
                    <div className="gate-vol-numbers">
                      <span className="count-in">▼ {totalIn.toLocaleString()}</span>
                      <span className="count-out">▲ {totalOut.toLocaleString()}</span>
                    </div>
                    <svg className="gate-sparkline" viewBox="0 0 80 24" preserveAspectRatio="none">
                      {last8.map((b, i) => {
                        const h = ((b.countIn + b.countOut) / sparkMax) * 20;
                        return <rect key={i} x={i * 10} y={22 - h} width="8" height={h} rx="1" fill="#3b82f6" opacity="0.7" />;
                      })}
                    </svg>
                  </div>
                );
              })}
            </div>

            {/* Suggestions */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "คำแนะนำ" : "Recommendations"}</strong>
            </div>
            <div className="traffic-suggestions">
              {tf.suggestions.map((s, i) => (
                <div key={i} className="suggestion-card">
                  <span className="suggestion-num">{i + 1}</span>
                  <span>{localize(lang, s)}</span>
                </div>
              ))}
            </div>
          </div>
          );
        })() : null}

        {/* AIR QUALITY & CONSTRUCTION MONITORING TAB */}
        {activeTab === "air" ? (() => {
          const aq = muc.airQuality;
          const maxAqi = Math.max(...aq.history.map((p) => p.aqi), 100);
          const alertZones = aq.zones.filter((z) => z.isAboveThreshold);
          return (
          <div className="tab-overlay air-quality-tab">
            {/* MUC Operator Status Banner */}
            <div className={`muc-status-banner status-${mucStatus}`}>
              <div className="muc-status-left">
                <span className={`muc-status-dot ${mucStatus}`} />
                <span className="muc-status-text">{mucStatusLine}</span>
              </div>
              <div className="muc-quick-stats">
                <div className="muc-qs-item"><span className="muc-qs-value">{aq.overallAqi}</span><span className="muc-qs-label">AQI</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{mucAqiAlertCount}</span><span className="muc-qs-label">{lang === "th" ? "เขตเกิน" : "Over Limit"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{installedSensorCount}</span><span className="muc-qs-label">{lang === "th" ? "เซนเซอร์" : "Sensors"}</span></div>
                <div className="muc-qs-item"><span className="muc-qs-value">{activePhase ? localize(lang, activePhase.label) : "--"}</span><span className="muc-qs-label">{lang === "th" ? "ขั้นตอน" : "Phase"}</span></div>
              </div>
            </div>

            <div className="sat-section-header">
              <strong>{lang === "th" ? "คุณภาพอากาศ & การก่อสร้าง" : "AIR QUALITY & CONSTRUCTION"}</strong>
              <small>
                <span className={`status-tag ${aq.overallAqi >= 90 ? "delayed" : aq.overallAqi >= 60 ? "watch" : "live"}`}>AQI {aq.overallAqi}</span>
                {" · "}{alertZones.length} {lang === "th" ? "เขตเกินเกณฑ์" : "zones above threshold"}
              </small>
            </div>

            {/* Zone Cards */}
            <div className="aqi-zone-cards">
              {aq.zones.map((zone) => (
                <button key={zone.id} type="button" className={`aqi-zone-card zone-${zone.zoneType} ${zone.isAboveThreshold ? "above-threshold" : ""}`} onClick={() => {
                  applyDashboardScene({ view: "city", city: "muang-thong-thani", basemap: "atlas", layers: [...layers, "pollution", "weather"] });
                  setActiveTab("map");
                }}>
                  <div className="zone-card-head">
                    <span className={`zone-type-badge ${zone.zoneType}`}>{zone.zoneType}</span>
                    <span className={`trend-arrow ${zone.trend}`}>{zone.trend === "up" ? "↑" : zone.trend === "down" ? "↓" : "→"}</span>
                  </div>
                  <strong>{localize(lang, zone.label)}</strong>
                  <div className="zone-aqi-display">
                    <span className={`aqi-value ${zone.currentAqi >= 90 ? "critical" : zone.currentAqi >= 60 ? "moderate" : "good"}`}>{zone.currentAqi}</span>
                    <small>AQI</small>
                  </div>
                  <div className="zone-pm-values">
                    <span>PM2.5: {zone.pm25}</span>
                    <span>PM10: {zone.pm10}</span>
                  </div>
                  <div className="zone-threshold">
                    <div className="threshold-bar">
                      <div className="threshold-fill" style={{ width: `${Math.min((zone.currentAqi / zone.threshold) * 100, 100)}%`, backgroundColor: zone.isAboveThreshold ? "#dc2626" : zone.currentAqi / zone.threshold > 0.8 ? "#f59e0b" : "#16a34a" }} />
                      <span className="threshold-mark" style={{ left: "100%" }} />
                    </div>
                    <small>{lang === "th" ? "เกณฑ์" : "Threshold"}: {zone.threshold}</small>
                  </div>
                  {zone.constructionNote ? (
                    <div className="construction-note">{localize(lang, zone.constructionNote)}</div>
                  ) : null}
                  <small className="zone-detail">{localize(lang, zone.detail)}</small>
                  {zone.isAboveThreshold ? (
                    <button type="button" className="operator-action-btn warning" onClick={(e) => { e.stopPropagation(); }}>
                      {lang === "th" ? "แจ้งทีมบำรุงรักษา" : "Alert Maintenance"}
                    </button>
                  ) : null}
                </button>
              ))}
            </div>

            {/* 30-Day AQI Trend */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "แนวโน้ม AQI 30 วัน" : "30-Day AQI Trend"}</strong>
              <small>{lang === "th" ? "ผลกระทบจากก่อสร้าง" : "construction impact"}</small>
            </div>
            <div className="aqi-trend-chart">
              <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                {/* Threshold lines */}
                <line x1="0" y1={100 - (75 / maxAqi) * 90} x2="300" y2={100 - (75 / maxAqi) * 90} stroke="#f97316" strokeDasharray="4 2" strokeWidth="0.5" />
                <text x="302" y={100 - (75 / maxAqi) * 90 + 3} fontSize="6" fill="#f97316">75</text>
                <line x1="0" y1={100 - (100 / maxAqi) * 90} x2="300" y2={100 - (100 / maxAqi) * 90} stroke="#dc2626" strokeDasharray="4 2" strokeWidth="0.5" />
                <text x="302" y={100 - (100 / maxAqi) * 90 + 3} fontSize="6" fill="#dc2626">100</text>
                {/* AQI line */}
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  points={aq.history.map((p, i) => `${(i / (aq.history.length - 1)) * 296 + 2},${100 - (p.aqi / maxAqi) * 90}`).join(" ")}
                />
                {/* PM2.5 area */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  points={aq.history.map((p, i) => `${(i / (aq.history.length - 1)) * 296 + 2},${100 - (p.pm25 / maxAqi) * 90}`).join(" ")}
                />
              </svg>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{ backgroundColor: "#8b5cf6" }} />AQI</span>
                <span><span className="legend-dot" style={{ backgroundColor: "#3b82f6" }} />PM2.5</span>
                <span><span className="legend-line" style={{ borderColor: "#f97316" }} />{lang === "th" ? "เกณฑ์ก่อสร้าง 75" : "Construction 75"}</span>
                <span><span className="legend-line" style={{ borderColor: "#dc2626" }} />{lang === "th" ? "เกณฑ์ปกติ 100" : "Normal 100"}</span>
              </div>
            </div>

            {/* Construction Phase Timeline */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "ขั้นตอนก่อสร้าง" : "Construction Phases"}</strong>
            </div>
            <div className="construction-timeline">
              {aq.constructionPhases.map((phase) => (
                <div key={phase.id} className={`construction-phase phase-${phase.status}`}>
                  <div className="phase-indicator" />
                  <div className="phase-content">
                    <strong>{localize(lang, phase.label)}</strong>
                    <small>{phase.startDate}{phase.endDate ? ` → ${phase.endDate}` : " → ..."}</small>
                    <div className="phase-delta">
                      <span className={phase.avgAqiDelta > 10 ? "delta-high" : "delta-low"}>+{phase.avgAqiDelta} AQI</span>
                      <span className={`status-tag ${phase.status === "active" ? "watch" : phase.status === "completed" ? "live" : "manual"}`}>{phase.status}</span>
                    </div>
                    <small className="phase-detail">{localize(lang, phase.detail)}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Sensor Status */}
            <div className="sat-section-header">
              <strong>{lang === "th" ? "เซนเซอร์คุณภาพอากาศ" : "Air Quality Sensors"}</strong>
              <small>{aq.sensors.filter((s) => s.installed).length} {lang === "th" ? "ติดตั้งแล้ว" : "installed"} · {aq.sensors.filter((s) => !s.installed).length} {lang === "th" ? "แนะนำเพิ่ม" : "recommended"}</small>
            </div>
            <div className="sensor-list">
              {aq.sensors.map((sensor) => (
                <div key={sensor.id} className={`sensor-item ${sensor.installed ? "installed" : "recommended"}`}>
                  <span className={`sensor-dot ${sensor.installed ? "filled" : "hollow"}`} />
                  <span className="sensor-label">{localize(lang, sensor.label)}</span>
                  <span className={`zone-type-badge ${sensor.zoneType}`}>{sensor.zoneType}</span>
                  <small>{sensor.provider}</small>
                </div>
              ))}
            </div>
          </div>
          );
        })() : null}

        {/* AI INSIGHTS TAB */}
        {activeTab === "insights" ? (
          <div className="tab-overlay ai-panel open">
            <div className="sitrep">
              <div className="sitrep-header">
                <strong>{lang === "th" ? "สถานการณ์ปัจจุบัน" : "SITUATION REPORT"}</strong>
                <span className="eyebrow">{primaryScopeLabel} · {formatUtcClock(overview.updatedAt)} UTC</span>
              </div>
              <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "สถานะ" : "STATUS"}</span><strong>{executiveSignal}</strong></div>
              {topTrafficFeature ? (
                <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "จราจร" : "TRAFFIC"}</span><strong>{`${topTrafficSummary || "Traffic"} · ${topTrafficFeature.title}`}</strong></div>
              ) : null}
              {topAqiFeature ? (
                <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "คุณภาพอากาศ" : "AIR QUALITY"}</span><strong>{`${aqiLabel(numericProperty(topAqiFeature, "aqi"), lang)} (${numericProperty(topAqiFeature, "aqi")}) — ${topAqiFeature.title}`}</strong></div>
              ) : null}
              {weatherLeadFeature ? (
                <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "อากาศ" : "WEATHER"}</span><strong>{`${weatherLeadFeature.title} · ${weatherLeadSummary}`}</strong></div>
              ) : null}
              <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "รอดำเนินการ" : "ACTIONS"}</span><strong>{`${decisionItems.length} ${lang === "th" ? "รายการ" : "pending"}`}</strong></div>
              <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "กระแสสังคม" : "PUBLIC MOOD"}</span><strong>{`${socialListening.mentionCount} ${lang === "th" ? "คนพูดถึง" : "people talking"} · ${Math.round(socialListening.positiveShare * 100)}% ${lang === "th" ? "เชิงบวก" : "positive"}`}</strong></div>
              <div className="sitrep-row"><span className="eyebrow">{lang === "th" ? "ภาพโลก" : "EARTH VIEW"}</span><strong>{`${activeSatelliteLayers.length} ${lang === "th" ? "ชั้นข้อมูล" : "layers active"}`}</strong></div>
            </div>

            <div className="ai-panel-prompts">
              <span className="eyebrow">{copy.askQuestionMap}</span>
              <div className="ai-prompt-pills">
                {resolvedQuestionClusters.slice(0, 2).flatMap((cluster) =>
                  cluster.prompts.slice(0, 3).map((prompt) => (
                    <button key={`${cluster.id}-${prompt}`} type="button" className="assistant-prompt-chip" onClick={() => setAssistantQuestion(prompt)}>
                      {prompt}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="ai-panel-input">
              <textarea
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
                placeholder={copy.askPlaceholder}
                rows={2}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askAssistant(); } }}
              />
              <button type="button" className="chip active" onClick={() => void askAssistant()} disabled={assistantLoading || assistantQuestion.trim() === ""}>
                {assistantLoading ? "..." : copy.askSubmit}
              </button>
            </div>

            {assistantError ? <p className="assistant-error">{assistantError}</p> : null}

            {assistantResponse ? (
              <div className="ai-panel-body">
                <div className="ai-answer">
                  <span className="eyebrow">{assistantResponse.provider} · {assistantResponse.documentCount} docs</span>
                  <p>{localize(lang, assistantResponse.contextSummary)}</p>
                  <strong>{localize(lang, assistantResponse.answer)}</strong>
                </div>
                {assistantResponse.citations.length > 0 ? (
                  <div className="ai-citations">
                    <span className="eyebrow">{copy.askSources}</span>
                    {assistantResponse.citations.map((citation) => (
                      <div key={citation.id} className="ai-citation">
                        <strong>{citation.documentTitle}</strong>
                        <small>{citation.excerpt}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* DATA TAB */}
        {activeTab === "data" ? (
          <div className="tab-overlay data-panel">
            {/* Decision Queue */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{lang === "th" ? "ต้องดำเนินการ" : "Actions Needed"}</strong>
                <span className="status-pill">{decisionItems.length}</span>
              </div>
              {decisionItems.length > 0 ? decisionItems.map((item) => (
                <button key={item.id} type="button" className={`data-item severity-${item.severity}`} onClick={() => { focusDecision(item); setActiveTab("map"); }}>
                  <div className="stack-title">
                    <strong>{localize(lang, item.title)}</strong>
                    <span className={`status-tag ${item.status}`}>{item.status}</span>
                  </div>
                  <small>{localize(lang, item.recommendedAction)}</small>
                </button>
              )) : (
                <div className="data-item"><strong>{lang === "th" ? "ไม่มีรายการค้าง" : "Queue clear"}</strong></div>
              )}
            </div>

            {/* Incidents / Maintenance */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{lang === "th" ? "แจ้งเหตุ / ซ่อมบำรุง" : "Incidents / Maintenance"}</strong>
                <span className="status-pill">{incidents.filter((i) => i.status !== "closed" && i.status !== "resolved").length}</span>
              </div>
              {incidents.filter((i) => i.status !== "closed").slice(0, 8).map((inc) => (
                <button key={inc.id} type="button" className={`data-item severity-${inc.urgency === "critical" ? "urgent" : inc.urgency === "high" ? "watch" : "monitor"}`} onClick={() => {
                  applyDashboardScene({ view: "city", city: "muang-thong-thani", basemap: "atlas", layers: [...layers, "incidents"] });
                  setActiveTab("map");
                }}>
                  <div className="stack-title">
                    <strong>{localize(lang, inc.title)}</strong>
                    <span className={`status-tag ${inc.status === "new" ? "delayed" : inc.status === "resolved" ? "live" : "watch"}`}>{inc.status}</span>
                  </div>
                  <div className="incident-meta">
                    <span className={`urgency-badge urgency-${inc.urgency}`}>{inc.urgency}</span>
                    <span className="incident-category">{inc.category}</span>
                    {inc.assignedTo ? <span className="incident-assigned">{inc.assignedTo}</span> : null}
                  </div>
                  <small>{localize(lang, inc.description)}</small>
                </button>
              ))}
            </div>

            <div className="data-section">
              <div className="data-section-head">
                <strong>{lang === "th" ? "เหตุจราจรสด" : "Live Traffic"}</strong>
                <span className="status-pill">{trafficWatchItems.length}</span>
              </div>
              {trafficWatchItems.length > 0 ? trafficWatchItems.map((feature) => {
                const mappedCitySlug = normalizeCitySlug(
                  stringProperty(feature, "citySlug") || stringProperty(feature, "city")
                );
                const trafficStamp = stringProperty(feature, "startedAt") || feature.source.publishedAt;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    className="data-item"
                    onClick={() => {
                      focusCityWithLayer(mappedCitySlug, "itic-traffic");
                      setActiveTab("map");
                    }}
                  >
                    <div className="stack-title">
                      <strong>{feature.title}</strong>
                      <span className="status-pill">{topTrafficSummary && feature.id === topTrafficFeature?.id ? topTrafficSummary : [formatSignalLabel(stringProperty(feature, "eventClass")), formatSignalLabel(stringProperty(feature, "status"))].filter(Boolean).join(" · ")}</span>
                    </div>
                    <small>{[stringProperty(feature, "city"), formatUtcDateTime(trafficStamp)].filter(Boolean).join(" · ")}</small>
                  </button>
                );
              }) : (
                <div className="data-item"><strong>{lang === "th" ? "ไม่มีเหตุจราจรสด" : "No live traffic incidents"}</strong></div>
              )}
            </div>

            {/* News */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.news}</strong>
                <span className="status-pill">{filteredNews.length}</span>
              </div>
              {officialNews.map((item) => (
                <a key={item.id} className="data-item" href={item.source.sourceUrl} target="_blank" rel="noreferrer">
                  <strong>{localize(lang, item.title)}</strong>
                  <small>{`${item.source.sourceName} · ${formatUtcDateTime(item.publishedAt)}`}</small>
                </a>
              ))}
              {externalNews.map((item) => (
                <a key={item.id} className="data-item" href={item.source.sourceUrl} target="_blank" rel="noreferrer">
                  <strong>{localize(lang, item.title)}</strong>
                  <small>{`${item.source.sourceName} · ${formatUtcDateTime(item.publishedAt)}`}</small>
                </a>
              ))}
            </div>

            {/* Projects */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.projects}</strong>
                <span className="status-pill">{filteredProjects.length}</span>
              </div>
              {compactProjects.map((project) => (
                <button key={project.id} type="button" className="data-item" onClick={() => { focusCityWithLayer(project.citySlug, "projects"); setActiveTab("map"); }}>
                  <div className="stack-title">
                    <strong>{localize(lang, project.title)}</strong>
                    <span className={`status-tag ${project.status}`}>{project.status}</span>
                  </div>
                  <div className="progress-row">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${project.completionPercent}%` }} /></div>
                    <span>{project.completionPercent}%</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Resilience & Weather */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.resilience}</strong>
                <span className="status-pill">{resilience.source.freshnessStatus}</span>
              </div>
              <div className="data-item">
                <span className="eyebrow">Weather</span>
                <strong>{localize(lang, resilience.weatherSummary)}</strong>
              </div>
              <div className="data-item">
                <span className="eyebrow">Pollution</span>
                <strong>{localize(lang, resilience.pollutionSummary)}</strong>
              </div>
              {resilience.warnings.map((warning, index) => (
                <div key={index} className="data-item"><small>{localize(lang, warning)}</small></div>
              ))}
            </div>

            {/* Command Center Metrics */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{lang === "th" ? "ศูนย์ควบคุม" : "Control Center"}</strong>
                <span className="status-pill">{`${connectorReadyCount}/${commandConnectors.length}`}</span>
              </div>
              {commandCenter.metrics.map((metric) => (
                <div key={metric.id} className={`data-item tone-${metric.tone}`}>
                  <span className="eyebrow">{localize(lang, metric.label)}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            {/* Social Listening */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.social}</strong>
                <span className="status-pill">{socialListening.mentionCount}</span>
              </div>
              <div className="data-item">
                <span className="eyebrow">{copy.mentions}</span>
                <strong>{socialListening.mentionCount}</strong>
              </div>
              <div className="data-item">
                <span className="eyebrow">{copy.sentiment}</span>
                <strong>{socialListening.sentimentScore >= 0 ? `+${socialListening.sentimentScore}` : socialListening.sentimentScore}</strong>
              </div>
              <div className="data-item">
                <span className="eyebrow">{socialListening.dominantSource}</span>
                <div className="pill-list compact">
                  {socialListening.topTerms.slice(0, 5).map((term) => (
                    <span key={term} className="stack-pill">{term}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Markets */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.markets}</strong>
                <span className="status-pill">{markets.source.freshnessStatus}</span>
              </div>
              {markets.items.map((item) => (
                <div key={item.id} className={`data-item tone-${item.tone}`}>
                  <span>{localize(lang, item.label)}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            {/* Sources / API Status */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.apiWatch}</strong>
                <span className={`status-pill api-${apiStatusLabel.toLowerCase()}`}>{`${apiReadyCount}/${apiWatchSources.length}`}</span>
              </div>
              {apiWatchSources.map((source) => (
                <a key={source.id} className={`data-item ${source.freshnessStatus}`} href={source.url} target="_blank" rel="noreferrer">
                  <div className="stack-title">
                    <strong>{source.name}</strong>
                    <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Activity Log */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{copy.activity}</strong>
                <span className="status-pill">{activityItems.length}</span>
              </div>
              {activityItems.map((item) => (
                <div key={item.id} className="data-item">
                  <div className="stack-title">
                    <strong>{item.label}</strong>
                    <span className={`status-tag ${item.status}`}>{item.status}</span>
                  </div>
                  <small>{formatUtcClock(item.timestamp)} UTC · {item.detail}</small>
                </div>
              ))}
            </div>

            {/* API Explorer */}
            <div className="data-section">
              <div className="data-section-head">
                <strong>{lang === "th" ? "API สำหรับนักพัฒนา" : "API Explorer"}</strong>
                <span className="status-pill">42</span>
              </div>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "คุณภาพอากาศ" : "Air Quality"}</span></div>
              <a className="data-item" href="https://air-quality-api.open-meteo.com/v1/air-quality" target="_blank" rel="noreferrer"><strong>Open-Meteo Air Quality</strong><small>PM2.5, PM10, AQI — free, no key needed</small></a>
              <a className="data-item" href="https://api.openaq.org/v3/locations" target="_blank" rel="noreferrer"><strong>OpenAQ Monitoring</strong><small>Station-level air quality across Thailand</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "สภาพอากาศ" : "Weather"}</span></div>
              <a className="data-item" href="https://api.open-meteo.com/v1/forecast" target="_blank" rel="noreferrer"><strong>Open-Meteo Forecast</strong><small>Temperature, wind, rain — free, no key</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "ข่าวและสื่อ" : "News & Media"}</span></div>
              <a className="data-item" href="https://newsapi.org/v2/everything" target="_blank" rel="noreferrer"><strong>NewsAPI</strong><small>Smart city news (requires API key)</small></a>
              <a className="data-item" href="https://api.gdeltproject.org/api/v2/doc/doc" target="_blank" rel="noreferrer"><strong>GDELT Project</strong><small>Global media monitoring — free</small></a>
              <a className="data-item" href="https://news.google.com/rss/search" target="_blank" rel="noreferrer"><strong>Google News RSS</strong><small>Thailand smart city headlines — free</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "จราจรและกล้อง" : "Traffic & Cameras"}</span></div>
              <a className="data-item" href="https://event.longdo.com/feed/json" target="_blank" rel="noreferrer"><strong>iTIC Traffic Events</strong><small>Bangkok accidents, closures, construction</small></a>
              <a className="data-item" href="https://camera.longdo.com/feed/?command=json" target="_blank" rel="noreferrer"><strong>iTIC Public CCTV</strong><small>Bangkok municipal camera feeds</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "ภาพถ่ายดาวเทียม" : "Earth Observation"}</span></div>
              <a className="data-item" href="https://gibs.earthdata.nasa.gov" target="_blank" rel="noreferrer"><strong>NASA GIBS</strong><small>Aerosol, rain, vegetation tiles — free</small></a>
              <a className="data-item" href="https://firms.modaps.eosdis.nasa.gov" target="_blank" rel="noreferrer"><strong>NASA FIRMS</strong><small>Active fire and thermal hotspots</small></a>
              <a className="data-item" href="https://eonet.gsfc.nasa.gov/api/v3/events" target="_blank" rel="noreferrer"><strong>NASA EONET</strong><small>Natural disaster events — free</small></a>
              <a className="data-item" href="https://data.earth.jaxa.jp/en/" target="_blank" rel="noreferrer"><strong>JAXA Earth Data</strong><small>Daily rainfall satellite imagery</small></a>
              <a className="data-item" href="https://dataspace.copernicus.eu/ecosystem/services" target="_blank" rel="noreferrer"><strong>Copernicus Data Space</strong><small>Sentinel-1/2/5P — free with registration</small></a>
              <a className="data-item" href="https://planetarycomputer.microsoft.com/api/stac/v1" target="_blank" rel="noreferrer"><strong>Microsoft Planetary Computer</strong><small>Free Sentinel, Landsat, MODIS catalog</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "เกษตรและน้ำ" : "Agriculture & Water"}</span></div>
              <a className="data-item" href="https://eodashboard.org" target="_blank" rel="noreferrer"><strong>ESA EO Dashboard</strong><small>Agriculture monitoring collections</small></a>
              <a className="data-item" href="https://global-surface-water.appspot.com" target="_blank" rel="noreferrer"><strong>JRC Global Surface Water</strong><small>Flood and wetland mapping</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "ข้อมูลเปิดไทย" : "Thai Open Data"}</span></div>
              <a className="data-item" href="https://catalog.citydata.in.th/en" target="_blank" rel="noreferrer"><strong>CityData Thailand</strong><small>Smart city dataset catalog</small></a>
              <a className="data-item" href="https://opend.data.go.th/en" target="_blank" rel="noreferrer"><strong>data.go.th</strong><small>Open government data portal</small></a>
              <a className="data-item" href="https://disaster.gistda.or.th/services/open-api" target="_blank" rel="noreferrer"><strong>GISTDA Disaster</strong><small>Thai disaster and geospatial API</small></a>
              <a className="data-item" href="https://iticfoundation.org/en/open-data-sharing/" target="_blank" rel="noreferrer"><strong>iTIC Foundation</strong><small>Open transport and infrastructure data</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "เศรษฐกิจ" : "Economy"}</span></div>
              <a className="data-item" href="https://api.coingecko.com/api/v3/simple/price" target="_blank" rel="noreferrer"><strong>CoinGecko</strong><small>Bitcoin price context — free</small></a>
              <a className="data-item" href="https://api.frankfurter.app/latest" target="_blank" rel="noreferrer"><strong>Frankfurter FX</strong><small>USD/THB exchange rate — free</small></a>

              <div className="data-item"><span className="eyebrow">{lang === "th" ? "นโยบายและการพัฒนา" : "Policy & Development"}</span></div>
              <a className="data-item" href="https://data.undp.org/access-all-data" target="_blank" rel="noreferrer"><strong>UNDP Data Hub</strong><small>Development datasets for policy layers</small></a>
              <a className="data-item" href="https://www.datatopolicy.org" target="_blank" rel="noreferrer"><strong>Data to Policy</strong><small>Policy playbooks and templates</small></a>
            </div>
          </div>
        ) : null}

        {/* Tab Bar */}
        <div className="map-tab-bar">
          {(["map", "satellite", "cctv", "traffic", "air", "insights", "data"] as const).map((tab) => {
            const label = tab === "map" ? (lang === "th" ? "แผนที่" : "Map")
              : tab === "satellite" ? (lang === "th" ? "ดาวเทียม" : "Earth")
              : tab === "cctv" ? (lang === "th" ? "กล้อง" : "CCTV")
              : tab === "traffic" ? (lang === "th" ? "จราจร" : "Traffic")
              : tab === "air" ? (lang === "th" ? "อากาศ" : "Air")
              : tab === "insights" ? (lang === "th" ? "AI" : "AI")
              : (lang === "th" ? "ข้อมูล" : "Data");
            return (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "map-tab active" : "map-tab"}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
            );
          })}
        </div>
        </div>

        <section className="overview-shell">
          {/* — At-a-Glance Summary Strip — */}
          {/* KPI Scoreboard — large airport-board numbers */}
          <div className="kpi-scoreboard">
            <div className="kpi-item"><span className="kpi-value">{totalVehiclesToday.toLocaleString()}</span><span className="kpi-label">{lang === "th" ? "รถวันนี้" : "Vehicles"}</span></div>
            <div className="kpi-item"><span className={`kpi-value ${muc.airQuality.overallAqi >= 90 ? "red" : muc.airQuality.overallAqi >= 60 ? "amber" : "green"}`}>{muc.airQuality.overallAqi}</span><span className="kpi-label">AQI</span></div>
            <div className="kpi-item"><span className={`kpi-value ${mucBottleneckCount > 0 ? "red" : "green"}`}>{mucBottleneckCount}</span><span className="kpi-label">{lang === "th" ? "คอขวด" : "Bottleneck"}</span></div>
            <div className="kpi-item"><span className={`kpi-value ${incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length > 0 ? "amber" : "green"}`}>{incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length}</span><span className="kpi-label">{lang === "th" ? "เหตุการณ์" : "Incidents"}</span></div>
            <div className="kpi-item"><span className="kpi-value green">{liveCamCount}</span><span className="kpi-label">{lang === "th" ? "กล้อง" : "Cameras"}</span></div>
            <div className="kpi-item"><span className={`kpi-value ${floodRisk.floodRiskLevel === "high" || floodRisk.floodRiskLevel === "critical" ? "red" : floodRisk.floodRiskLevel === "moderate" ? "amber" : "green"}`}>{floodRisk.floodRiskLevel === "low" ? "OK" : floodRisk.floodRiskLevel.toUpperCase()}</span><span className="kpi-label">{lang === "th" ? "น้ำท่วม" : "Flood"}</span></div>
          </div>

          <section className="summary-strip">
            <button type="button" className="summary-card" onClick={() => { if (airRiskPreset?.run) airRiskPreset.run(); else focusCityWithLayer(topAqiCitySlug || city, "pollution"); }}>
              <span className="summary-label">{lang === "th" ? "คุณภาพอากาศ" : "Air Quality"}</span>
              <strong className={`summary-value aqi-${topAqiFeature ? (numericProperty(topAqiFeature, "aqi") <= 50 ? "good" : numericProperty(topAqiFeature, "aqi") <= 100 ? "moderate" : "unhealthy") : "unknown"}`}>
                {topAqiFeature ? aqiLabel(numericProperty(topAqiFeature, "aqi"), lang) : "--"}
              </strong>
              <span className="summary-sub">{topAqiFeature ? `AQI ${numericProperty(topAqiFeature, "aqi")}` : ""}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => focusCityWithLayer(hottestCitySlug || city, "weather")}>
              <span className="summary-label">{lang === "th" ? "อุณหภูมิ" : "Temperature"}</span>
              <strong className="summary-value">{hottestWeatherFeature ? `${numericProperty(hottestWeatherFeature, "temperatureC")}°C` : "--"}</strong>
              <span className="summary-sub">{hottestWeatherFeature?.title ?? ""}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => setActiveTab("data")}>
              <span className="summary-label">{lang === "th" ? "รอดำเนินการ" : "Actions"}</span>
              <strong className={`summary-value ${decisionItems.length > 0 ? "has-actions" : ""}`}>{decisionItems.length}</strong>
              <span className="summary-sub">{lang === "th" ? "รายการ" : "pending"}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => setActiveTab("cctv")}>
              <span className="summary-label">{lang === "th" ? "กล้อง" : "Cameras"}</span>
              <strong className="summary-value">{publicCctvCameras.filter((cam) => cam.status === "live").length}</strong>
              <span className="summary-sub">{lang === "th" ? "ออนไลน์" : "online"}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => setActiveTab("traffic")}>
              <span className="summary-label">{lang === "th" ? "จราจร" : "Traffic"}</span>
              <strong className={`summary-value ${mucBottleneckCount > 0 ? "has-actions" : ""}`}>
                {mucBottleneckCount}
              </strong>
              <span className="summary-sub">{lang === "th" ? "คอขวด" : "bottlenecks"}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => setActiveTab("air")}>
              <span className="summary-label">{lang === "th" ? "ก่อสร้าง AQI" : "Construction AQI"}</span>
              <strong className={`summary-value ${mucAqiAlertCount > 0 ? "aqi-unhealthy" : "aqi-good"}`}>
                {muc.airQuality.overallAqi}
              </strong>
              <span className="summary-sub">{`${mucAqiAlertCount} ${lang === "th" ? "เขตเกินเกณฑ์" : "alerts"}`}</span>
            </button>
            <button type="button" className="summary-card" onClick={() => setActiveTab("data")}>
              <span className="summary-label">{lang === "th" ? "กระแส" : "Public Mood"}</span>
              <strong className="summary-value">{Math.round(socialListening.positiveShare * 100)}%</strong>
              <span className="summary-sub">{`${socialListening.mentionCount} ${lang === "th" ? "คนพูดถึง" : "mentions"}`}</span>
            </button>
          </section>

          {/* ── Row 1: Hero (span 2) + Arena Events ── */}
          <section className="card overview-card hero">
          <div className="hero-command-row">
            <div className="hero-time">
              <span className="hero-time-value">{time.thaiTime || "00:00:00 ICT"}</span>
              <span className="hero-time-date">{time.thaiDate || ""}</span>
            </div>
            <div className="hero-weather">
              <span className="hero-temp">{resilience.weatherTemperatureC}°C</span>
              <small>{localize(lang, resilience.weatherSummary)}</small>
            </div>
          </div>
          <div className="hero-status-pills">
            <span className={`hero-pill ${mttTrafficSnapshotSeed.overallStatus === "congested" || mttTrafficSnapshotSeed.overallStatus === "blocked" ? "critical" : mttTrafficSnapshotSeed.overallStatus === "moderate" ? "warn" : "ok"}`}>{lang === "th" ? "จราจร" : "Traffic"}: {mttTrafficSnapshotSeed.overallStatus}</span>
            <span className={`hero-pill ${muc.airQuality.overallAqi >= 90 ? "critical" : muc.airQuality.overallAqi >= 60 ? "warn" : "ok"}`}>AQI: {muc.airQuality.overallAqi}</span>
            <span className={`hero-pill ${floodRisk.floodRiskLevel === "high" || floodRisk.floodRiskLevel === "critical" ? "critical" : floodRisk.floodRiskLevel === "moderate" ? "warn" : "ok"}`}>{lang === "th" ? "น้ำท่วม" : "Flood"}: {floodRisk.floodRiskLevel}</span>
            <span className="hero-pill ok">{lang === "th" ? "กิจกรรม" : "Events"}: {arenaEvents.filter((e) => e.status === "confirmed").length}</span>
          </div>
          <div className="terminal-callout compact">
            <strong>{executiveSignal}</strong>
          </div>
          {todayEvents.length > 0 ? (
            <div className="hero-next-event">
              <span className="eyebrow">{lang === "th" ? "กิจกรรมถัดไป" : "Next Event"}</span>
              <strong>{localize(lang, todayEvents[0].title)}</strong>
              <small>{localize(lang, todayEvents[0].venue)} · {todayEvents[0].timeStart} · {todayEvents[0].expectedCrowd.toLocaleString()} {lang === "th" ? "คน" : "pax"}</small>
            </div>
          ) : null}
          </section>

          <section className="card overview-card arena-events category-community">
            <div className="card-header">
              <span className="eyebrow">IMPACT Arena</span>
              <span className="status-pill">{arenaEvents.filter((e) => e.status !== "cancelled").length} events</span>
            </div>
            <div className="arena-event-list">
              {arenaEvents.filter((e) => e.status !== "cancelled").slice(0, 5).map((evt) => (
                <div key={evt.id} className="arena-event-row">
                  <strong>{localize(lang, evt.title)}</strong>
                  <div className="event-meta">
                    <span>{evt.date.slice(5)}</span>
                    <span>{evt.timeStart}</span>
                    <span className="event-crowd">~{evt.expectedCrowd >= 1000 ? `${(evt.expectedCrowd / 1000).toFixed(1)}k` : evt.expectedCrowd}</span>
                    <span className={`status-tag ${evt.parkingPressure === "high" ? "congested" : evt.parkingPressure === "moderate" ? "moderate" : "clear"}`}>
                      {evt.parkingPressure === "high" ? (lang === "th" ? "รถติดหนัก" : "HEAVY") : evt.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Row 2: CCTV + AI Vision ── */}
          <section className="card overview-card cctv-overview category-safety">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "กล้องสด" : "Live Cameras"}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("cctv")}>
              {publicCctvCameras.filter((cam) => cam.status === "live").length} live
            </button>
          </div>
          <div className="overview-inline-list">
            {publicCctvCameras.slice(0, 6).map((cam) => (
              <button key={cam.id} type="button" className={`data-item`} onClick={() => setActiveTab("cctv")}>
                <div className="stack-title">
                  <strong>{localize(lang, cam.label)}</strong>
                  <span className={`status-tag ${cam.status}`}>{cam.status}</span>
                </div>
                <small>{cam.source} · {cam.zone}</small>
              </button>
            ))}
            {publicCctvCameras.length > 6 ? (
              <button type="button" className="data-item" onClick={() => setActiveTab("cctv")}>
                <strong>{`+${publicCctvCameras.length - 6} more cameras`}</strong>
              </button>
            ) : null}
          </div>
          </section>

          {/* ── Row 3: Traffic, Trends, Briefing ── */}
          <section className="card overview-card traffic category-infra">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "การจราจร" : "Traffic"}</span>
              <span className={`status-tag ${mttTrafficSnapshotSeed.overallStatus}`}>{mttTrafficSnapshotSeed.overallStatus}</span>
            </div>
            <div className="corridor-list">
              {mttTrafficSnapshotSeed.corridors.map((corridor) => (
                <div key={corridor.id} className="corridor-row">
                  <div><strong>{localize(lang, corridor.label)}</strong></div>
                  <span className={`status-tag ${corridor.status}`}>{corridor.speedKmh} km/h</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card overview-card social-trends">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "เทรนด์" : "Trends"}</span>
              <span className="status-pill">{socialListening.mentionCount} mentions</span>
            </div>
            <div className="trend-keyword-cloud">
              {(socialListening.trendKeywords ?? []).map((kw) => (
                <span key={localize("en", kw.term)} className={`trend-tag sentiment-${kw.sentiment}`}>
                  {localize(lang, kw.term)}
                  <span className="trend-count">{kw.count}</span>
                  <span className="trend-arrow">{kw.trend === "up" ? "\u2191" : kw.trend === "down" ? "\u2193" : "\u2192"}</span>
                </span>
              ))}
            </div>
          </section>

          <section className="card overview-card briefing category-community">
          <div className="card-header">
            <span className="eyebrow">{copy.briefing}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("insights")}>AI</button>
          </div>
          <strong>{localize(lang, overview.briefing.headline)}</strong>
          <p>{localize(lang, overview.briefing.body)}</p>
          </section>

          {/* — Decision Queue — */}
          <section className="card overview-card queue category-safety">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "ต้องดำเนินการ" : "Actions Needed"}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("data")}>
              {decisionItems.length}
            </button>
          </div>
          <div className="overview-inline-list">
            {overviewQueue.length > 0 ? (
              overviewQueue.map((item) => {
                const queueDistrict = item.districtSlug ? districtByKey.get(`${item.citySlug}:${item.districtSlug}`) : null;
                const queueCity = cityBySlug.get(item.citySlug) ?? selectedCity;
                return (
                  <button key={item.id} type="button" className={`data-item severity-${item.severity}`} onClick={() => focusDecision(item)}>
                    <div className="stack-title">
                      <strong>{localize(lang, item.title)}</strong>
                      <span className={`status-tag ${item.status}`}>{item.status}</span>
                    </div>
                    <small>{queueDistrict ? localize(lang, queueDistrict.name) : localize(lang, queueCity.name)}</small>
                  </button>
                );
              })
            ) : (
              <div className="data-item">
                <strong>{lang === "th" ? "ไม่มีรายการเร่งด่วน" : "No escalated actions"}</strong>
              </div>
            )}
          </div>
          </section>

          {/* — News — */}
          <section className="card overview-card news category-community">
          <div className="card-header">
            <span className="eyebrow">{copy.news}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("data")}>
              {filteredNews.length}
            </button>
          </div>
          <div className="overview-inline-list">
            {[...overviewOfficialNews, ...overviewExternalNews].map((item) => (
              <a key={item.id} className="data-item" href={item.source.sourceUrl} target="_blank" rel="noreferrer">
                <strong>{localize(lang, item.title)}</strong>
                <small>{`${item.source.sourceName} · ${formatUtcDateTime(item.publishedAt)}`}</small>
              </a>
            ))}
          </div>
          </section>

          {/* — Resilience: weather + pollution — */}
          <section className="card overview-card resilience category-env">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "สภาพอากาศ" : "Weather & Air"}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("satellite")}>
              {resilience.source.freshnessStatus}
            </button>
          </div>
          <div className="overview-hero-metrics">
            <div className="data-item">
              <span className="eyebrow">Weather</span>
              <strong>{localize(lang, resilience.weatherSummary)}</strong>
            </div>
            <div className="data-item">
              <span className="eyebrow">Air Quality</span>
              <strong>{localize(lang, resilience.pollutionSummary)}</strong>
            </div>
          </div>
          </section>

          {/* — Flood & Water Risk — */}
          <section className="card overview-card flood-risk category-infra">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "น้ำท่วม & ระดับน้ำ" : "Flood & Water"}</span>
            <span className={`status-pill ${floodRisk.floodRiskLevel === "high" || floodRisk.floodRiskLevel === "critical" ? "delayed" : floodRisk.floodRiskLevel === "moderate" ? "watch" : "live"}`}>{floodRisk.floodRiskLevel}</span>
          </div>
          <div className="flood-gauges">
            {floodRisk.stations.map((st) => (
              <div key={st.id} className={`flood-gauge gauge-${st.status}`}>
                <div className="gauge-bar-wrap">
                  <div className="gauge-bar" style={{ height: `${Math.min((st.currentLevelM / st.criticalLevelM) * 100, 100)}%` }} />
                  <div className="gauge-warning-line" style={{ bottom: `${(st.warningLevelM / st.criticalLevelM) * 100}%` }} />
                </div>
                <div className="gauge-info">
                  <strong>{localize(lang, st.label)}</strong>
                  <span>{st.currentLevelM.toFixed(2)}m</span>
                  <span className={`gauge-status ${st.status}`}>{st.status}{st.trend === "up" ? " ↑" : st.trend === "down" ? " ↓" : ""}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flood-forecast">
            <span>{lang === "th" ? "ฝนคาด 24 ชม." : "Rain 24h"}: <strong>{floodRisk.precipitationForecast24h}mm</strong></span>
            <span>{lang === "th" ? "48 ชม." : "48h"}: <strong>{floodRisk.precipitationForecast48h}mm</strong></span>
            <span>{lang === "th" ? "ระบบสูบ" : "Pumps"}: <strong>{floodRisk.drainagePumpStatus === "all-operational" ? (lang === "th" ? "ปกติ" : "OK") : floodRisk.drainagePumpStatus}</strong></span>
          </div>
          </section>

          {/* — Transit Connections — */}
          <section className="card overview-card transit category-infra">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "ขนส่งสาธารณะ" : "Transit"}</span>
            <span className="status-pill">{transit.connections.length} {lang === "th" ? "เส้นทาง" : "routes"}</span>
          </div>
          <div className="transit-list">
            {transit.connections.slice(0, 5).map((conn) => (
              <div key={conn.id} className={`transit-item line-${conn.line}`}>
                <span className={`transit-dot status-${conn.status}`} />
                <div className="transit-info">
                  <strong>{conn.routeNumber ? `${conn.routeNumber} ` : ""}{localize(lang, conn.station)}</strong>
                  <small>{conn.distanceKm > 0 ? `${conn.distanceKm} km · ` : ""}{conn.travelMinutes} min{conn.frequency ? ` · ${conn.frequency}` : ""}</small>
                </div>
                <span className={`transit-status ${conn.status}`}>{conn.status}</span>
              </div>
            ))}
          </div>
          </section>

          {/* — Markets — */}
          <section className="card overview-card markets category-community">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "ตลาด" : "Markets"}</span>
            <span className="status-pill">{markets.source.freshnessStatus}</span>
          </div>
          <div className="market-grid">
            {markets.items.map((item) => (
              <div key={item.id} className={`market-item tone-${item.tone}`}>
                <span className="market-label">{localize(lang, item.label)}</span>
                <strong className="market-value">{item.value}</strong>
                <small className="market-change">{localize(lang, item.changeText)}</small>
              </div>
            ))}
          </div>
          </section>

          {/* — Utility / Infrastructure — */}
          <section className="card overview-card utility category-infra">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "สาธารณูปโภค" : "Infrastructure"}</span>
            <span className="status-pill">{utilitySeed.items.every((u) => u.status === "normal") ? "live" : "watch"}</span>
          </div>
          <div className="utility-grid">
            {utilitySeed.items.map((item) => (
              <div key={item.id} className={`utility-item status-${item.status}`}>
                <span className="utility-icon">{item.type === "power" ? "⚡" : item.type === "water" ? "💧" : item.type === "waste" ? "🗑️" : "🌐"}</span>
                <div className="utility-info">
                  <strong>{localize(lang, item.label)}</strong>
                  <small>{item.metric} · {localize(lang, item.detail)}</small>
                </div>
                <span className={`status-tag ${item.status === "normal" ? "live" : item.status === "degraded" ? "watch" : "delayed"}`}>{item.status}</span>
              </div>
            ))}
          </div>
          </section>

          {/* — Community Intelligence — */}
          <section className="card overview-card community-intel">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "ข้อมูลชุมชน" : "Community Intel"}</span>
            <span className="status-pill">live</span>
          </div>
          <div className="intel-grid">
            <div className="intel-item">
              <span className="intel-icon">☀️</span>
              <div className="intel-data">
                <strong className={`uv-${communityIntel.uvLabel}`}>UV {communityIntel.uvIndex}</strong>
                <small>{communityIntel.uvLabel} · {communityIntel.sunriseLocal}–{communityIntel.sunsetLocal}</small>
              </div>
            </div>
            <div className="intel-item">
              <span className="intel-icon">✈️</span>
              <div className="intel-data">
                <strong>{communityIntel.flightsOverhead}</strong>
                <small>{lang === "th" ? "เที่ยวบินเหนือ MTT" : "flights over MTT now"}</small>
              </div>
            </div>
            {communityIntel.nearbyEarthquakes.length > 0 ? (
              <div className="intel-item">
                <span className="intel-icon">🌍</span>
                <div className="intel-data">
                  <strong>M{communityIntel.nearbyEarthquakes[0].magnitude}</strong>
                  <small>{communityIntel.nearbyEarthquakes[0].place} · {communityIntel.nearbyEarthquakes[0].distanceKm}km</small>
                </div>
              </div>
            ) : (
              <div className="intel-item">
                <span className="intel-icon">🌍</span>
                <div className="intel-data">
                  <strong>{lang === "th" ? "ไม่มี" : "None"}</strong>
                  <small>{lang === "th" ? "แผ่นดินไหวใกล้เคียง" : "nearby earthquakes"}</small>
                </div>
              </div>
            )}
            {communityIntel.thaiHolidays.length > 0 ? (
              <div className="intel-item">
                <span className="intel-icon">🇹🇭</span>
                <div className="intel-data">
                  <strong>{communityIntel.thaiHolidays[0].localName}</strong>
                  <small>{communityIntel.thaiHolidays[0].date} · {communityIntel.thaiHolidays[0].name}</small>
                </div>
              </div>
            ) : null}
            {communityIntel.lotteryLatest?.firstPrize ? (
              <div className="intel-item">
                <span className="intel-icon">🎰</span>
                <div className="intel-data">
                  <strong>{communityIntel.lotteryLatest.firstPrize}</strong>
                  <small>{lang === "th" ? "ลอตเตอรี่รางวัลที่ 1" : "lottery 1st prize"} · {communityIntel.lotteryLatest.date}</small>
                </div>
              </div>
            ) : null}
            <div className="intel-item">
              <span className="intel-icon">👥</span>
              <div className="intel-data">
                <strong>{(communityIntel.populationThailand / 1_000_000).toFixed(1)}M</strong>
                <small>{lang === "th" ? "ประชากรไทย" : "Thailand population"}</small>
              </div>
            </div>
          </div>
          </section>

          {/* — Sources — */}
          <section className="card overview-card sources">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "แหล่งข้อมูล" : "Data Sources"}</span>
            <span className="status-pill">{`${apiReadyCount}/${apiWatchSources.length}`}</span>
          </div>
          <div className="overview-inline-list">
            {overviewSources.map((source) => (
              <a key={source.id} className={`data-item ${source.freshnessStatus}`} href={source.url} target="_blank" rel="noreferrer">
                <div className="stack-title">
                  <strong>{source.name}</strong>
                  <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                </div>
              </a>
            ))}
          </div>
          </section>

          {/* — Satellite — */}
          <section className="card overview-card ranking">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "ภาพจากดาวเทียม" : "Earth Observation"}</span>
            <button type="button" className="status-pill status-button" onClick={() => setActiveTab("satellite")}>
              {activeSatelliteLayers.length} layers
            </button>
          </div>
          <div className="overview-hero-metrics">
            <div className="data-item">
              <span className="eyebrow">Mode</span>
              <strong>{satelliteDigest.status.mode}</strong>
            </div>
            <div className="data-item">
              <span className="eyebrow">Sync</span>
              <strong>{formatUtcClock(latestSyncSource?.lastCheckedAt)} UTC</strong>
            </div>
          </div>
          </section>
        </section>
      </div>

      {/* Bottom Data Strip */}
      <footer className="bottombar">
        <div className="bottomstrip-row metrics">
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "คุณภาพอากาศ" : "Air Quality"}</span>
            <strong>{topAqiFeature ? aqiLabel(numericProperty(topAqiFeature, "aqi"), lang) : "--"}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "อุณหภูมิ" : "Temperature"}</span>
            <strong>{hottestWeatherFeature ? `${numericProperty(hottestWeatherFeature, "temperatureC")}°C` : "--"}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "กระแส" : "Public Buzz"}</span>
            <strong>{socialListening.mentionCount}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "อัปเดต" : "Updated"}</span>
            <strong>{formatUtcClock(latestSyncSource?.lastCheckedAt)}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "รอดำเนินการ" : "Actions"}</span>
            <strong>{decisionItems.length}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "กล้อง" : "Cameras"}</span>
            <strong>{publicCctvCameras.filter((cam) => cam.status === "live").length}</strong>
          </div>
          <div className="bottomstrip-metric">
            <span className="eyebrow">{lang === "th" ? "เมือง" : "Cities"}</span>
            <strong>{coverageFeatureCount}</strong>
          </div>
        </div>
        <div className="bottomstrip-row actions">
          <div className="bottomstrip-actions">
            {footerQuickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={action.active ? "bottomstrip-action active" : "bottomstrip-action"}
                onClick={() => {
                  action.onClick?.();
                  setActiveTab("map");
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div className="bottomstrip-attribution">
            <span className="bottomstrip-attribution-copy">{PUBLIC_DASHBOARD_ATTRIBUTION.copyright}</span>
            <a className="bottomstrip-attribution-link" href={`mailto:${PUBLIC_DASHBOARD_ATTRIBUTION.email}`}>
              {copy.contactEmailLabel}: {PUBLIC_DASHBOARD_ATTRIBUTION.email}
            </a>
            <a
              className="bottomstrip-attribution-link"
              href={PUBLIC_DASHBOARD_ATTRIBUTION.linkedInUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.contactLinkedInLabel}: {PUBLIC_DASHBOARD_ATTRIBUTION.linkedInHandle}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdminConsolePage() {
  const [lang, setLang] = useState<Locale>("en");
  const [token, setToken] = useState("");
  const [headlineTh, setHeadlineTh] = useState("สถานะทดลองพร้อมเผยแพร่");
  const [headlineEn, setHeadlineEn] = useState("Experimental operating brief ready");
  const [bodyTh, setBodyTh] = useState("ใช้คอนโซลนี้เพื่ออัปเดตสรุปสถานการณ์และซิงก์ข้อมูล");
  const [bodyEn, setBodyEn] = useState("Use this console to publish briefing updates and run source sync.");
  const [responseText, setResponseText] = useState("{ }");
  const [statusMessage, setStatusMessage] = useState("idle");
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>(cloneSeed(auditTrailSeed).slice(0, 8));
  const copy = copyDeck[lang];

  async function adminFetch(path: string, init?: RequestInit) {
    let lastError: Error | null = null;

    for (const baseUrl of API_BASE_CANDIDATES) {
      try {
        const headers: Record<string, string> = {
          "x-admin-token": token,
          ...(init?.headers as Record<string, string> ?? {})
        };

        if (init?.body) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${baseUrl}${path}`, {
          ...init,
          headers
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          lastError = new Error((payload as { message?: string }).message ?? "Admin request failed");
          continue;
        }

        return payload;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Admin request failed");
      }
    }

    throw lastError ?? new Error("Admin request failed");
  }

  async function runSync() {
    try {
      const payload = await adminFetch("/api/admin/sources/sync", { method: "POST" });
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("sync completed");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "sync failed");
    }
  }

  async function loadHealth() {
    try {
      const payload = await adminFetch("/api/admin/sources/health");
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("health loaded");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "health failed");
    }
  }

  async function publishBriefing() {
    try {
      const payload = await adminFetch("/api/admin/briefings", {
        method: "POST",
        body: JSON.stringify({
          headline: { th: headlineTh, en: headlineEn },
          body: { th: bodyTh, en: bodyEn }
        })
      });
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("briefing updated");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "publish failed");
    }
  }

  async function loadAudit() {
    try {
      const payload = await adminFetch("/api/admin/audit?limit=10");
      if (Array.isArray(payload)) {
        setAuditEvents(payload as AuditEventRecord[]);
      }
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("audit loaded");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "audit failed");
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{copy.admin}</p>
          <h1>Smart City Thailand Admin</h1>
        </div>
        <div className="compact-group">
          <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/">
            {copy.publicView}
          </NavLink>
          <button className={lang === "en" ? "chip active" : "chip"} onClick={() => setLang("en")}>
            EN
          </button>
          <button className={lang === "th" ? "chip active" : "chip"} onClick={() => setLang("th")}>
            TH
          </button>
        </div>
      </header>

      <div className="admin-grid">
        <section className="card">
          <div className="card-header">
            <span className="eyebrow">{copy.adminToken}</span>
            <span className="status-pill">{statusMessage}</span>
          </div>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={copy.adminToken}
          />
          <p>{copy.adminHelp}</p>
          <div className="admin-actions">
            <button className="share-button" onClick={runSync}>
              {copy.syncNow}
            </button>
            <button className="chip active" onClick={loadHealth}>
              {copy.refreshHealth}
            </button>
            <button className="chip" onClick={loadAudit}>
              Audit
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="eyebrow">{copy.publishBriefing}</span>
            <span className="status-pill">manual</span>
          </div>
          <div className="admin-form">
            <label>
              <span>Headline (TH)</span>
              <input value={headlineTh} onChange={(event) => setHeadlineTh(event.target.value)} />
            </label>
            <label>
              <span>Headline (EN)</span>
              <input value={headlineEn} onChange={(event) => setHeadlineEn(event.target.value)} />
            </label>
            <label>
              <span>Body (TH)</span>
              <textarea rows={4} value={bodyTh} onChange={(event) => setBodyTh(event.target.value)} />
            </label>
            <label>
              <span>Body (EN)</span>
              <textarea rows={4} value={bodyEn} onChange={(event) => setBodyEn(event.target.value)} />
            </label>
            <button className="share-button" onClick={publishBriefing}>
              {copy.publishBriefing}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="eyebrow">Response</span>
            <span className="status-pill">json</span>
          </div>
          <pre className="response-panel">{responseText}</pre>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="eyebrow">Audit Trail</span>
            <span className="status-pill">{auditEvents.length}</span>
          </div>
          <div className="decision-list tile-scroll">
            {auditEvents.map((item) => (
              <article key={item.id} className="activity-item">
                <div className="stack-title">
                  <strong>{`${item.action} ${item.entityType}`}</strong>
                  <span className={`status-tag ${item.status}`}>{item.status}</span>
                </div>
                <small>{`${item.actor} • ${formatUtcDateTime(item.timestamp)}`}</small>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Public Resident Page ── */
function PublicPage() {
  const [lang] = useState<"th" | "en">("th");
  const overviewQ = useQuery({ queryKey: ["pub-overview"], queryFn: () => fetch("/api/overview?view=city&city=muang-thong-thani").then((r) => r.ok ? r.json() : null), staleTime: 60000 });
  const arenaQ = useQuery({ queryKey: ["pub-arena"], queryFn: () => fetch("/api/arena-events").then((r) => r.ok ? r.json() : []), staleTime: 60000 });
  const incidentQ = useQuery({ queryKey: ["pub-incidents"], queryFn: () => fetch("/api/incidents?limit=5").then((r) => r.ok ? r.json() : []), staleTime: 30000 });
  const floodQ = useQuery({ queryKey: ["pub-flood"], queryFn: () => fetch("/api/flood-risk").then((r) => r.ok ? r.json() : null), staleTime: 60000 });
  const transitQ = useQuery({ queryKey: ["pub-transit"], queryFn: () => fetch("/api/transit").then((r) => r.ok ? r.json() : null), staleTime: 60000 });

  const events = (Array.isArray(arenaQ.data) ? arenaQ.data : []).filter((e: any) => e.status === "confirmed").slice(0, 4);
  const activeIncidents = (Array.isArray(incidentQ.data) ? incidentQ.data : []).filter((i: any) => i.status !== "resolved" && i.status !== "closed").slice(0, 5);
  const flood = floodQ.data as any;
  const transitData = transitQ.data as any;

  const mucQ = useQuery({ queryKey: ["pub-muc"], queryFn: () => fetch("/api/muc").then((r) => r.ok ? r.json() : null), staleTime: 60000 });
  const aq = (mucQ.data as any)?.airQuality;
  const aqiValue = aq?.overallAqi ?? 68;
  const nowThai = new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="public-page">
      <div className="public-header">
        <h1>เมืองทองธานี</h1>
        <small>Muang Thong Thani — Resident Info</small>
        <span className="public-time">{nowThai} ICT</span>
      </div>

      <div className="public-card">
        <h3>{lang === "th" ? "คุณภาพอากาศ" : "Air Quality"}</h3>
        <div className={`public-big-value ${aqiValue >= 90 ? "bad" : aqiValue >= 60 ? "moderate" : "good"}`}>AQI {aqiValue}</div>
        <div className="public-sub">{aq ? `PM2.5: ${aq.zones?.[0]?.pm25 ?? "--"} · PM10: ${aq.zones?.[0]?.pm10 ?? "--"}` : "PM2.5: -- · PM10: --"}</div>
      </div>

      {flood ? (
        <div className="public-card">
          <h3>{lang === "th" ? "ความเสี่ยงน้ำท่วม" : "Flood Risk"}</h3>
          <div className={`public-big-value ${flood.floodRiskLevel === "high" || flood.floodRiskLevel === "critical" ? "bad" : flood.floodRiskLevel === "moderate" ? "moderate" : "good"}`}>{flood.floodRiskLevel?.toUpperCase() || "OK"}</div>
          <div className="public-sub">{lang === "th" ? "ฝนคาด" : "Rain forecast"}: {flood.precipitationForecast24h || 0}mm / 24h</div>
        </div>
      ) : null}

      <div className="public-card">
        <h3>{lang === "th" ? "กิจกรรม IMPACT วันนี้" : "IMPACT Events Today"}</h3>
        {events.length > 0 ? events.map((e: any) => (
          <div key={e.id} className="public-event">
            <strong>{e.title?.th || e.title?.en || "Event"}</strong>
            <small>{e.venue?.en} · {e.timeStart}–{e.timeEnd} · {(e.expectedCrowd || 0).toLocaleString()} {lang === "th" ? "คน" : "pax"}</small>
          </div>
        )) : <div className="public-sub">{lang === "th" ? "ไม่มีกิจกรรมวันนี้" : "No events today"}</div>}
      </div>

      {activeIncidents.length > 0 ? (
        <div className="public-card">
          <h3>{lang === "th" ? "แจ้งซ่อมบำรุง" : "Maintenance Notices"}</h3>
          {activeIncidents.map((inc: any) => (
            <div key={inc.id} className="public-incident">
              <span className={`public-incident-dot ${inc.urgency}`} />
              <div>
                <strong style={{ fontSize: "0.8rem" }}>{inc.title?.th || inc.title?.en}</strong>
                <small style={{ display: "block", color: "#71717a" }}>{inc.category} · {inc.status}</small>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {transitData?.connections ? (
        <div className="public-card">
          <h3>{lang === "th" ? "ขนส่งสาธารณะ" : "Transit"}</h3>
          {transitData.connections.slice(0, 4).map((c: any) => (
            <div key={c.id} className="public-event">
              <strong>{c.routeNumber ? `${c.routeNumber} ` : ""}{c.station?.th || c.station?.en}</strong>
              <small>{c.distanceKm > 0 ? `${c.distanceKm}km · ` : ""}{c.travelMinutes} min · {c.frequency || ""}</small>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ textAlign: "center", padding: "1rem", color: "#a1a1aa", fontSize: "0.65rem" }}>
        Muang Thong Thani Smart City Dashboard<br />
        <a href="/" style={{ color: "#3b82f6" }}>{lang === "th" ? "เข้าสู่แดชบอร์ดปฏิบัติการ" : "Operations Dashboard"}</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/public" element={<PublicPage />} />
      <Route path="/admin" element={<AdminConsolePage />} />
    </Routes>
  );
}
