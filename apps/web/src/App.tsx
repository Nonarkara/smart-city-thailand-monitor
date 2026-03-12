import { useQuery } from "@tanstack/react-query";
import {
  activityLog as activityLogSeed,
  changePulse as changePulseSeed,
  cloneSeed,
  createOverviewSnapshot,
  createTimeSnapshot,
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
  AssistantQueryRequest,
  AssistantResponse,
  AssistantStatus,
  ChangePulse,
  DashboardView,
  GeoFeatureRecord,
  Locale,
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

const operationalLayerToggleIds = [
  "smart-city-thailand",
  "bangkok-passages",
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
    id: "satellite-night-lights",
    label: { th: "แสงกลางคืน", en: "Night Lights" },
    detail: { th: "ความหนาแน่นแสงเมืองยามค่ำ", en: "Night-time urban light intensity" },
    color: "#8b5cf6"
  }
];

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
    title: "Smart City Thailand Monitor",
    brandEyebrow: "แดชบอร์ดปฏิบัติการสาธารณะ",
    subtitle: "แดชบอร์ดทดลองสาธารณะสำหรับติดตามสัญญาณเมืองอัจฉริยะไทย",
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
    title: "Smart City Thailand Monitor",
    brandEyebrow: "Public Operations Dashboard",
    subtitle: "Experimental public dashboard for Thailand’s smart city pulse",
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

