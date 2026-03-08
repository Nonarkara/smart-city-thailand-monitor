import type {
  FreshnessStatus,
  MapFeatureCollection,
  MarketSnapshot,
  MediaFeedItem,
  NewsItem,
  OfficialImpactSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SocialListeningSnapshot,
  SyncHealthRecord,
  TimeSnapshot
} from "@smart-city/shared";
import { config } from "../config.js";

export interface AdapterSocialSignal {
  mentionCount: number;
  sentimentScore: number;
  sourceCount: number;
  positiveShare: number;
  dominantSource: string;
  topTerms: string[];
  sourceName: string;
}

export interface MonitoringCity {
  slug: string;
  labelTh: string;
  labelEn: string;
  regionTh: string;
  regionEn: string;
  lat: number;
  lon: number;
  population?: number;
}

export const thailandMonitoringCities: MonitoringCity[] = [
  {
    slug: "muang-thong-thani",
    labelTh: "เมืองทองธานี",
    labelEn: "Muang Thong Thani",
    regionTh: "นนทบุรี",
    regionEn: "Nonthaburi",
    lat: 13.9118,
    lon: 100.5512,
    population: 300000
  },
  {
    slug: "impact-core",
    labelTh: "ศูนย์ประชุมอิมแพ็ค",
    labelEn: "IMPACT Core",
    regionTh: "เมืองทองธานี",
    regionEn: "Muang Thong Thani",
    lat: 13.9128,
    lon: 100.5479,
    population: 90000
  },
  {
    slug: "pak-kret",
    labelTh: "ปากเกร็ด",
    labelEn: "Pak Kret",
    regionTh: "นนทบุรี",
    regionEn: "Nonthaburi",
    lat: 13.9062,
    lon: 100.4976,
    population: 210000
  },
  {
    slug: "chaeng-watthana",
    labelTh: "แจ้งวัฒนะ",
    labelEn: "Chaeng Watthana",
    regionTh: "กรุงเทพเหนือ",
    regionEn: "North Bangkok",
    lat: 13.8945,
    lon: 100.5676,
    population: 180000
  },
  {
    slug: "lak-si",
    labelTh: "หลักสี่",
    labelEn: "Lak Si",
    regionTh: "กรุงเทพเหนือ",
    regionEn: "North Bangkok",
    lat: 13.8864,
    lon: 100.5798,
    population: 100000
  },
  {
    slug: "don-mueang",
    labelTh: "ดอนเมือง",
    labelEn: "Don Mueang",
    regionTh: "กรุงเทพเหนือ",
    regionEn: "North Bangkok",
    lat: 13.9154,
    lon: 100.6074,
    population: 160000
  },
  {
    slug: "nonthaburi-civic",
    labelTh: "ศูนย์ราชการนนทบุรี",
    labelEn: "Nonthaburi Civic Center",
    regionTh: "นนทบุรี",
    regionEn: "Nonthaburi",
    lat: 13.8606,
    lon: 100.5148,
    population: 120000
  },
  {
    slug: "ngam-wong-wan",
    labelTh: "งามวงศ์วาน",
    labelEn: "Ngam Wong Wan",
    regionTh: "นนทบุรี",
    regionEn: "Nonthaburi",
    lat: 13.8556,
    lon: 100.5411,
    population: 140000
  },
  {
    slug: "pathumthani",
    labelTh: "ปทุมธานี",
    labelEn: "Pathum Thani",
    regionTh: "ภาคกลาง",
    regionEn: "Central",
    lat: 14.0208,
    lon: 100.525,
    population: 1200000
  },
  {
    slug: "bangkok-core",
    labelTh: "กรุงเทพชั้นใน",
    labelEn: "Bangkok Core",
    regionTh: "กรุงเทพมหานคร",
    regionEn: "Bangkok",
    lat: 13.7563,
    lon: 100.5018,
    population: 10539000
  }
];

export interface AdapterSyncResult {
  sourceId: string;
  status: FreshnessStatus;
  fetchedAt: string;
  message: string;
  sourceUrl: string;
  newsItems?: NewsItem[];
  projectRecords?: ProjectRecord[];
  mapFeatureCollections?: MapFeatureCollection[];
  mediaFeeds?: MediaFeedItem[];
  resiliencePatch?: Partial<ResilienceSnapshot>;
  socialListeningPatch?: Partial<SocialListeningSnapshot>;
  officialImpactPatch?: Partial<OfficialImpactSnapshot>;
  marketSnapshotPatch?: Partial<MarketSnapshot>;
  socialSignal?: AdapterSocialSignal;
  timeSnapshot?: TimeSnapshot;
}

export async function fetchJsonOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (!config.allowLiveFetch || !url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchTextOrNull(url: string, init?: RequestInit): Promise<string | null> {
  if (!config.allowLiveFetch || !url) {
    return null;
  }

  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

export function buildSyncRecord(result: AdapterSyncResult): SyncHealthRecord {
  return {
    sourceId: result.sourceId,
    status: result.status,
    fetchedAt: result.fetchedAt,
    message: result.message
  };
}

export function buildResult(input: {
  sourceId: string;
  status: FreshnessStatus;
  message: string;
  sourceUrl: string;
  newsItems?: NewsItem[];
  projectRecords?: ProjectRecord[];
  mapFeatureCollections?: MapFeatureCollection[];
  mediaFeeds?: MediaFeedItem[];
  resiliencePatch?: Partial<ResilienceSnapshot>;
  socialListeningPatch?: Partial<SocialListeningSnapshot>;
  officialImpactPatch?: Partial<OfficialImpactSnapshot>;
  marketSnapshotPatch?: Partial<MarketSnapshot>;
  socialSignal?: AdapterSocialSignal;
  timeSnapshot?: TimeSnapshot;
}): AdapterSyncResult {
  return {
    sourceId: input.sourceId,
    status: input.status,
    fetchedAt: new Date().toISOString(),
    message: input.message,
    sourceUrl: input.sourceUrl,
    newsItems: input.newsItems,
    projectRecords: input.projectRecords,
    mapFeatureCollections: input.mapFeatureCollections,
    mediaFeeds: input.mediaFeeds,
    resiliencePatch: input.resiliencePatch,
    socialListeningPatch: input.socialListeningPatch,
    officialImpactPatch: input.officialImpactPatch,
    marketSnapshotPatch: input.marketSnapshotPatch,
    socialSignal: input.socialSignal,
    timeSnapshot: input.timeSnapshot
  };
}
