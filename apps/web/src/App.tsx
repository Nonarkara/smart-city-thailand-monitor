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
  projects as projectSeed,
  resilience as resilienceSeed,
  socialListening as socialListeningSeed,
  sources as sourceSeed
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
  ResilienceSnapshot,
  SatelliteDigest,
  SocialListeningSnapshot,
  SourceRecord,
  TimeRange,
  TimeSnapshot
} from "@smart-city/shared";
import {
  startTransition,
  useEffect,
  useDeferredValue,
  useMemo,
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
const LIVE_POLL_INTERVAL_MS = 300000;
const SATELLITE_DOCS_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html";
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
    basemap: "atlas" | "satellite";
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
    cameraId: "MTT-CAM-01",
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
    cameraId: "MTT-CAM-02",
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
    cameraId: "MTT-CAM-03",
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
    cameraId: "MTT-CAM-04",
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
    cameraId: "MTT-CAM-05",
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
    matchedCameraId: "MTT-CAM-05",
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
    matchedCameraId: "MTT-CAM-03",
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
    id: "eo-vegetation",
    label: { th: "พืชพรรณ", en: "Vegetation" },
    detail: { th: "ดัชนีพืชพรรณ NDVI", en: "NDVI vegetation index" },
    color: "#65a30d"
  },
  {
    id: "eo-aerosol",
    label: { th: "ละอองลอย", en: "Aerosol" },
    detail: { th: "ดัชนีละอองลอยชั้นบรรยากาศ", en: "Atmospheric aerosol index" },
    color: "#9333ea"
  },
  {
    id: "eo-precipitation",
    label: { th: "มรสุม", en: "Monsoon" },
    detail: { th: "ภาพรวมฝนและมรสุมระดับประเทศ", en: "Nationwide precipitation and monsoon context" },
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
    label: { th: "ความร้อนพื้นผิว", en: "Surface Temp" },
    detail: { th: "อุณหภูมิพื้นผิวดินสำหรับจุดร้อนเมือง", en: "Land-surface temperature for urban heat" },
    color: "#fb7185"
  },
  {
    id: "satellite-thermal",
    label: { th: "ความร้อนผิดปกติ", en: "Thermal Alerts" },
    detail: { th: "จุดความร้อนและความเสี่ยงไฟ", en: "Thermal anomalies and fire hotspots" },
    color: "#f97316"
  },
  {
    id: "satellite-water-vapor",
    label: { th: "ไอน้ำ", en: "Water Vapor" },
    detail: { th: "ความชื้นบรรยากาศและแนวมรสุม", en: "Atmospheric moisture and monsoon flow" },
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
    label: { th: "ไฟป่า", en: "Fire Watch" },
    detail: { th: "จุดความร้อนกลางคืนจาก VIIRS ใช้ร่วมกับ Roscosmos FIRMS", en: "VIIRS night thermal anomalies, shared with Roscosmos FIRMS network" },
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
    label: { th: "คลอโรฟิลล์", en: "Ocean Color" },
    detail: { th: "ความเข้มข้นคลอโรฟิลล์ทะเลจาก MODIS Aqua ร่วมกับ ESA OC-CCI", en: "Ocean chlorophyll from MODIS Aqua, merged with ESA OC-CCI program" },
    color: "#059669"
  },
  {
    id: "eo-cloud-phase",
    label: { th: "เฟสเมฆ", en: "Cloud Phase" },
    detail: { th: "เฟสเมฆอินฟราเรดจาก MODIS Aqua สำหรับพยากรณ์", en: "Cloud phase infrared for weather forecasting context" },
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
    case "eo-vegetation":
      return 0.6;
    case "eo-aerosol":
      return 0.54;
    case "eo-precipitation":
      return 0.58;
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
      return "normal";
    case "satellite-night-lights":
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
  nonthaburi: "muang-thong-thani",
  "pathum-thani": "muang-thong-thani",
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
    title: "Smart City Thailand Super Dashboard",
    brandEyebrow: "สมาร์ตซิตี้ไทยแลนด์",
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
    resilience: "ความยืดหยุ่น",
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
    activity: "บันทึกการทำงานสด",
    social: "Social Listening",
    impact: "Official Impact",
    recenter: "จัดกึ่งกลางแผนที่",
    eoOverlay: "Rain",
    hotspots: "จุดเด่นตอนนี้",
    focusPresets: "มุมมองด่วน",
    focusAirRisk: "ความเสี่ยงอากาศ",
    focusCandidates: "เมืองผู้สมัคร",
    focusMediaWatch: "จับตาสื่อ",
    focusEconomyContext: "บริบทเศรษฐกิจ",
    mapLegend: "คำอธิบายแผนที่",
    aqiScale: "ระดับ AQI",
    activeLayersLegend: "เลเยอร์ที่เปิดอยู่",
    clickToFocus: "กดเพื่อโฟกัสบนแผนที่",
    mediaHotspot: "สัญญาณสื่อ",
    weatherLegend: "วงกลมสีฟ้า = อุณหภูมิ / ความชื้น",
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
    fireThermalLegend: "สีแดง = จุดความร้อนกลางคืนจาก VIIRS / Roscosmos FIRMS",
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
    apiWatch: "สถานะ API",
    noExternalSignals: "ยังไม่มีสัญญาณภายนอกเพิ่มเติม",
    sourceStatus: "สถานะแหล่งข้อมูล",
    worldContext: "บริบทโลก",
    placeLookup: "ข้อมูลเมือง",
    askAssistant: "ถาม Smart City",
    askLead: "AI ผู้ช่วย",
    askQuestionMap: "แผนที่คำถาม",
    askQuestionMapNote: "คำถามเหล่านี้มาจากกรอบคิดที่ซ้ำกันใน Hitachi Review และ Smart City Primer",
    askPlaceholder: "ถามจากเอกสารใน Knowledge โดยอิงจากเมืองและเลเยอร์ที่กำลังดูอยู่",
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
    title: "Smart City Thailand Super Dashboard",
    brandEyebrow: "Smart City Thailand",
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
    resilience: "Resilience",
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
    activity: "Live Activity",
    social: "Social Listening",
    impact: "Official Impact",
    recenter: "Recenter Map",
    eoOverlay: "Rain",
    hotspots: "Hotspots Now",
    focusPresets: "Focus Presets",
    focusAirRisk: "Air Risk",
    focusCandidates: "Candidate Cities",
    focusMediaWatch: "Media Watch",
    focusEconomyContext: "Economic Context",
    mapLegend: "Map Legend",
    aqiScale: "AQI Scale",
    activeLayersLegend: "Active Layers",
    clickToFocus: "Click to focus on the map",
    mediaHotspot: "Media Spike",
    weatherLegend: "Teal circles = temperature / humidity",
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
    fireThermalLegend: "Red = VIIRS night thermal anomalies, shared with Roscosmos FIRMS network",
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
    apiWatch: "API Watch",
    noExternalSignals: "No additional external signals yet",
    sourceStatus: "Source Status",
    worldContext: "World Context",
    placeLookup: "City Lookup",
    askAssistant: "Ask Smart City",
    askLead: "Knowledge AI",
    askQuestionMap: "Question Map",
    askQuestionMapNote: "These prompts come from the recurring frames in the Hitachi Review and the Smart City Primer",
    askPlaceholder: "Ask the local Knowledge folder using the city, domain, and layers you are currently viewing",
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
  "chiang-mai": ["chiang-mai", "chiangmai"]
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
  const view = (searchParams.get("view") as DashboardView) || "city";
  const timeRange = (searchParams.get("timeRange") as TimeRange) || "7d";
  const city = searchParams.get("city") ?? "muang-thong-thani";
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
    commandCenter: commandCenterQuery.data ?? commandCenterFallback,
    time: normalizeTimeSnapshot(timeQuery.data, timeFallback)
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
  const basemap = searchParams.get("basemap") === "satellite" ? "satellite" : "atlas";

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
    commandCenter,
    time
  } = useDashboardData(searchParams);

  const copy = copyDeck[lang];
  const selectedCity = overview.cities.find((item) => item.slug === city) ?? overview.cities[0];
  const cityDistricts = districts.filter((item) => item.citySlug === selectedCity.slug);
  const districtBySlug = new Map(cityDistricts.map((item) => [item.slug, item]));
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
      : selectedCity.slug === "muang-thong-thani"
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

  const officialNews = filteredNews.filter((item) => item.kind === "official").slice(0, 2);
  const externalNews = filteredNews.filter((item) => item.kind === "external").slice(0, 3);
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
  const topAqiFeature =
    pollutionCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      return !best || numericProperty(feature, "aqi") > numericProperty(best, "aqi") ? feature : best;
    }, null) ?? null;
  const hottestWeatherFeature =
    weatherCollection?.features.reduce<GeoFeatureRecord | null>((best, feature) => {
      return !best || numericProperty(feature, "temperatureC") > numericProperty(best, "temperatureC") ? feature : best;
    }, null) ?? null;
  const latestExternalSignal = news.find((item) => item.kind === "external") ?? null;
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
        if (collection.layerId === "bangkok-passages" || collection.layerId === "itic-traffic") {
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
    const leadDecision = filteredDecisions[0];
    if (leadDecision) {
      return localize(lang, leadDecision.title);
    }

    if (topAqiFeature && numericProperty(topAqiFeature, "aqi") >= 70) {
      if (topAqiFeature.title === "Chiang Mai") {
        return lang === "th" ? "ความเสี่ยงด้านอากาศเพิ่มขึ้นในเชียงใหม่" : "Air risk rising in Chiang Mai";
      }

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
  const layerLegendDetails: Record<string, string> = {
    pollution: copy.clickToFocus,
    weather: copy.weatherLegend,
    projects: copy.projectLegend,
    news: copy.newsLegend,
    resilience: copy.resilienceLegend,
    "itic-traffic": lang === "th" ? "สีแดง = จุดจราจรและเหตุการณ์จราจรสด" : "Red = live traffic watchpoints and incidents",
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
    "satellite-vegetation": lang === "th" ? "ค่าพืชพรรณ NDVI จาก NASA GIBS" : "NASA GIBS NDVI vegetation index",
    "satellite-aerosol": lang === "th" ? "ดัชนีละอองลอยจาก NASA GIBS" : "NASA GIBS aerosol index",
    "satellite-surface-temp":
      lang === "th"
        ? "อุณหภูมิพื้นผิวดินจาก NASA GIBS สำหรับความร้อนเมืองและพื้นที่แห้ง"
        : "NASA GIBS land-surface temperature for urban heat and dry stress",
    "satellite-thermal":
      lang === "th"
        ? "จุดความร้อนดาวเทียมจาก NASA GIBS สำหรับไฟและความร้อนผิดปกติ"
        : "NASA GIBS thermal anomalies for fire and heat watch",
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
      layers: ["pollution", "weather", "resilience"],
      run: () => {
        const next = new URLSearchParams(searchParams);
        next.set("layers", ["pollution", "weather", "resilience"].join(","));
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
          location: latestExternalSignal.citySlug ? localize(lang, selectedCity.name) : (lang === "th" ? "สื่อภายนอก" : "External media"),
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
    basemap: "atlas" | "satellite";
    confidence: number;
    freshness: string;
  }>;
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
  const workspaceTitle = lang === "th" ? "Muang Thong Thani Command Center" : "Muang Thong Thani Command Center";
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
    basemap?: "atlas" | "satellite";
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

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-cluster">
          <img src="/Logo depa-01.png" alt="depa" className="brand-logo" />
          <img src="/Smart City Logo-02.png" alt="Smart City Thailand Office" className="brand-logo smart-city-logo" />
          <img src="/mdes.png" alt="MDES" className="brand-logo secondary" />
          <div className="brand-copy">
            <p className="eyebrow">{copy.brandEyebrow}</p>
            <h1>{workspaceTitle}</h1>
            <p className="brand-subline">{copy.subtitle}</p>
          </div>
        </div>

        <div className="top-controls">
          <nav className="compact-group">
            <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/">
              {copy.publicView}
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/admin">
              {copy.admin}
            </NavLink>
          </nav>

          <div className="compact-group">
            <span className="eyebrow">{copy.view}</span>
            {(["national", "city", "domain"] as DashboardView[]).map((option) => (
              <button
                key={option}
                className={option === view ? "chip active" : "chip"}
                onClick={() => updateParam("view", option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="compact-group">
            <span className="eyebrow">{copy.range}</span>
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                className={option === timeRange ? "chip active" : "chip"}
                onClick={() => updateParam("timeRange", option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="compact-group">
            <button className={lang === "en" ? "chip active" : "chip"} onClick={() => updateParam("lang", "en")}>
              EN
            </button>
            <button className={lang === "th" ? "chip active" : "chip"} onClick={() => updateParam("lang", "th")}>
              TH
            </button>
          </div>

          <button
            className="share-button"
            onClick={() => {
              setManualOpen(false);
              openCityOpsDrawer(
                selectedCity.slug,
                lang === "th"
                  ? "ใช้ drawer นี้เพื่ออธิบายมุมมองปัจจุบัน พร้อมโครงการ ข่าว และชั้นภาพที่เกี่ยวข้อง"
                  : "Use this drawer to explain the current view with supporting projects, news, and layers.",
                layers
              );
            }}
          >
            {uiText.explainView}
          </button>

          <button
            className="share-button"
            onClick={() => {
              setOpsDrawerState(null);
              setManualOpen(true);
            }}
          >
            {uiText.screenshotManual}
          </button>

          <button className="share-button" onClick={copyLink}>
            {copiedLink ? copy.copied : copy.share}
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="side-section side-search">
          <input
            type="search"
            className="search-input"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={copy.search}
          />
        </div>

        <div className="side-section side-assistant-launch">
          <button type="button" className="side-ai-launcher" onClick={() => setAssistantOpen(true)}>
            <span className="eyebrow">{copy.askAssistant}</span>
            <strong>{copy.askLead}</strong>
            <small>{assistantResponse ? `${assistantResponse.documentCount} docs` : assistantStatus?.documentCount ? `${assistantStatus.documentCount} docs` : copy.askLocalOnly}</small>
          </button>
        </div>

        <div className="side-section">
          <span className="eyebrow">{lang === "th" ? "ชั้นข้อมูลปฏิบัติการ" : "Operational Layers"}</span>
          <div className="toggle-stack">
            {operationalLayerOptions.map((layer) => {
              const active = layers.includes(layer.id);
              const detail =
                layer.kind === "signal"
                  ? lang === "th"
                    ? "สัญญาณตัดสินใจ"
                    : "Decision signal"
                  : lang === "th"
                    ? "ข้อมูลอ้างอิง"
                    : "Reference layer";

              return (
                <button
                  key={layer.id}
                  type="button"
                  aria-pressed={active}
                  className={active ? "side-toggle active" : "side-toggle"}
                  onClick={() => toggleLayer(layer.id)}
                >
                  <div className="side-toggle-row">
                    <span className="swatch" style={{ background: layer.color }} />
                    <strong>{localize(lang, layer.label)}</strong>
                    <span className="toggle-state">{active ? "ON" : "OFF"}</span>
                  </div>
                  <small>{detail}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="side-section">
          <span className="eyebrow">{lang === "th" ? "ภาพดาวเทียม" : "Satellite Feeds"}</span>
          <div className="toggle-stack">
            {satelliteToggleOptions.map((item) => {
              const active = layers.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  className={active ? "side-toggle active satellite" : "side-toggle satellite"}
                  onClick={() => toggleSatelliteLayer(item.id)}
                >
                  <div className="side-toggle-row">
                    <span className="swatch" style={{ background: item.color }} />
                    <strong>{localize(lang, item.label)}</strong>
                    <span className="toggle-state">{active ? "ON" : "OFF"}</span>
                  </div>
                  <small>{localize(lang, item.detail)}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="side-section side-filter-group">
          <label className="stack-field">
            <span className="eyebrow">City</span>
            <select value={city} onChange={(event) => updateParam("city", event.target.value)}>
              {overview.cities.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {localize(lang, item.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="side-section side-filter-group">
          <label className="stack-field">
            <span className="eyebrow">{lang === "th" ? "เขต / อำเภอ" : "District / Zone"}</span>
            <select
              value={district}
              onChange={(event) => updateParam("district", event.target.value)}
              disabled={cityDistricts.length === 0 || view === "national"}
            >
              <option value="">{lang === "th" ? "ทั้งเมือง" : "Citywide"}</option>
              {cityDistricts.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {localize(lang, item.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="side-section side-filter-group">
          <label className="stack-field">
            <span className="eyebrow">Domain</span>
            <select value={domain} onChange={(event) => updateParam("domain", event.target.value)}>
              <option value="">All</option>
              {overview.domains.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {localize(lang, item.title)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="side-section side-live-rail">
          <span className="eyebrow">{copy.liveWatch}</span>

          {topAqiFeature ? (
            <button
              type="button"
              className="side-watch"
              onClick={() =>
                focusCityWithLayer(String(topAqiFeature.properties.city).toLowerCase().replace(/\s+/g, "-"), "pollution")
              }
            >
              <span className="eyebrow">{copy.airHotspot}</span>
              <strong>{`${topAqiFeature.title} AQI ${numericProperty(topAqiFeature, "aqi")}`}</strong>
              <small>{`${numericProperty(topAqiFeature, "pm25")} PM2.5 | ${numericProperty(topAqiFeature, "pm10")} PM10`}</small>
            </button>
          ) : null}

          {hottestWeatherFeature ? (
            <button
              type="button"
              className="side-watch"
              onClick={() =>
                focusCityWithLayer(String(hottestWeatherFeature.properties.city).toLowerCase().replace(/\s+/g, "-"), "weather")
              }
            >
              <span className="eyebrow">{copy.weatherHotspot}</span>
              <strong>{`${hottestWeatherFeature.title} ${numericProperty(hottestWeatherFeature, "temperatureC")}C`}</strong>
              <small>{`${numericProperty(hottestWeatherFeature, "humidity")}% humidity`}</small>
            </button>
          ) : null}

          {latestExternalSignal ? (
            <a
              className="side-watch linked"
              href={latestExternalSignal.source.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className="eyebrow">{copy.latestSignal}</span>
              <strong>{localize(lang, latestExternalSignal.title)}</strong>
              <small>{latestExternalSignal.source.sourceName}</small>
            </a>
          ) : null}

          <div className="side-watch">
            <span className="eyebrow">{copy.syncWindow}</span>
            <strong>{formatUtcClock(latestSyncSource?.lastCheckedAt)} UTC</strong>
            <small>{`Next ${formatUtcClock(nextGlobalSyncAt)} UTC`}</small>
          </div>
        </div>
      </aside>

      {!assistantOpen ? (
        <button type="button" className="assistant-edge-tab" onClick={() => setAssistantOpen(true)}>
          <span>AI</span>
          <small>{copy.askAssistant}</small>
        </button>
      ) : null}

      {assistantOpen ? (
        <>
          <button
            type="button"
            className="assistant-scrim"
            aria-label={copy.askClose}
            onClick={() => setAssistantOpen(false)}
          />
          <aside className="assistant-drawer" aria-label={copy.askAssistant}>
            <div className="assistant-header">
              <div>
                <span className="eyebrow">{copy.askAssistant}</span>
                <strong>{copy.askGrounding}</strong>
              </div>
              <button type="button" className="chip" onClick={() => setAssistantOpen(false)}>
                {copy.askClose}
              </button>
            </div>

            <div className="assistant-context">
              <span className="eyebrow">{copy.askContext}</span>
              <div className="pill-list compact">
                {assistantContextTags.map((item) => (
                  <span key={item} className="stack-pill">
                    {item}
                  </span>
                ))}
                <span className="stack-pill subdued">
                  {(assistantResponse?.geminiReady || assistantStatus?.geminiReady) ? copy.askGeminiReady : copy.askLocalOnly}
                </span>
              </div>
            </div>

            <div className="assistant-question-map">
              <div className="assistant-map-header">
                <span className="eyebrow">{copy.askQuestionMap}</span>
                <p>{copy.askQuestionMapNote}</p>
              </div>
              <div className="assistant-cluster-list tile-scroll">
                {resolvedQuestionClusters.map((cluster) => (
                  <section key={cluster.id} className="assistant-cluster">
                    <div className="assistant-cluster-head">
                      <strong>{cluster.title}</strong>
                      <small>{cluster.sourceNote}</small>
                    </div>
                    <div className="assistant-prompt-list">
                      {cluster.prompts.map((prompt) => (
                        <button
                          key={`${cluster.id}-${prompt}`}
                          type="button"
                          className="assistant-prompt-chip"
                          onClick={() => setAssistantQuestion(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="assistant-form">
              <textarea
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
                placeholder={copy.askPlaceholder}
                rows={4}
              />
              <button
                type="button"
                className="share-button"
                onClick={() => void askAssistant()}
                disabled={assistantLoading || assistantQuestion.trim() === ""}
              >
                {assistantLoading ? "…" : copy.askSubmit}
              </button>
            </div>

            <div className="assistant-panel tile-scroll">
              {assistantError ? <p className="assistant-error">{assistantError}</p> : null}

              {assistantResponse ? (
                <>
                  <div className="assistant-answer">
                    <p className="eyebrow">{assistantResponse.provider}</p>
                    <p>{localize(lang, assistantResponse.contextSummary)}</p>
                    <strong>{localize(lang, assistantResponse.answer)}</strong>
                  </div>

                  <div className="assistant-citations">
                    <span className="eyebrow">{copy.askSources}</span>
                    {assistantResponse.citations.length > 0 ? (
                      assistantResponse.citations.map((citation) => (
                        <article key={citation.id} className="assistant-citation">
                          <div className="stack-title">
                            <strong>{citation.documentTitle}</strong>
                            <span className="status-pill">{citation.pageLabel ?? "doc"}</span>
                          </div>
                          <p>{citation.excerpt}</p>
                          <small>{citation.fileName}</small>
                        </article>
                      ))
                    ) : (
                      <p className="assistant-empty">{copy.askNoAnswer}</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="assistant-empty">{copy.askNoAnswer}</p>
              )}
            </div>
          </aside>
        </>
      ) : null}

      {manualOpen ? (
        <>
          <button
            type="button"
            className="utility-scrim"
            aria-label={uiText.screenshotManual}
            onClick={() => setManualOpen(false)}
          />
          <aside className="utility-panel manual-panel" aria-label={uiText.screenshotManual}>
            <div className="utility-panel-header">
              <div>
                <span className="eyebrow">{uiText.screenshotManual}</span>
                <strong>{lang === "th" ? "คู่มือสำหรับเดโมและสไลด์" : "Manual for demos and slides"}</strong>
              </div>
              <button type="button" className="chip" onClick={() => setManualOpen(false)}>
                {copy.askClose}
              </button>
            </div>

            <div className="utility-panel-note">
              <p>
                {lang === "th"
                  ? "ใช้ปุ่มด้านล่างเพื่อจัดฉากภาพที่อ่านง่ายและพร้อมสำหรับสกรีนช็อต โดยระบบจะเปลี่ยน basemap, layers, และช่วงเวลาให้ทันที"
                  : "Use the scene buttons below to stage clean demo screenshots. The dashboard will switch the basemap, layers, and time window automatically."}
              </p>
            </div>

            <div className="manual-scene-list tile-scroll">
              {screenshotManualScenes.map((scene) => (
                <article key={scene.id} className="manual-scene-card">
                  <div className="stack-title">
                    <strong>{localize(lang, scene.title)}</strong>
                    <span className="status-pill">{scene.state.timeRange}</span>
                  </div>
                  <p>{localize(lang, scene.detail)}</p>
                  <small>
                    {uiText.shot}: {localize(lang, scene.shot)}
                  </small>
                  <div className="pill-list compact">
                    {scene.state.layers.map((layerId) => {
                      const layerLabel =
                        satelliteToggleOptions.find((item) => item.id === layerId)?.label ??
                        layerSeed.find((item) => item.id === layerId)?.label;
                      return (
                        <span key={`${scene.id}-${layerId}`} className="stack-pill">
                          {layerLabel ? localize(lang, layerLabel) : layerId}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="share-button"
                    onClick={() => {
                      applyDashboardScene(scene.state);
                      setManualOpen(false);
                    }}
                  >
                    {uiText.applyScene}
                  </button>
                </article>
              ))}
            </div>
          </aside>
        </>
      ) : null}

      {opsDrawerState ? (
        <>
          <button
            type="button"
            className="utility-scrim"
            aria-label={uiText.openDrawer}
            onClick={() => setOpsDrawerState(null)}
          />
          <aside className="utility-panel ops-panel" aria-label={uiText.openDrawer}>
            <div className="utility-panel-header">
              <div>
                <span className="eyebrow">{uiText.openDrawer}</span>
                <strong>{opsDrawerState.title}</strong>
                <small>{opsDrawerState.subtitle}</small>
              </div>
              <button type="button" className="chip" onClick={() => setOpsDrawerState(null)}>
                {copy.askClose}
              </button>
            </div>

            <div className="utility-panel-note">
              <p>{opsDrawerState.reason}</p>
              <div className="pill-list compact">
                <span className="stack-pill">{`${uiText.confidence} ${Math.round(opsDrawerState.confidence * 100)}%`}</span>
                <span className="stack-pill">{opsDrawerState.sourceLabel}</span>
                <span className="stack-pill">{`${uiText.liveWindow}: ${timeRange}`}</span>
              </div>
            </div>

            <div className="utility-section">
              <div className="card-header">
                <span className="eyebrow">{copy.placeLookup}</span>
                <span className="status-pill">{localize(lang, drawerCity.name)}</span>
              </div>
              <div className="utility-stat-grid">
                <div className="utility-stat">
                  <span className="eyebrow">{copy.population}</span>
                  <strong>{formatPopulation(drawerCity.population)}</strong>
                </div>
                <div className="utility-stat">
                  <span className="eyebrow">{copy.region}</span>
                  <strong>{localize(lang, drawerCity.region)}</strong>
                </div>
                <div className="utility-stat">
                  <span className="eyebrow">{uiText.compareMode}</span>
                  <strong>{timeCompareEnabled ? uiText.compareWindow : uiText.compareWindowOff}</strong>
                </div>
              </div>
            </div>

            <div className="utility-section">
              <span className="eyebrow">{uiText.drawerSatellite}</span>
              <div className="pill-list compact">
                <span className="stack-pill">{basemap === "satellite" ? copy.mapSatellite : copy.mapAtlas}</span>
                {drawerSatelliteLayers.map((item) => (
                  <span key={`drawer-layer-${item.id}`} className="stack-pill">
                    {localize(lang, item.label)}
                  </span>
                ))}
              </div>
            </div>

            <div className="utility-section">
              <span className="eyebrow">{uiText.drawerProjects}</span>
              <div className="utility-link-list">
                {drawerProjects.length > 0 ? (
                  drawerProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className="utility-link-card"
                      onClick={() => applyDashboardScene({ view: "city", city: project.citySlug, layers: ["projects", "news", "weather"] })}
                    >
                      <strong>{localize(lang, project.title)}</strong>
                      <small>{localize(lang, project.nextMilestone)}</small>
                    </button>
                  ))
                ) : (
                  <div className="utility-link-card static">
                    <strong>{lang === "th" ? "ยังไม่มีโครงการเฉพาะเมือง" : "No city-specific projects yet"}</strong>
                    <small>{localize(lang, drawerCity.focus)}</small>
                  </div>
                )}
              </div>
            </div>

            <div className="utility-section">
              <span className="eyebrow">{uiText.drawerNews}</span>
              <div className="utility-link-list">
                {drawerNews.length > 0 ? (
                  drawerNews.map((item) => (
                    <a key={item.id} className="utility-link-card" href={item.source.sourceUrl} target="_blank" rel="noreferrer">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </a>
                  ))
                ) : (
                  <div className="utility-link-card static">
                    <strong>{lang === "th" ? "ยังไม่มีข่าวเฉพาะเมือง" : "No city-specific news yet"}</strong>
                    <small>{lang === "th" ? "ใช้ global signals เป็นบริบทเสริม" : "Use global signals as supporting context."}</small>
                  </div>
                )}
              </div>
            </div>

            <div className="utility-section">
              <span className="eyebrow">{uiText.sourceFreshness}</span>
              <div className="utility-link-list">
                {drawerSources.map((source) => (
                  <a key={source.id} className="utility-link-card" href={source.url} target="_blank" rel="noreferrer">
                    <strong>{source.name}</strong>
                    <small>{`${source.freshnessStatus} • ${formatUtcClock(source.lastCheckedAt)} UTC`}</small>
                  </a>
                ))}
              </div>
            </div>

            <div className="utility-section">
              <span className="eyebrow">{uiText.groundTruth}</span>
              <div className="utility-link-list">
                {drawerGroundTruthLinks.map((item) => (
                  <a key={item.id} className="utility-link-card" href={item.url} target="_blank" rel="noreferrer">
                    <strong>{localize(lang, item.label)}</strong>
                    <small>{localize(lang, item.note)}</small>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <main className="dashboard-shell workspace-shell">
        <section className="card command-card" id="command-bar">
          <div className="card-header">
            <span className="eyebrow">{uiText.commandBar}</span>
            <span className="status-pill">{`${commandAlerts.length} ${lang === "th" ? "รายการ" : "alerts"}`}</span>
          </div>
          <div className="command-grid">
            {commandAlerts.map((item) => (
              <button
                key={item.id}
                type="button"
                className="command-alert"
                onClick={() => {
                  applyDashboardScene({
                    view:
                      item.layers.includes("eo-precipitation") ||
                      item.layers.includes("jaxa-rainfall") ||
                      item.layers.includes("smart-city-thailand")
                        ? "national"
                        : "city",
                    city: item.citySlug,
                    basemap: item.basemap,
                    layers: item.layers
                  });
                  openOpsDrawer({
                    title: item.title,
                    subtitle: item.location,
                    citySlug: item.citySlug,
                    reason: item.reason,
                    layers: item.layers,
                    sourceLabel: item.freshness,
                    confidence: item.confidence
                  });
                }}
              >
                <div className="command-alert-head">
                  <span className="eyebrow">{item.location}</span>
                  <span className="status-pill">{item.freshness}</span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <div className="pill-list compact">
                  {item.layers.map((layerId) => {
                    const layerLabel =
                      satelliteToggleOptions.find((candidate) => candidate.id === layerId)?.label ??
                      layerSeed.find((candidate) => candidate.id === layerId)?.label;
                    return (
                      <span key={`${item.id}-${layerId}`} className="stack-pill">
                        {layerLabel ? localize(lang, layerLabel) : layerId}
                      </span>
                    );
                  })}
                  <span className="stack-pill">{`${uiText.confidence} ${Math.round(item.confidence * 100)}%`}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card map-hero" id="map">
          <div className="card-header">
            <span className="eyebrow">{copy.map}</span>
            <span className="status-pill">
              {view === "national"
                ? layers.includes("smart-city-thailand")
                  ? "Thailand Coverage"
                  : "Thailand"
                : localize(lang, selectedCity.name)}
            </span>
          </div>

          <div className="thai-map">
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
              recenterSignal={recenterSignal}
            />
            <div className="map-overlay">
              <div className="map-caption">
                <strong>
                  {view === "national"
                    ? "Thailand"
                    : selectedDistrict
                      ? `${localize(lang, selectedCity.name)} / ${localize(lang, selectedDistrict.name)}`
                      : localize(lang, selectedCity.name)}
                </strong>
                <span>
                  {view === "national"
                    ? "Smart City coverage footprint"
                    : selectedDistrict
                      ? localize(lang, selectedDistrict.priority)
                      : localize(lang, selectedCity.region)}
                </span>
              </div>
              <span className="map-open-link">
                {`${basemap === "satellite" ? copy.mapSatellite : copy.mapAtlas} · ${activeSatelliteLayers.length} ${lang === "th" ? "ชั้นภาพ" : "overlays"}`}
              </span>
            </div>
          </div>

          <div className="hotspot-strip">
            {topAqiFeature ? (
              <button
                type="button"
                className="hotspot-chip warning"
                onClick={() => {
                  focusCityWithLayer(topAqiCitySlug || city, "pollution");
                  openCityOpsDrawer(
                    topAqiCitySlug || city,
                    lang === "th"
                      ? "จุดนี้เป็น AQI hotspot ที่ควรอ่านคู่กับ aerosol และ weather"
                      : "This hotspot should be read together with aerosol and weather.",
                    ["pollution", "weather", "eo-aerosol"]
                  );
                }}
              >
                <span className="eyebrow">{copy.airHotspot}</span>
                <strong>{`${topAqiFeature.title} AQI ${numericProperty(topAqiFeature, "aqi")}`}</strong>
                <small>{copy.clickToFocus}</small>
              </button>
            ) : null}

            {hottestWeatherFeature ? (
              <button
                type="button"
                className="hotspot-chip"
                onClick={() => {
                  focusCityWithLayer(hottestCitySlug || city, "weather");
                  openCityOpsDrawer(
                    hottestCitySlug || city,
                    lang === "th"
                      ? "จุดนี้เป็น heat watch และควรเทียบกับชั้น vegetation"
                      : "This heat watch should be compared with vegetation context.",
                    ["weather", "eo-vegetation", "resilience"]
                  );
                }}
              >
                <span className="eyebrow">{copy.weatherHotspot}</span>
                <strong>{`${hottestWeatherFeature.title} ${numericProperty(hottestWeatherFeature, "temperatureC")}C`}</strong>
                <small>{`${numericProperty(hottestWeatherFeature, "humidity")}% humidity`}</small>
              </button>
            ) : null}

            {latestExternalSignal ? (
              <button
                type="button"
                className="hotspot-chip"
                onClick={() => {
                  const preset = focusPresets.find((item) => item.id === "media-watch");
                  preset?.run();
                }}
              >
                <span className="eyebrow">{copy.mediaHotspot}</span>
                <strong>{socialListening.mentionCount} mentions</strong>
                <small>{socialListening.dominantSource}</small>
              </button>
            ) : null}
          </div>

          <div className="hero-toolbar">
            <div className="hero-toolbar-group">
              <div className="focus-preset-group">
                <span className="eyebrow">{copy.focusPresets}</span>
                <div className="pill-list compact">
                  {focusPresets.map((preset) => {
                    const presetActive =
                      preset.layers.length === layers.length && preset.layers.every((item) => layers.includes(item));

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={presetActive ? "chip active" : "chip"}
                        onClick={preset.run}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="map-stack-group">
                <span className="eyebrow">{copy.satelliteMapStack}</span>
                <div className="pill-list compact">
                  <button
                    type="button"
                    className={basemap === "atlas" ? "chip active" : "chip"}
                    onClick={() => updateParam("basemap", "atlas")}
                  >
                    {copy.mapAtlas}
                  </button>
                  <button
                    type="button"
                    className={basemap === "satellite" ? "chip active" : "chip"}
                    onClick={() => updateParam("basemap", "satellite")}
                  >
                    {copy.mapSatellite}
                  </button>
                  <button className="chip" type="button" onClick={() => setRecenterSignal((value) => value + 1)}>
                    {copy.recenter}
                  </button>
                </div>
              </div>
              <div className="map-city-list">
                {overview.cities.map((item) => (
                  <button
                    key={item.slug}
                    className={item.slug === city ? "map-city-button active" : "map-city-button"}
                    onClick={() => {
                      const next = buildStableParams();
                      next.set("city", item.slug);
                      next.set("view", "city");
                      next.delete("district");
                      startTransition(() => {
                        setSearchParams(next);
                        setRecenterSignal((v) => v + 1);
                      });
                      openCityOpsDrawer(
                        item.slug,
                        lang === "th"
                          ? "เปิด drawer นี้เพื่ออธิบายเมืองที่เลือกพร้อมข่าว โครงการ และชั้นภาพที่เกี่ยวข้อง"
                          : "Open this drawer for the selected city with related projects, news, and map layers.",
                        layers
                      );
                    }}
                  >
                    {localize(lang, item.name)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="chip"
                onClick={() =>
                  openCityOpsDrawer(
                    selectedCity.slug,
                    lang === "th"
                      ? "คำอธิบายนี้สรุปว่าทำไมมุมมองปัจจุบันจึงสำคัญ"
                      : "This explanation summarizes why the current view matters.",
                    layers
                  )
                }
              >
                {uiText.openDrawer}
              </button>
              {layers.includes("smart-city-thailand") ? (
                <label className="coverage-filter">
                  <span className="eyebrow">Coverage Domain</span>
                  <select value={domain} onChange={(event) => updateParam("domain", event.target.value)}>
                    <option value="">{`All (${coverageFeatureCount})`}</option>
                    {overview.domains.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {`${localize(lang, item.title)} (${coverageCountsByDomain.get(item.slug) ?? 0})`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <span className="hero-note">
              {lang === "th"
                ? `Ops room • ${selectedDistrict ? localize(lang, selectedDistrict.name) : localize(lang, selectedCity.name)} • ชั้นภาพดาวเทียม ${activeSatelliteLayers.length} ชั้น`
                : `Ops room • ${selectedDistrict ? localize(lang, selectedDistrict.name) : localize(lang, selectedCity.name)} • ${activeSatelliteLayers.length} satellite layer${activeSatelliteLayers.length === 1 ? "" : "s"} active`}
            </span>
          </div>

          <div className="map-legend">
            <div className="legend-inline-group">
              <span className="eyebrow">{copy.aqiScale}</span>
              <div className="legend-scale">
                {[
                  { label: "Good", color: "#16a34a" },
                  { label: "Watch", color: "#f59e0b" },
                  { label: "High", color: "#dc2626" },
                  { label: "Severe", color: "#b91c1c" }
                ].map((item) => (
                  <div key={item.label} className="legend-chip">
                    <span className="legend-swatch" style={{ background: item.color }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-inline-group">
              <span className="eyebrow">{copy.activeLayersLegend}</span>
              <div className="active-layer-pills">
                {activeLegendItems.map((item) => (
                  <div key={item.id} className="active-layer-pill" title={item.detail}>
                    <span className="legend-swatch" style={{ background: item.color }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="city-intel">
            <div className="card-header">
              <span className="eyebrow">{copy.placeLookup}</span>
              <span className="status-pill">{localize(lang, selectedCity.name)}</span>
            </div>
            <div className="city-intel-grid">
              <div className="city-intel-stat">
                <span className="eyebrow">{copy.population}</span>
                <strong>{formatPopulation(selectedCity.population)}</strong>
              </div>
              <div className="city-intel-stat">
                <span className="eyebrow">{copy.region}</span>
                <strong>{localize(lang, selectedCity.region)}</strong>
              </div>
              <div className="city-intel-stat">
                <span className="eyebrow">{lang === "th" ? "เขตที่เลือก" : "District focus"}</span>
                <strong>{selectedDistrict ? localize(lang, selectedDistrict.name) : (lang === "th" ? "ทั้งเมือง" : "Citywide")}</strong>
                <small>{selectedDistrict ? selectedDistrict.riskLevel.toUpperCase() : (lang === "th" ? "ไม่มีการเจาะพื้นที่" : "No sub-city filter")}</small>
              </div>
              <div className="city-intel-stat">
                <span className="eyebrow">{lang === "th" ? "คิวตัดสินใจ" : "Decision queue"}</span>
                <strong>{decisionItems.length}</strong>
                <small>{decisionItems[0] ? `${lang === "th" ? "ถัดไป" : "Next"} ${formatUtcClock(decisionItems[0].dueAt)} UTC` : (lang === "th" ? "ไม่มีรายการ" : "No queued actions")}</small>
              </div>
              <div className="city-intel-focus">
                <span className="eyebrow">{copy.smartFocus}</span>
                <p>{selectedDistrict ? localize(lang, selectedDistrict.focus) : localize(lang, selectedCity.focus)}</p>
              </div>
              <div className="city-intel-focus">
                <span className="eyebrow">{copy.leadingDomains}</span>
                <div className="pill-list compact">
                  {topCityScores.map((item) => (
                    <span key={item.domainSlug} className="stack-pill">
                      {item.domain ? `${localize(lang, item.domain.title)} ${item.score}` : `${item.domainSlug} ${item.score}`}
                    </span>
                  ))}
                </div>
              </div>
              {selectedDistrict ? (
                <div className="city-intel-focus">
                  <span className="eyebrow">{lang === "th" ? "พื้นที่ต้องจับตา" : "Watchpoints"}</span>
                  <div className="terminal-list district-watch-list">
                    {selectedDistrict.watchpoints.map((item, index) => (
                      <p key={`${selectedDistrict.id}-${index}`}>{localize(lang, item)}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card workspace-story command-center-hero">
          <div className="card-header">
            <span className="eyebrow">{lang === "th" ? "Command fabric" : "Command Fabric"}</span>
            <span className="status-pill">{formatUtcClock(commandCenter.updatedAt)} UTC</span>
          </div>
          <div className="command-center-lead">
            <div className="workspace-story-copy command-center-copy">
              <h2>{workspaceTitle}</h2>
              <p>{localize(lang, commandCenter.mission)}</p>
              <p>{workspaceNarrative}</p>
              <div className="pill-list compact">
                <span className="stack-pill">{localize(lang, commandCenter.zoneLabel)}</span>
                <span className="stack-pill">{`${connectorReadyCount}/${commandConnectors.length} ${lang === "th" ? "connectors ready" : "connectors ready"}`}</span>
                <span className="stack-pill">{`${sensorFeeds.length} ${lang === "th" ? "sensor slots" : "sensor slots"}`}</span>
                <span className="stack-pill">{`${openReporterCount} ${lang === "th" ? "open reports" : "open reports"}`}</span>
              </div>
            </div>
            <div className="workspace-stat-grid command-metric-grid">
              {commandCenter.metrics.map((metric) => (
                <article key={metric.id} className={`workspace-stat command-metric-card tone-${metric.tone}`}>
                  <span className="eyebrow">{localize(lang, metric.label)}</span>
                  <strong>{metric.value}</strong>
                  <small>{localize(lang, metric.detail)}</small>
                </article>
              ))}
            </div>
          </div>
          <div className="runway-grid">
            {expansionTracks.map((track) => (
              <article key={track.id} className={`runway-card stage-${track.stage}`}>
                <div className="stack-title">
                  <strong>{localize(lang, track.title)}</strong>
                  <span className={`status-tag ${track.stage === "base" ? "live" : track.stage === "next" ? "pilot" : "manual"}`}>
                    {track.stage}
                  </span>
                </div>
                <p>{localize(lang, track.detail)}</p>
                <div className="pill-list compact">
                  {track.systems.map((item) => (
                    <span key={`${track.id}-${item}`} className="stack-pill">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="workspace-grid command-center-grid">
          <section className="card workspace-module camera-module">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "CCTV AI samples" : "CCTV AI Samples"}</span>
              <span className="status-pill">{lang === "th" ? "camera lanes" : "camera lanes"}</span>
            </div>
            <div className="module-summary">
              <strong>{lang === "th" ? "ตัวอย่างกล้องพร้อม schema ที่ต่อสู่ระบบจริงได้ทันที" : "Camera lanes staged with contracts ready for the live feed"}</strong>
              <small>
                {lang === "th"
                  ? "แต่ละการ์ดมี camera id, model, confidence, event time และ target layers เพื่อให้ต่อเข้ากับ inference service ได้ภายหลัง"
                  : "Each card carries camera id, model, confidence, event time, and target layers so we can wire it into an inference service later."}
              </small>
            </div>
            <div className="cctv-grid">
              {cctvSamples.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`cctv-card severity-${item.severity}`}
                  onClick={() => {
                    applyDashboardScene({
                      view: "city",
                      city: selectedCity.slug,
                      basemap: "atlas",
                      layers: Array.from(new Set([...layers, ...item.targetLayers]))
                    });
                    openCityOpsDrawer(selectedCity.slug, localize(lang, item.detail), item.targetLayers);
                  }}
                >
                  <div className="cctv-head">
                    <div>
                      <span className="eyebrow">{item.cameraId}</span>
                      <strong>{localize(lang, item.detection)}</strong>
                    </div>
                    <span className={`status-tag ${item.severity === "alert" ? "delayed" : item.severity === "watch" ? "watch" : "live"}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="signal-thumb">
                    <span>{localize(lang, item.zone)}</span>
                  </div>
                  <p>{localize(lang, item.detail)}</p>
                  <div className="signal-meta">
                    <span>{`${uiText.confidence} ${formatConfidence(item.confidence)}`}</span>
                    <span>{item.model}</span>
                    <span>{`${formatUtcClock(item.capturedAt)} UTC`}</span>
                  </div>
                  <div className="pill-list compact">
                    <span className="stack-pill">{localize(lang, item.status)}</span>
                    {item.targetLayers.map((layerId) => {
                      const layerLabel =
                        satelliteToggleOptions.find((candidate) => candidate.id === layerId)?.label ??
                        layerSeed.find((candidate) => candidate.id === layerId)?.label;
                      return (
                        <span key={`${item.id}-${layerId}`} className="stack-pill">
                          {layerLabel ? localize(lang, layerLabel) : layerId}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="card workspace-module sensor-module">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "Sensor spine" : "Sensor Spine"}</span>
              <span className="status-pill">{lang === "th" ? "field slots" : "field slots"}</span>
            </div>
            <div className="module-summary">
              <strong>{lang === "th" ? "จัดพื้นที่สำหรับ traffic, crowd, parking, water, และ air nodes" : "Reserved space for traffic, crowd, parking, water, and air nodes"}</strong>
              <small>
                {lang === "th"
                  ? "ส่วนนี้คือฐานหลังบ้านสำหรับรับ sensor buses และอ่านคู่กับ layers บนแผนที่"
                  : "This is the backend-facing spine for sensor buses that should read directly against the map layers."}
              </small>
            </div>
            <div className="sensor-feed-list">
              {sensorFeeds.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sensor-feed-card status-${item.status}`}
                  onClick={() => {
                    applyDashboardScene({
                      view: "city",
                      city: selectedCity.slug,
                      basemap: item.category === "water" ? "satellite" : "atlas",
                      layers: Array.from(new Set([...layers, ...item.targetLayers]))
                    });
                    openCityOpsDrawer(selectedCity.slug, localize(lang, item.detail), item.targetLayers);
                  }}
                >
                  <div className="sensor-feed-head">
                    <div>
                      <span className="eyebrow">{item.sourceLabel}</span>
                      <strong>{localize(lang, item.label)}</strong>
                    </div>
                    <span className={`status-tag ${item.status === "live" ? "live" : item.status === "ready" ? "pilot" : item.status === "pilot" ? "watch" : "manual"}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="sensor-feed-value">{item.value}</div>
                  <p>{localize(lang, item.detail)}</p>
                  <div className="signal-meta">
                    <span>{localize(lang, item.zone)}</span>
                    <span>{item.cadence}</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="pill-list compact">
                    {item.targetLayers.map((layerId) => {
                      const layerLabel =
                        satelliteToggleOptions.find((candidate) => candidate.id === layerId)?.label ??
                        layerSeed.find((candidate) => candidate.id === layerId)?.label;
                      return (
                        <span key={`${item.id}-${layerId}`} className="stack-pill">
                          {layerLabel ? localize(lang, layerLabel) : layerId}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="card workspace-module reporter-module">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "City reporter issues" : "City Reporter Issues"}</span>
              <span className="status-pill">city-reporter-line-bot</span>
            </div>
            <div className="module-summary">
              <strong>{lang === "th" ? "ดึง status model และ ticket vocabulary มาจาก city reporter bot" : "Status model and ticket vocabulary brought over from the city reporter bot"}</strong>
              <small>
                {lang === "th"
                  ? "ใช้ received, assigned, in_progress, completed เหมือน dashboard ต้นทาง เพื่อให้สองระบบอ่านสถานะตรงกัน"
                  : "Using `received`, `assigned`, `in_progress`, and `completed` so both systems share the same operational language."}
              </small>
            </div>
            <div className="report-list">
              {reporterSamples.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="report-card"
                  onClick={() => {
                    applyDashboardScene({
                      view: "city",
                      city: selectedCity.slug,
                      basemap: "atlas",
                      layers: Array.from(new Set([...layers, ...item.targetLayers]))
                    });
                    openCityOpsDrawer(selectedCity.slug, localize(lang, item.aiSummary), item.targetLayers);
                  }}
                >
                  <div className="report-top">
                    <div>
                      <span className="eyebrow">{item.ticketNumber}</span>
                      <strong>{localize(lang, item.problemType)}</strong>
                    </div>
                    <span className={`status-tag ${reporterStatusMeta[item.status].tone}`}>{reporterStatusMeta[item.status].label}</span>
                  </div>
                  <p>{localize(lang, item.description)}</p>
                  <div className="report-meta">
                    <span>{item.locationText}</span>
                    <span>{item.teamName}</span>
                    <span>{item.staffName}</span>
                    <span>{`${formatUtcClock(item.createdAt)} UTC`}</span>
                  </div>
                  <div className="pill-list compact">
                    <span className={`urgency-pill urgency-${item.urgency}`}>{item.urgency}</span>
                    <span className="stack-pill">{reporterStatusMeta[item.status].detail}</span>
                    {item.matchedCameraId ? <span className="stack-pill">{item.matchedCameraId}</span> : null}
                  </div>
                  <small>{localize(lang, item.aiSummary)}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="card workspace-module integration-fabric-module">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "Imported API fabric" : "Imported API Fabric"}</span>
              <span className="status-pill">{`${connectorReadyCount}/${commandConnectors.length}`}</span>
            </div>
            <div className="module-summary">
              <strong>{lang === "th" ? "สรุป endpoint และ logic ที่ยกมาจากโปรเจกต์อื่น" : "Endpoint and logic inventory brought in from your other projects"}</strong>
              <small>
                {lang === "th"
                  ? "ชั้นนี้ทำให้ command center มีที่เผื่อสำหรับการเชื่อมต่อระยะยาว ไม่ใช่แค่ mock cards"
                  : "This turns the command center into a long-lived integration surface, not just a set of mock cards."}
              </small>
            </div>
            <div className="connector-grid">
              {commandConnectors.map((item) => (
                <article key={item.id} className={`connector-card status-${item.status}`}>
                  <div className="connector-head">
                    <div>
                      <span className="eyebrow">{item.project}</span>
                      <strong>{item.title}</strong>
                    </div>
                    <span className={`status-tag ${item.status === "live" ? "live" : item.status === "ready" ? "pilot" : item.status === "pilot" ? "watch" : "manual"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p>{localize(lang, item.detail)}</p>
                  <div className="connector-meta">
                    <span>{item.route ?? (lang === "th" ? "reserved bridge" : "reserved bridge")}</span>
                    <span>{item.cadence}</span>
                    <span>{item.auth}</span>
                  </div>
                  <div className="pill-list compact">
                    {item.systems.map((system) => (
                      <span key={`${item.id}-${system}`} className="stack-pill">
                        {system}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card workspace-module boards-lane">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "AI board status" : "AI Board Status"}</span>
              <span className="status-pill">{lang === "th" ? "integration layer" : "integration layer"}</span>
            </div>
            <div className="module-summary">
              <strong>{lang === "th" ? "บอร์ดสถานะที่เตรียมรวม CCTV กับ city reporter เข้าด้วยกัน" : "Board states staged to unify CCTV and city-reporter workflows"}</strong>
              <small>
                {lang === "th"
                  ? "ส่วนนี้ทำหน้าที่เป็น bridge ระหว่าง AI detections, public reports, และ command decisions"
                  : "This lane acts as the bridge between AI detections, public reports, and command decisions."}
              </small>
            </div>
            <div className="board-list">
              {integrationBoards.map((item) => (
                <article key={item.id} className={`board-card ${item.status}`}>
                  <div className="stack-title">
                    <strong>{item.title}</strong>
                    <span className={`status-tag ${item.status === "live" ? "live" : item.status === "watch" ? "watch" : item.status === "pilot" ? "active" : "manual"}`}>{item.status}</span>
                  </div>
                  <div className="board-metric">{item.metric}</div>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
            <div className="merge-list">
              <div className="stack-title">
                <strong>{lang === "th" ? "Merge queue" : "Merge Queue"}</strong>
                <span className="status-pill">{mergeQueue.length}</span>
              </div>
              {mergeQueue.map((item) => (
                <div key={item.id} className="merge-item">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{`${uiText.confidence} ${formatConfidence(item.confidence)}`}</small>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-board">
          <section className="card hero-card" id="pulse">
            <div className="card-header">
              <span className="eyebrow">{copy.topLine}</span>
              <span className="status-pill">
                {copy.sync}: {overview.updatedAt.slice(11, 19)} UTC
              </span>
            </div>
            <div className="terminal-callout">
              <span className="eyebrow">Decision Signal</span>
              <strong>{executiveSignal}</strong>
            </div>
            <div className="metric-grid">
              {overview.metrics.map((metric, index) => (
                <article key={metric.id} className={`metric-card tone-${metric.tone}`}>
                  <div>
                    <p className="metric-label">{localize(lang, metric.label)}</p>
                    <p className="metric-value">
                      {metric.displayValue}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </p>
                  </div>
                  <p className="metric-delta">{localize(lang, metric.deltaText)}</p>
                  <Sparkline values={[24 + index * 8, 42 + index * 4, 38 + index * 6, 70 - index * 4]} />
                </article>
              ))}
            </div>
            <div className="selection-strip">
              <div>
                <span className="eyebrow">City Focus</span>
                <strong>{localize(lang, selectedCity.name)}</strong>
                <p>{localize(lang, selectedCity.focus)}</p>
              </div>
              <div>
                <span className="eyebrow">{lang === "th" ? "เขต / พื้นที่" : "District Focus"}</span>
                <strong>{selectedDistrict ? localize(lang, selectedDistrict.name) : (lang === "th" ? "ทั้งเมือง" : "Citywide")}</strong>
                <p>{selectedDistrict ? localize(lang, selectedDistrict.priority) : (lang === "th" ? "ยังไม่ได้เจาะลงพื้นที่ย่อย" : "No sub-city drilldown selected.")}</p>
              </div>
              <div>
                <span className="eyebrow">Domain Focus</span>
                <strong>{selectedDomain ? localize(lang, selectedDomain.title) : copy.topLine}</strong>
                <p>{selectedDomain ? localize(lang, selectedDomain.description) : localize(lang, overview.briefing.body)}</p>
              </div>
            </div>
            <div className="change-grid">
              {changes.items.map((item) => (
                <article key={item.id} className={`change-item tone-${item.tone}`}>
                  <span className="eyebrow">{localize(lang, item.label)}</span>
                  <strong>{item.value}</strong>
                  <small>{localize(lang, item.detail)}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="card briefing-card" id="briefing">
            <div className="card-header">
              <span className="eyebrow">{copy.briefing}</span>
              <span className="status-pill">{view}</span>
            </div>
            <h2>{localize(lang, overview.briefing.headline)}</h2>
            <p>{localize(lang, overview.briefing.body)}</p>
            <div className="briefing-cycle">
              <span className="eyebrow">{copy.thisWeek}</span>
              <div className="briefing-list">
                {thisCycleItems.map((item) => (
                  <div key={item.id} className="briefing-line">
                    <strong>{localize(lang, item.label)}</strong>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="focus-preset-group">
              <span className="eyebrow">{copy.focusPresets}</span>
              <div className="pill-list compact">
                {focusPresets.map((preset) => {
                  const presetActive =
                    preset.layers.length === layers.length && preset.layers.every((item) => layers.includes(item));

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={presetActive ? "chip active" : "chip"}
                      onClick={preset.run}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="card resilience-card" id="resilience">
            <div className="card-header">
              <span className="eyebrow">{copy.resilience}</span>
              <span className="status-pill">{resilience.source.freshnessStatus}</span>
            </div>
            <div className="resilience-grid">
              <div className="city-intel-stat">
                <p className="eyebrow">Weather</p>
                <strong>{localize(lang, resilience.weatherSummary)}</strong>
              </div>
              <div className="city-intel-stat">
                <p className="eyebrow">Pollution</p>
                <strong>{localize(lang, resilience.pollutionSummary)}</strong>
              </div>
              <div className="warning-list terminal-list">
                {resilience.warnings.map((warning, index) => (
                  <p key={index}>{localize(lang, warning)}</p>
                ))}
              </div>
            </div>
            <div className="hotspot-strip compact">
              {topAqiFeature ? (
                <button
                  type="button"
                  className="hotspot-chip warning"
                  onClick={() => focusCityWithLayer(topAqiCitySlug || city, "pollution")}
                >
                  <span className="eyebrow">{copy.airHotspot}</span>
                  <strong>{`${topAqiFeature.title} AQI ${numericProperty(topAqiFeature, "aqi")}`}</strong>
                  <small>{copy.clickToFocus}</small>
                </button>
              ) : null}
              {hottestWeatherFeature ? (
                <button
                  type="button"
                  className="hotspot-chip"
                  onClick={() => focusCityWithLayer(hottestCitySlug || city, "weather")}
                >
                  <span className="eyebrow">{copy.weatherHotspot}</span>
                  <strong>{`${hottestWeatherFeature.title} ${numericProperty(hottestWeatherFeature, "temperatureC")}C`}</strong>
                  <small>{`${numericProperty(hottestWeatherFeature, "humidity")}% humidity`}</small>
                </button>
              ) : null}
            </div>
            <div className="eo-watch-grid">
              {eoWatchItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`eo-watch-item ${item.tone}`}
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
                  }}
                >
                  <span className="eyebrow">{item.title}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="card news-card" id="news">
            <div className="card-header">
              <span className="eyebrow">{copy.news}</span>
              <span className="status-pill">{liveNewsSource ? `${liveNewsSource.freshnessStatus} / 5m` : "5m"}</span>
            </div>
            <div className="news-monitor">
              <span>Items {filteredNews.length}</span>
              <span>Last {formatUtcClock(liveNewsSource?.lastCheckedAt)} UTC</span>
              <span>Next {formatUtcClock(nextNewsCheckAt)} UTC</span>
            </div>
            <div className="news-columns tile-scroll">
              <div>
                <h3>{copy.official}</h3>
                <div className="compact-list">
                  {officialNews.map((item) => (
                    <a
                      key={item.id}
                      className="headline-item"
                      href={item.source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3>{copy.external}</h3>
                <div className="compact-list">
                  {externalNews.map((item) => (
                    <a
                      key={item.id}
                      className="headline-item"
                      href={item.source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card projects-card" id="projects">
            <div className="card-header">
              <span className="eyebrow">{copy.projects}</span>
              <span className="eyebrow">{filteredProjects.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {compactProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="stack-item stack-item-button"
                  onClick={() => focusCityWithLayer(project.citySlug, "projects")}
                >
                  <div className="stack-title">
                    <strong>{localize(lang, project.title)}</strong>
                    <span className={`status-tag ${project.status}`}>{project.status}</span>
                  </div>
                  <p>{localize(lang, project.summary)}</p>
                  <div className="progress-row">
                    <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${project.completionPercent}%` }} />
                  </div>
                  <span>{project.completionPercent}%</span>
                  </div>
                  <small>{localize(lang, project.nextMilestone)}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="card sources-card" id="sources">
            <div className="card-header">
              <span className="eyebrow">{copy.apiWatch}</span>
              <span className={`status-pill api-${apiStatusLabel.toLowerCase()}`}>{apiStatusLabel}</span>
            </div>
            <div className="terminal-callout compact">
              <span className="eyebrow">{copy.sourceStatus}</span>
              <strong>{`${apiReadyCount}/${apiWatchSources.length} operational`}</strong>
            </div>
            <div className="api-watch-grid">
              {apiWatchSources.map((source) => (
                <a
                  key={source.id}
                  className={`api-watch-item ${source.freshnessStatus}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="stack-title">
                    <strong>{source.name}</strong>
                    <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                  </div>
                  <small>{source.message}</small>
                </a>
              ))}
            </div>
          </section>

          <section className="card slic-card" id="slic-thailand">
            <div className="card-header">
              <span className="eyebrow">SLIC Thailand</span>
              <span className={`status-pill ${slicThailand.source.freshnessStatus}`}>{formatUtcClock(slicThailand.updatedAt)} UTC</span>
            </div>
            <div className="terminal-callout compact">
              <span className="eyebrow">{lang === "th" ? "จัดอันดับล่าสุด" : "Live ranking"}</span>
              <strong>{lang === "th" ? "เมืองไทยที่ขึ้นมานำ" : "Top Thai cities right now"}</strong>
            </div>
            <div className="slic-ranking-list">
              {slicTopCities.map((item) => {
                const mappedCitySlug = slicCitySlugMap[item.id];
                const actionable = Boolean(mappedCitySlug && knownCitySlugs.has(mappedCitySlug));
                const rankingCard = (
                  <>
                    <div className="slic-ranking-head">
                      <span className="status-pill">#{item.rank}</span>
                      <div>
                        <strong>{lang === "th" ? item.nameTh || item.nameEn : item.nameEn}</strong>
                        <small>{item.region}</small>
                      </div>
                      <strong className="slic-score">{item.overall}</strong>
                    </div>
                    <p>{item.tagline}</p>
                    <div className="slic-ranking-meta">
                      <span>{item.avgMonthlyIncome > 0 ? `${item.avgMonthlyIncome.toLocaleString("en-US")} THB/mo` : "Tracked city"}</span>
                      <span>{item.pm25Annual > 0 ? `PM2.5 ${item.pm25Annual}` : "Monitor mode"}</span>
                    </div>
                  </>
                );

                return actionable ? (
                  <button
                    key={item.id}
                    type="button"
                    className="slic-ranking-card action"
                    onClick={() => focusCityWithLayer(mappedCitySlug, "smart-city-thailand")}
                  >
                    {rankingCard}
                  </button>
                ) : (
                  <article key={item.id} className="slic-ranking-card">
                    {rankingCard}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card time-card">
            <div className="card-header">
              <span className="eyebrow">{copy.time}</span>
              <span className="status-pill">UTC</span>
            </div>
            <div className="time-scrubber">
              <div className="time-scrubber-head">
                <strong>{timeRange}</strong>
                <button
                  type="button"
                  className={timeCompareEnabled ? "chip active" : "chip"}
                  onClick={() => setTimeCompareEnabled((value) => !value)}
                >
                  {timeCompareEnabled ? uiText.compareWindow : uiText.compareWindowOff}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={TIME_RANGE_OPTIONS.length - 1}
                step={1}
                value={Math.max(0, timeRangeIndex)}
                onChange={(event) => updateParam("timeRange", TIME_RANGE_OPTIONS[Number(event.target.value)])}
              />
              <div className="time-scrubber-scale">
                {TIME_RANGE_OPTIONS.map((option) => (
                  <button
                    key={`scrubber-${option}`}
                    type="button"
                    className={option === timeRange ? "chip active" : "chip"}
                    onClick={() => updateParam("timeRange", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <small>
                {timeCompareEnabled
                  ? lang === "th"
                    ? "กำลังอ่านผลต่างเทียบกับช่วงเวลาก่อนหน้าใน narrative และ drawer"
                    : "Narrative and drawer now read the current window against the previous period."
                  : lang === "th"
                    ? "โหมด snapshot ใช้สำหรับบันทึกภาพหรืออธิบายสภาพล่าสุด"
                    : "Snapshot mode is best for clean screenshots and explaining the current state."}
              </small>
            </div>
            <div className="time-zones">
              {timeZones.map((zone) => (
                <div key={zone.timeZone} className="time-zone">
                  <span className="eyebrow">{zone.label}</span>
                  <strong>{zone.localTime}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="card compare-card" id="compare">
            <div className="card-header">
              <span className="eyebrow">{uiText.cityProvinceCompare}</span>
              <span className="eyebrow">{`${compareProfiles.length}/4`}</span>
            </div>
            <small>{uiText.comparePick}</small>
            <div className="pill-list compact">
              {overview.cities.map((item) => {
                const active = compareCitySlugs.includes(item.slug);
                return (
                  <button
                    key={`compare-toggle-${item.slug}`}
                    type="button"
                    className={active ? "chip active" : "chip"}
                    onClick={() => toggleCompareCity(item.slug)}
                  >
                    {localize(lang, item.name)}
                  </button>
                );
              })}
            </div>
            <div className="compare-matrix">
              <div className="compare-city-headers">
                {compareProfiles.map((profile) => (
                  <button
                    key={`compare-profile-${profile.slug}`}
                    type="button"
                    className={profile.slug === selectedCity.slug ? "compare-city-card active" : "compare-city-card"}
                    onClick={() => {
                      applyDashboardScene({ view: "city", city: profile.slug });
                      openCityOpsDrawer(
                        profile.slug,
                        lang === "th"
                          ? "ใช้การ์ดนี้เพื่อเทียบเมืองและเปิดคำอธิบายต่อด้านขวา"
                          : "Use this card to compare the city and open a right-side explanation.",
                        layers
                      );
                    }}
                  >
                    <span className="eyebrow">{localize(lang, profile.region)}</span>
                    <strong>{localize(lang, profile.name)}</strong>
                    <small>{localize(lang, profile.focus)}</small>
                  </button>
                ))}
              </div>
              <div className="compare-metric-list">
                {compareRows.map((row) => (
                  <div
                    key={row.id}
                    className="compare-metric-row"
                    style={{ gridTemplateColumns: `minmax(108px, 0.9fr) repeat(${Math.max(compareProfiles.length, 1)}, minmax(0, 1fr))` }}
                  >
                    <span className="eyebrow">{row.label}</span>
                    {compareProfiles.map((profile) => (
                      <strong key={`${row.id}-${profile.slug}`}>{row.getValue(profile)}</strong>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card trends-card" id="trends">
            <div className="card-header">
              <span className="eyebrow">{copy.trendWatch}</span>
              <span className="status-pill">TH / 5Y</span>
            </div>
            <div className="trend-list tile-scroll">
              {visibleTrends.map((item) => {
                const stats = getTrendStats(item.values);

                return (
                  <a
                    key={item.id}
                    className="trend-row"
                    href={createGoogleTrendsUrl(item.query)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="trend-term">
                      <strong>{pickLocalized(lang, item.term)}</strong>
                      <span className="status-pill">{pickLocalized(lang, item.category)}</span>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendNow}</span>
                      <strong>{stats.latest}</strong>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendDelta}</span>
                      <strong className={stats.delta >= 0 ? "trend-positive" : "trend-negative"}>
                        {stats.delta >= 0 ? `+${stats.delta}` : stats.delta}
                      </strong>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendPeak}</span>
                      <strong>{stats.peak}</strong>
                    </div>
                    <div className="trend-mini">
                      <Sparkline values={item.values} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="card media-card" id="media">
            <div className="card-header">
              <span className="eyebrow">Live Media</span>
              <span className="status-pill">{mediaFeeds.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {compactMedia.map((item) => (
                <a
                  key={item.id}
                  className="stack-item linked"
                  href={item.externalUrl ?? item.embedUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="stack-title">
                    <strong>{item.label}</strong>
                    <span className={`status-tag ${item.status === "live" ? "live" : "manual"}`}>{item.status}</span>
                  </div>
                  <small>{item.region ?? item.kind}</small>
                </a>
              ))}
            </div>
          </section>

          <section className="card changes-card" id="changes">
            <div className="card-header">
              <span className="eyebrow">{copy.changes}</span>
              <span className="status-pill">{changes.updatedAt.slice(11, 16)} UTC</span>
            </div>
            <div className="change-grid">
              {changes.items.map((item) => (
                <article key={item.id} className={`change-item tone-${item.tone}`}>
                  <span className="eyebrow">{localize(lang, item.label)}</span>
                  <strong>{item.value}</strong>
                  <small>{localize(lang, item.detail)}</small>
                </article>
              ))}
            </div>
            <div className="threshold-strip">
              <span className="eyebrow">{copy.thresholdWatch}</span>
              <div className="threshold-list">
                {changes.thresholds.map((threshold) => (
                  <div key={threshold.id} className={`threshold-item ${threshold.state}`}>
                    <strong>{localize(lang, threshold.label)}</strong>
                    <small>{localize(lang, threshold.detail)}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card social-card" id="social">
            <div className="card-header">
              <span className="eyebrow">{copy.social}</span>
              <span className="status-pill">{socialListening.source.freshnessStatus}</span>
            </div>
            <div className="social-stats">
              <div className="social-stat">
                <span className="eyebrow">{copy.mentions}</span>
                <strong>{socialListening.mentionCount}</strong>
              </div>
              <div className="social-stat">
                <span className="eyebrow">{copy.sentiment}</span>
                <strong className={socialListening.sentimentScore >= 0 ? "trend-positive" : "trend-negative"}>
                  {socialListening.sentimentScore >= 0 ? `+${socialListening.sentimentScore}` : socialListening.sentimentScore}
                </strong>
              </div>
              <div className="social-stat">
                <span className="eyebrow">{copy.sourceMix}</span>
                <strong>{socialListening.sourceCount}</strong>
              </div>
              <div className="social-stat">
                <span className="eyebrow">Positive</span>
                <strong>{Math.round(socialListening.positiveShare * 100)}%</strong>
              </div>
            </div>
            <div className="social-meta">
              <span>{socialListening.dominantSource}</span>
              <div className="pill-list compact">
                {socialListening.topTerms.slice(0, 5).map((term) => (
                  <span key={term} className="stack-pill">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="card impact-card" id="impact">
            <div className="card-header">
              <span className="eyebrow">{copy.impact}</span>
              <span className="status-pill">{impact.source.freshnessStatus}</span>
            </div>
            <div className="impact-list">
              <div className="impact-row">
                <span>{copy.official}</span>
                <strong>{impact.officialUpdates}</strong>
              </div>
              <div className="impact-row">
                <span>Live</span>
                <strong>{impact.liveSources}</strong>
              </div>
              <div className="impact-row">
                <span>Cities</span>
                <strong>{impact.trackedCities}</strong>
              </div>
              <div className="impact-row">
                <span>Signals</span>
                <strong>{impact.publicSignals}</strong>
              </div>
            </div>
            <div className="impact-headline">
              <span className="eyebrow">Latest</span>
              <strong>{localize(lang, impact.latestHeadline)}</strong>
            </div>
          </section>
        </section>

        <section className="support-grid">
          <section className="card market-card" id="markets">
            <div className="card-header">
              <span className="eyebrow">{copy.markets}</span>
              <span className="status-pill">{markets.source.freshnessStatus}</span>
            </div>
            <div className="impact-list">
              {markets.items.map((item) => (
                <div key={item.id} className={`impact-row tone-${item.tone}`}>
                  <span>{localize(lang, item.label)}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="impact-headline">
              <span className="eyebrow">Signal</span>
              <strong>{localize(lang, markets.items[0]?.changeText ?? { th: "ไม่มีข้อมูล", en: "No data" })}</strong>
            </div>
          </section>
          <section className="card satellite-card" id="satellite">
            <div className="card-header">
              <span className="eyebrow">{copy.satellite}</span>
              <span className="status-pill">{`${activeSatelliteLayers.length} active / ${satelliteReadySources.length} ready`}</span>
            </div>

            <div className="satellite-shell">
              <div className="impact-headline">
                <span className="eyebrow">{copy.latestSignal}</span>
                <strong>{satelliteNarrative}</strong>
                <small>{satelliteDigest.status.message}</small>
              </div>

              <div className="satellite-preset-grid">
                {satellitePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={preset.active ? "satellite-preset active" : "satellite-preset"}
                    onClick={() => applyLayerPreset([...preset.layers], "national")}
                  >
                    <span className="eyebrow">{localize(lang, preset.label)}</span>
                    <strong>{localize(lang, preset.label)}</strong>
                    <small>{localize(lang, preset.detail)}</small>
                  </button>
                ))}
              </div>

              <div className="satellite-grid">
                <div className="satellite-panel">
                  <span className="eyebrow">{copy.satelliteLiveLayers}</span>
                  <div className="pill-list compact">
                    <button
                      type="button"
                      className={basemap === "atlas" ? "chip active" : "chip"}
                      onClick={() => updateParam("basemap", "atlas")}
                    >
                      {copy.mapAtlas}
                    </button>
                    <button
                      type="button"
                      className={basemap === "satellite" ? "chip active" : "chip"}
                      onClick={() => updateParam("basemap", "satellite")}
                    >
                      {copy.mapSatellite}
                    </button>
                  </div>
                  <div className="pill-list compact">
                    {satelliteToggleOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={layers.includes(item.id) ? "chip active" : "chip"}
                        onClick={() => toggleSatelliteLayer(item.id)}
                      >
                        {localize(lang, item.label)}
                      </button>
                    ))}
                  </div>
                  <div className="satellite-source-list">
                    {satelliteLiveSources.map((source) => (
                      <div key={source.id} className="headline-item satellite-source-item">
                        <strong>{source.name}</strong>
                        <small>{source.message}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="satellite-panel">
                  <span className="eyebrow">{copy.satelliteMetrics}</span>
                  <div className="satellite-metric-grid">
                    {satelliteMetrics.map((metric) => (
                      <div key={metric.id} className="satellite-metric-item">
                        <span className="eyebrow">{localize(lang, metric.title)}</span>
                        <strong>{metric.displayValue}</strong>
                        <small>{localize(lang, metric.description)}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="satellite-panel">
                  <div className="stack-title">
                    <span className="eyebrow">{copy.satelliteRecentScenes}</span>
                    <span className="status-pill">{satelliteStatusLabel}</span>
                  </div>
                  <div className="satellite-source-list">
                    {satelliteRecentScenes.length > 0 ? (
                      satelliteRecentScenes.map((scene) => (
                        <a
                          key={scene.id}
                          className="headline-item satellite-source-item"
                          href={scene.quicklookUrl ?? satelliteDigest.status.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <strong>{scene.title}</strong>
                          <small>
                            {formatUtcDateTime(scene.timestamp)}
                            {scene.cloudCover !== undefined ? ` • ${copy.satelliteCloudCover} ${Math.round(scene.cloudCover)}%` : ""}
                          </small>
                        </a>
                      ))
                    ) : (
                      <div className="headline-item satellite-source-item">
                        <strong>{copy.satelliteCredentialsNeeded}</strong>
                        <small>{satelliteDigest.status.message}</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="satellite-panel">
                  <span className="eyebrow">{copy.satelliteReadySources}</span>
                  <div className="satellite-source-list">
                    {satelliteReadySources.map((source) => (
                      <a key={source.id} className="headline-item satellite-source-item" href={source.url} target="_blank" rel="noreferrer">
                        <strong>{source.name}</strong>
                        <small>{source.message}</small>
                      </a>
                    ))}
                  </div>
                  <a className="eo-watch-link" href={satelliteDigest.status.docsUrl} target="_blank" rel="noreferrer">
                    {copy.satelliteDocs}
                  </a>
                </div>
              </div>

              <div className="satellite-section-label">{uiText.layerStudio}</div>
              <div className="layer-studio-list">
                {orderedOverlayItems.map((item, index) => {
                  const active = layers.includes(item.id);
                  const settings = overlayStudioSettings[item.id];

                  return (
                    <article key={`studio-${item.id}`} className="layer-studio-row">
                      <div className="layer-studio-head">
                        <div>
                          <div className="side-toggle-row">
                            <span className="swatch" style={{ background: item.color }} />
                            <strong>{localize(lang, item.label)}</strong>
                          </div>
                          <small>{localize(lang, item.detail)}</small>
                        </div>
                        <button
                          type="button"
                          className={active ? "chip active" : "chip"}
                          onClick={() => toggleSatelliteLayer(item.id)}
                        >
                          {active ? uiText.active : uiText.inactive}
                        </button>
                      </div>
                      <div className="layer-studio-controls">
                        <label>
                          <span className="eyebrow">{uiText.opacity}</span>
                          <input
                            type="range"
                            min={0.15}
                            max={1}
                            step={0.05}
                            value={settings.opacity}
                            onChange={(event) =>
                              updateOverlaySetting(item.id, { opacity: Number(event.target.value) })
                            }
                          />
                        </label>
                        <label>
                          <span className="eyebrow">{uiText.blend}</span>
                          <select
                            value={settings.blendMode}
                            onChange={(event) =>
                              updateOverlaySetting(item.id, {
                                blendMode: event.target.value as BlendModeOption
                              })
                            }
                          >
                            {BLEND_MODE_OPTIONS.map((option) => (
                              <option key={`${item.id}-${option.id}`} value={option.id}>
                                {localize(lang, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="layer-order-controls">
                          <span className="eyebrow">{`${uiText.order} ${index + 1}`}</span>
                          <div className="pill-list compact">
                            <button type="button" className="chip" onClick={() => moveOverlayItem(item.id, -1)}>
                              {uiText.moveUp}
                            </button>
                            <button type="button" className="chip" onClick={() => moveOverlayItem(item.id, 1)}>
                              {uiText.moveDown}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="satellite-section-label">{uiText.comparePanel}</div>
              <div className="map-compare-grid">
                {mapCompareCards.map((item) => (
                  <button
                    key={`compare-${item.id}`}
                    type="button"
                    className={item.active ? "map-compare-card active" : "map-compare-card"}
                    onClick={item.action}
                  >
                    <div className="map-compare-thumb">
                      <img src={item.previewUrl} alt={`${localize(lang, item.title)} preview`} loading="lazy" />
                    </div>
                    <div className="map-compare-copy">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{localize(lang, item.detail)}</small>
                    </div>
                  </button>
                ))}
              </div>

              <div className="satellite-priority-list">
                <span className="eyebrow">{copy.satelliteThailandPriority}</span>
                {THAILAND_SATELLITE_PRIORITIES.map((item) => (
                  <div key={item.id} className="stack-item">
                    <div className="stack-title">
                      <strong>{localize(lang, item.title)}</strong>
                      <span className="status-pill">TH</span>
                    </div>
                    <small>{localize(lang, item.detail)}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card activity-card decision-card" id="decisions">
            <div className="card-header">
              <span className="eyebrow">{lang === "th" ? "คิวตัดสินใจ" : "Decision Queue"}</span>
              <span className="status-pill">{decisionItems.length}</span>
            </div>
            <div className="terminal-callout compact">
              <span className="eyebrow">{lang === "th" ? "รายการนำ" : "Lead action"}</span>
              <strong>
                {decisionItems[0]
                  ? localize(lang, decisionItems[0].title)
                  : lang === "th"
                    ? "ไม่มีรายการเร่งด่วนในคิว"
                    : "No immediate actions in the queue"}
              </strong>
            </div>
            <div className="decision-list tile-scroll">
              {decisionItems.length > 0 ? (
                decisionItems.map((item) => {
                  const domainLabel = overview.domains.find((domainItem) => domainItem.slug === item.domainSlug);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`decision-item severity-${item.severity}`}
                      onClick={() => focusDecision(item)}
                    >
                      <div className="stack-title">
                        <strong>{localize(lang, item.title)}</strong>
                        <span className={`status-tag ${item.status}`}>{item.status}</span>
                      </div>
                      <div className="decision-meta">
                        <span>
                          {item.districtSlug && districtBySlug.get(item.districtSlug)
                            ? localize(lang, districtBySlug.get(item.districtSlug)?.name ?? selectedCity.name)
                            : localize(lang, selectedCity.name)}
                        </span>
                        <span>{domainLabel ? localize(lang, domainLabel.title) : item.domainSlug}</span>
                        <span>{`${lang === "th" ? "เชื่อมั่น" : "Confidence"} ${formatConfidence(item.confidence)}`}</span>
                      </div>
                      <p>{localize(lang, item.summary)}</p>
                      <small>{localize(lang, item.recommendedAction)}</small>
                      <div className="decision-footer">
                        <span>{localize(lang, item.owner)}</span>
                        <span>{`${lang === "th" ? "ครบกำหนด" : "Due"} ${formatUtcClock(item.dueAt)} UTC`}</span>
                      </div>
                  </button>
                );
              })
            ) : (
                <article className="activity-item">
                  <div className="stack-title">
                    <strong>{lang === "th" ? "ไม่มีรายการค้าง" : "Queue clear"}</strong>
                    <span className="status-tag live">live</span>
                  </div>
                  <small>{formatUtcClock(time.updatedAt)} UTC</small>
                  <p>
                    {lang === "th"
                      ? "ขณะนี้ยังไม่มีการตัดสินใจที่ต้องยกระดับสำหรับตัวกรองนี้"
                      : "There are no escalated actions for the current city, district, and domain filters."}
                  </p>
                </article>
              )}
            </div>
            <div className="decision-activity-strip">
              {activityItems.slice(0, 2).map((item) => (
                <div key={item.id} className="decision-activity-item">
                  <span>{item.label}</span>
                  <small>{formatUtcClock(item.timestamp)} UTC</small>
                </div>
              ))}
            </div>
          </section>

          <section className="card global-card" id="global-signals">
            <div className="card-header">
              <span className="eyebrow">{copy.globalSignals}</span>
              <span className="status-pill">{globalSignalNews.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {globalSignalNews.length > 0 ? (
                globalSignalNews.map((item) => (
                  <a
                    key={item.id}
                    className="stack-item linked"
                    href={item.source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="stack-title">
                      <strong>{localize(lang, item.title)}</strong>
                      <span className="status-pill">{formatUtcClock(item.publishedAt)} UTC</span>
                    </div>
                    <small>{item.source.sourceName}</small>
                  </a>
                ))
              ) : (
                <div className="stack-item">
                  <p>{copy.noExternalSignals}</p>
                </div>
              )}
            </div>
          </section>

          <section className="card world-card" id="world-watch">
            <div className="card-header">
              <span className="eyebrow">{copy.worldWatch}</span>
              <span className="status-pill">{globalWatchSources.length}</span>
            </div>
            <div className="stack-list">
              <span className="eyebrow">{copy.sourceStatus}</span>
              {globalWatchSources.map((source) => (
                <div key={source.id} className="stack-item compact-source">
                  <div className="stack-title">
                    <strong>{source.name}</strong>
                    <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                  </div>
                  <small>{source.message}</small>
                </div>
              ))}
            </div>
            <div className="impact-headline">
              <span className="eyebrow">{copy.worldContext}</span>
              <strong>{localize(lang, resilience.warnings[0] ?? { th: "ไม่มีคำเตือนเพิ่มเติม", en: "No active warnings" })}</strong>
            </div>
            <div className="eo-watch-card">
              <div className="stack-title">
                <strong>{lang === "th" ? "Earth Observation Watch" : "Earth Observation Watch"}</strong>
                <span className="status-pill">EO</span>
              </div>
              <div className="eo-watch-grid">
                {eoWatchItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`eo-watch-item ${item.tone}`}
                    onClick={() => {
                      const next = buildStableParams();
                      next.set("layers", item.targetLayers.join(","));
                      if (
                        item.targetLayers.includes("smart-city-thailand") ||
                        item.targetLayers.includes("jaxa-rainfall") ||
                        item.targetLayers.includes("eo-aerosol") ||
                        item.targetLayers.includes("eo-precipitation") ||
                        item.targetLayers.includes("eo-vegetation")
                      ) {
                        next.set("view", "national");
                      }
                      startTransition(() => {
                        setSearchParams(next);
                        setRecenterSignal((v) => v + 1);
                      });
                    }}
                  >
                    <span className="eyebrow">{item.title}</span>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
              <a className="eo-watch-link" href="https://eodashboard.org" target="_blank" rel="noreferrer">
                {lang === "th" ? "เปิด EO Dashboard เพื่อดูบริบทเชิงพื้นที่" : "Open EO Dashboard for spatial context"}
              </a>
            </div>
            {undpDataSource ? (
              <a className="stack-item linked compact-source" href={undpDataSource.url} target="_blank" rel="noreferrer">
                <div className="stack-title">
                  <strong>{undpDataSource.name}</strong>
                  <span className={`status-tag ${undpDataSource.freshnessStatus}`}>{undpDataSource.freshnessStatus}</span>
                </div>
                <small>
                  {lang === "th"
                    ? "เปิด UNDP Data Hub เพื่อเข้าถึง development indicators, datasets, tiles, และ API URLs"
                    : "Open UNDP Data Hub for development indicators, datasets, tiles, and dataset API URLs."}
                </small>
              </a>
            ) : null}
            <div className="compact-list">
              {undpQuickLinks.map((item) => (
                <a key={item.id} className="headline-item" href={item.href} target="_blank" rel="noreferrer">
                  <strong>{localize(lang, item.title)}</strong>
                  <small>{localize(lang, item.note)}</small>
                </a>
              ))}
            </div>
            <div className="compact-list">
              <span className="eyebrow">{uiText.groundTruth}</span>
              {groundTruthLinks.map((item) => (
                <a key={item.id} className="headline-item" href={item.url} target="_blank" rel="noreferrer">
                  <strong>{localize(lang, item.label)}</strong>
                  <small>{localize(lang, item.note)}</small>
                </a>
              ))}
            </div>
            {compactMedia.length > 0 ? (
              <div className="compact-list">
                {compactMedia.slice(0, 2).map((item) => (
                  <a
                    key={item.id}
                    className="headline-item"
                    href={item.externalUrl ?? item.embedUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{item.label}</strong>
                    <small>{item.region ?? item.kind}</small>
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className="card activity-card" id="activity">
            <div className="card-header">
              <span className="eyebrow">{copy.activity}</span>
              <span className="status-pill">{activityItems.length}</span>
            </div>
            <div className="activity-list tile-scroll">
              {activityItems.map((item) => (
                <article key={item.id} className="activity-item">
                  <div className="stack-title">
                    <strong>{item.label}</strong>
                    <span className={`status-tag ${item.status}`}>{item.status}</span>
                  </div>
                  <small>{formatUtcClock(item.timestamp)} UTC</small>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card research-card" id="candidate-compare">
            <div className="card-header">
              <span className="eyebrow">{copy.candidateCompare}</span>
              <span className="status-pill">{selectedModelCity.name}</span>
            </div>
            <label className="stack-field">
              <span className="eyebrow">{copy.modelCity}</span>
              <select value={selectedModelCity.id} onChange={(event) => updateParam("modelCity", event.target.value)}>
                {globalReferenceCities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {`${item.name}, ${item.country}`}
                  </option>
                ))}
              </select>
            </label>
            <div className="candidate-grid">
              <div className="candidate-panel">
                <span className="eyebrow">{localize(lang, selectedCity.name)}</span>
                <strong>{formatPopulation(selectedCity.population)}</strong>
                <small>{localize(lang, selectedCity.region)}</small>
                <p>{localize(lang, selectedCity.focus)}</p>
              </div>
              <div className="candidate-panel">
                <span className="eyebrow">{`${selectedModelCity.name}, ${selectedModelCity.country}`}</span>
                <strong>{selectedModelCity.approxPopulation}</strong>
                <small>{`${copy.eiuRank}: ${selectedModelCity.eiuRank2025}`}</small>
                <p>{pickLocalized(lang, selectedModelCity.modelLens)}</p>
              </div>
            </div>
            <div className="impact-headline">
              <span className="eyebrow">{copy.fitSignal}</span>
              <strong>
                {fitDomains.length > 0
                  ? fitDomains.map((item) => localize(lang, item.title)).join(" • ")
                  : pickLocalized(lang, selectedModelCity.modelLens)}
              </strong>
            </div>
            <div className="stack-list">
              <span className="eyebrow">{copy.transferIdeas}</span>
              {selectedModelCity.innovationIdeas.map((item, index) => (
                <div key={`${selectedModelCity.id}-${index}`} className="stack-item">
                  <p>{pickLocalized(lang, item)}</p>
                </div>
              ))}
            </div>
            <a className="stack-item linked" href={selectedModelCity.href} target="_blank" rel="noreferrer">
              <div className="stack-title">
                <strong>{copy.livabilityLens}</strong>
                <span className="status-pill">{copy.eiuRank}</span>
              </div>
              <p>
                {lang === "th"
                  ? "ใช้เมืองอันดับสูงของ EIU เป็นเมืองอ้างอิงเพื่อชี้ให้เห็นแนวทางที่ถ่ายโอนได้"
                  : "Uses high-ranking EIU cities as reference models for transferable planning ideas."}
              </p>
            </a>
          </section>

          <section className="card toolkit-card" id="toolkit">
            <div className="card-header">
              <span className="eyebrow">{copy.toolkit}</span>
              <span className="status-pill">{`${toolkitLinks.length} APIs`}</span>
            </div>

            <div className="toolkit-shell tile-scroll">
              <div className="toolkit-block">
                <h3>{copy.apiDirectory}</h3>
                <div className="tool-link-grid">
                  {toolkitLinks.map((tool) => (
                    <a key={tool.id} className="tool-link" href={tool.href} target="_blank" rel="noreferrer">
                      <strong>{tool.name}</strong>
                      <span>{tool.kind}</span>
                      <p>{pickLocalized(lang, tool.description)}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="toolkit-block">
                <h3>{copy.stack}</h3>
                <div className="pill-list">
                  {["Codex", "GitHub", "Render", "React", "Vite", "Fastify", "TypeScript", "npm"].map((item) => (
                    <span key={item} className="stack-pill">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="export-panel">
                  <div className="stack-title">
                    <strong>{`${copy.exportLanguage}: ${activeExportLabel}`}</strong>
                    <button className="share-button" onClick={copySkeleton}>
                      {copiedSkeleton ? copy.exported : `${copy.exportCode} ${activeExportLabel}`}
                    </button>
                  </div>
                  <div className="export-tabs">
                    {exportOptions.map((option) => {
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`export-tab export-tab-${option.id}${exportLanguage === option.id ? " active" : ""}`}
                          onClick={() => setExportLanguage(option.id)}
                        >
                          <span className="export-tab-mark">{option.mark}</span>
                          <span className="export-tab-copy">
                            <strong>{option.label}</strong>
                            <small>{option.detail}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <pre>{activeExportSnippet}</pre>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="card footnote-card" id="fine-print">
          <div className="card-header">
            <span className="eyebrow">{copy.finePrint}</span>
            <span className="status-pill">experimental</span>
          </div>
          <div className="footnote-grid">
            <p>{copy.privacy}</p>
            <p>{copy.experimental}</p>
            <p>{copy.copyright}</p>
            <div className="contact-card">
              <div className="stack-title">
                <strong>{copy.contactTitle}</strong>
                <span className="status-pill">public</span>
              </div>
              <p className="contact-copy">{copy.contactLead}</p>
              <p className="contact-copy">{copy.contactPrompt}</p>
              <div className="contact-links">
                <a href="mailto:non.ar@depa.or.th">
                  <span className="eyebrow">{copy.contactEmailLabel}</span>
                  <strong>non.ar@depa.or.th</strong>
                </a>
                <a href="https://www.linkedin.com/in/drnon/" target="_blank" rel="noreferrer">
                  <span className="eyebrow">{copy.contactLinkedInLabel}</span>
                  <strong>linkedin.com/in/drnon</strong>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <aside className="context-rail" aria-label={lang === "th" ? "Layer catalog" : "Layer catalog"}>
        <div className="context-rail-header">
          <span className="eyebrow">{lang === "th" ? "Layer catalog" : "Layer Catalog"}</span>
          <strong>{lang === "th" ? "Right rail for roads, vegetation, traffic, and imported overlays" : "Right rail for roads, vegetation, traffic, and imported overlays"}</strong>
          <small>
            {lang === "th"
              ? `${layers.length} live now • ${catalogedLayerCount} cataloged`
              : `${layers.length} live now • ${catalogedLayerCount} cataloged`}
          </small>
        </div>

        {layerRailSections.map((section) => (
          <section key={section.id} className="context-rail-section">
            <div className="context-rail-section-head">
              <div>
                <span className="eyebrow">{section.title}</span>
                <small>{section.note}</small>
              </div>
              <span className="status-pill">{section.items.length}</span>
            </div>
            <div className="layer-rail-list">
              {section.items.map((item) => {
                const interactive = "onClick" in item && typeof item.onClick === "function";
                const content = (
                  <>
                    <div className="layer-rail-title">
                      <div className="side-toggle-row">
                        <span className="swatch" style={{ background: item.color }} />
                        <strong>{item.label}</strong>
                      </div>
                      <span className={`layer-state state-${item.state}`}>{item.state === "active" ? "ON" : item.state}</span>
                    </div>
                    <p>{item.detail}</p>
                    <small className="layer-source">{item.source}</small>
                  </>
                );

                return interactive ? (
                  <button
                    key={item.id}
                    type="button"
                    className={item.state === "active" ? "layer-rail-item active" : "layer-rail-item"}
                    onClick={item.onClick}
                  >
                    {content}
                  </button>
                ) : (
                  <article key={item.id} className="layer-rail-item passive">
                    {content}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </aside>

      <footer className="bottombar">
        <div className="ticker">
          <span className="eyebrow">Alert</span>
          <strong>{executiveSignal}</strong>
        </div>
        <div className="ticker-meta">
          <span>{localize(lang, selectedCity.name)}</span>
          <span>{selectedDomain ? localize(lang, selectedDomain.title) : "All domains"}</span>
          <span>{timeRange}</span>
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminConsolePage />} />
    </Routes>
  );
}