function parseLayerSet(raw: string | null) {
  if (!raw) {
    return layerSeed.filter((item) => item.active).map((item) => item.id);
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

function normalizeCitySlug(value?: string) {
  if (!value) {
    return "";
  }

  return value.toLowerCase().replace(/\s+/g, "-");
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
  const city = searchParams.get("city") ?? "bangkok";
  const domain = searchParams.get("domain") ?? "";
  const rawLayers = searchParams.get("layers");
  const layers = useMemo(() => parseLayerSet(rawLayers), [rawLayers]);
  const cityFilter = view === "national" ? "" : city;
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

  const overviewFallback = createOverviewSnapshot({
    view,
    timeRange,
    city,
    domain: domain || undefined,
    layers
  });
  const projectFallback = cloneSeed(projectSeed.filter((project) => !cityFilter || project.citySlug === cityFilter));
  const newsFallback = cloneSeed(
    newsSeed.filter((item) => {
      if (cityFilter && item.citySlug && item.citySlug !== cityFilter) return false;
      if (domain && item.domainSlug && item.domainSlug !== domain) return false;
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
    queryKey: ["projects", city, domain],
    queryFn: () =>
      fetchFromApi<ProjectRecord[]>(
        `/api/projects${cityFilter ? `?city=${cityFilter}` : "?"}${domain ? `${cityFilter ? "&" : ""}domain=${domain}` : ""}`,
        projectFallback,
        Array.isArray
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const newsQuery = useQuery({
    queryKey: ["news", city, domain],
    queryFn: () =>
      fetchFromApi<NewsItem[]>(
        `/api/news?limit=8${cityFilter ? `&city=${cityFilter}` : ""}${domain ? `&domain=${domain}` : ""}`,
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
    domain,
    layers,
    overview,
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
    domain,
    layers,
    overview,
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
    time
  } = useDashboardData(searchParams);

  const copy = copyDeck[lang];
  const selectedCity = overview.cities.find((item) => item.slug === city) ?? overview.cities[0];
  const selectedDomain = overview.domains.find((item) => item.slug === domain);
  const knownCitySlugs = new Set(overview.cities.map((item) => item.slug));
  const knownCitySlugsKey = overview.cities.map((item) => item.slug).join(",");
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
  const compactSources = sources.slice(0, 4);
  const compactCities = overview.cities.slice(0, 4);
  const visibleTrends = trendWatchItems.slice(0, 3);
  const compactMedia = mediaFeeds.slice(0, 3);
  const activityItems = activity.slice(0, 6);
  const timeZones = time.zones.slice(0, 3);
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
  const satelliteToolbarOptions = satelliteToggleOptions.filter((item) => item.id !== "satellite-night-lights");
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
    "satellite-night-lights": lang === "th" ? "แสงเมืองยามค่ำจาก NASA GIBS" : "NASA GIBS night-light intensity",
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
          ? "ภาพดาวเทียมจริง พืชพรรณ ละอองลอย และแสงกลางคืนพร้อมใช้งาน"
          : "True color, vegetation, aerosol, and night-light satellite layers are online."
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
    active: preset.layers.every((layerId) => layers.includes(layerId))
  }));

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
      domainSlug: selectedDomain?.slug,
      domainLabel: selectedDomain?.title.en,
      activeLayers: layers,
      executiveSignal,
      watchpoints: [topAqiFeature?.title, hottestWeatherFeature?.title].filter(Boolean) as string[]
    }),
    [view, selectedCity, selectedDomain, layers, executiveSignal, topAqiFeature, hottestWeatherFeature]
  );
  const assistantContextTags = [
    view,
    localize(lang, selectedCity.name),
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

  function buildStableParams() {
    const next = new URLSearchParams();
    next.set("lang", lang);
    next.set("view", view);
    next.set("timeRange", timeRange);
    next.set("city", city);
    next.set("basemap", basemap);
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

  const stableParamsString = buildStableParams().toString();

  useEffect(() => {
    if (searchParams.toString() === stableParamsString) {
      return;
    }

    startTransition(() => {
      setSearchParams(buildStableParams(), { replace: true });
    });
  }, [searchParams, stableParamsString, setSearchParams]);

  function updateParam(key: string, value: string) {
    const next = buildStableParams();
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
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
      <div className="partner-bar">
        <img src="/mdes.png" alt="MDES" className="partner-logo" />
        <img src="/Logo depa-01.png" alt="depa" className="partner-logo" />
        <img src="/for dark BG.png" alt="SLIC" className="partner-logo" />
        <img src="/Smart City Logo-02.png" alt="Smart City Thailand Office" className="partner-logo" />
        <img src="/Logo on White BG-01.jpg" alt="Smart City Thailand Monitor" className="partner-logo" />
      </div>
      <header className="topbar">
        <div className="brand-cluster">
          <img src="/Logo depa-01.png" alt="depa" className="brand-logo" />
          <img src="/Smart City Logo-02.png" alt="Smart City Thailand Office" className="brand-logo smart-city-logo" />
          <img src="/mdes.png" alt="MDES" className="brand-logo secondary" />
          <div className="brand-copy">
            <p className="eyebrow">{copy.brandEyebrow}</p>
            <h1>{copy.title}</h1>
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
            {(["24h", "7d", "30d", "90d"] as TimeRange[]).map((option) => (
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

      <main className="dashboard-shell">
        <section className="card map-hero" id="map">
          <div className="card-header">
            <span className="eyebrow">{copy.map}</span>
            <span className="status-pill">
              {view === "national" && layers.includes("smart-city-thailand") ? "Thailand Coverage" : view === "national" ? "Thailand" : "Bangkok Passages"}
            </span>
          </div>

          <div className="thai-map">
            <InteractiveMap
              locale={lang}
              view={view}
              citySlug={city}
              domainSlug={domain || undefined}
              basemap={basemap}
              layers={layers}
              projects={projects}
              news={news}
              featureCollections={mapFeatures}
              recenterSignal={recenterSignal}
            />
            <div className="map-overlay">
              <div className="map-caption">
                <strong>{view === "national" ? "Thailand" : localize(lang, selectedCity.name)}</strong>
                <span>{view === "national" ? "Smart City coverage footprint" : localize(lang, selectedCity.region)}</span>
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
                    const presetActive = preset.layers.every((item) => layers.includes(item));

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
                  {satelliteToolbarOptions.map((item) => (
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
              </div>
              <button className="chip" onClick={() => setRecenterSignal((value) => value + 1)}>
                {copy.recenter}
              </button>
              <div className="map-city-list">
                {overview.cities.map((item) => (
                  <button
                    key={item.slug}
                    className={item.slug === city ? "map-city-button active" : "map-city-button"}
                    onClick={() => {
                      const next = buildStableParams();
                      next.set("city", item.slug);
                      next.set("view", "city");
                      startTransition(() => {
                        setSearchParams(next);
                        setRecenterSignal((v) => v + 1);
                      });
                    }}
                  >
                    {localize(lang, item.name)}
                  </button>
                ))}
              </div>
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
              {lang === "th" ? "Ops room • city signals • satellite overlays" : "Ops room • city signals • satellite overlays"}
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
              <div className="city-intel-focus">
                <span className="eyebrow">{copy.smartFocus}</span>
                <p>{localize(lang, selectedCity.focus)}</p>
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
            </div>
          </div>
        </section>

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
                  const presetActive = preset.layers.every((item) => layers.includes(item));

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
                    <article key={item.id} className="headline-item">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <h3>{copy.external}</h3>
                <div className="compact-list">
                  {externalNews.map((item) => (
                    <article key={item.id} className="headline-item">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </article>
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
                <article key={project.id} className="stack-item">
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
                </article>
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
                <article key={source.id} className={`api-watch-item ${source.freshnessStatus}`}>
                  <div className="stack-title">
                    <strong>{source.name}</strong>
                    <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                  </div>
                  <small>{source.message}</small>
                </article>
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
              <span className="eyebrow">{copy.compare}</span>
              <span className="eyebrow">{overview.cities.length}</span>
            </div>
            <div className="compare-table tile-scroll">
              {compactCities.map((item) => (
                <div key={item.slug} className={item.slug === city ? "compare-row active" : "compare-row"}>
                  <button
                    onClick={() => {
                      const next = buildStableParams();
                      next.set("city", item.slug);
                      next.set("view", "city");
                      startTransition(() => {
                        setSearchParams(next);
                        setRecenterSignal((v) => v + 1);
                      });
                    }}
                  >
                    {localize(lang, item.name)}
                  </button>
                  <span>{Math.round(item.scores.reduce((sum, score) => sum + score.score, 0) / item.scores.length)}</span>
                </div>
              ))}
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

              <div className="impact-headline">
                <span className="eyebrow">{copy.latestSignal}</span>
                <strong>{satelliteNarrative}</strong>
                <small>{satelliteDigest.status.message}</small>
              </div>

              <div className="satellite-section-label">{copy.satelliteLivePreviews}</div>
              <div className="satellite-preview-grid">
                {satellitePreviewCards.map((preview) => (
                  <article key={preview.id} className="satellite-preview-card">
                    <div className="satellite-preview-frame">
                      <img
                        src={buildApiUrl(preview.previewUrl)}
                        alt={`${localize(lang, preview.title)} satellite preview`}
                        loading="lazy"
                      />
                    </div>
                    <div className="satellite-preview-copy">
                      <div className="stack-title">
                        <strong>{localize(lang, preview.title)}</strong>
                        <span className="status-pill">{preview.collectionId}</span>
                      </div>
                      <small>{localize(lang, preview.description)}</small>
                      <small>{localize(lang, preview.legend)}</small>
                      <small>
                        {copy.satelliteSceneDate}: {formatUtcDateTime(preview.sceneDate)}
                        {preview.cloudCover !== undefined ? ` • ${copy.satelliteCloudCover} ${Math.round(preview.cloudCover)}%` : ""}
                      </small>
                      {!preview.available ? <small>{copy.satelliteCredentialsNeeded}</small> : null}
                    </div>
                  </article>
                ))}
              </div>

              <div className="satellite-section-label">{copy.satelliteMetrics}</div>
              <div className="satellite-metric-grid">
                {satelliteMetrics.map((metric) => (
                  <div key={metric.id} className="satellite-metric-item">
                    <span className="eyebrow">{localize(lang, metric.title)}</span>
                    <strong>{metric.displayValue}</strong>
                    <small>{localize(lang, metric.description)}</small>
                  </div>
                ))}
              </div>

              <div className="satellite-scene-list">
                <div className="card-header">
                  <span className="eyebrow">{copy.satelliteRecentScenes}</span>
                  <span className="status-pill">{satelliteStatusLabel}</span>
                </div>
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
