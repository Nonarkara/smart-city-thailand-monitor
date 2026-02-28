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
    slug: "bangkok",
    labelTh: "กรุงเทพมหานคร",
    labelEn: "Bangkok",
    regionTh: "ภาคกลาง",
    regionEn: "Central",
    lat: 13.7563,
    lon: 100.5018,
    population: 10539000
  },
  {
    slug: "chiang-mai",
    labelTh: "เชียงใหม่",
    labelEn: "Chiang Mai",
    regionTh: "ภาคเหนือ",
    regionEn: "North",
    lat: 18.7883,
    lon: 98.9853,
    population: 1270000
  },
  {
    slug: "khon-kaen",
    labelTh: "ขอนแก่น",
    labelEn: "Khon Kaen",
    regionTh: "ภาคตะวันออกเฉียงเหนือ",
    regionEn: "Northeast",
    lat: 16.4322,
    lon: 102.8236,
    population: 412000
  },
  {
    slug: "phuket",
    labelTh: "ภูเก็ต",
    labelEn: "Phuket",
    regionTh: "ภาคใต้",
    regionEn: "South",
    lat: 7.8804,
    lon: 98.3923,
    population: 417000
  },
  {
    slug: "chon-buri",
    labelTh: "ชลบุรี",
    labelEn: "Chon Buri",
    regionTh: "ภาคตะวันออก",
    regionEn: "East",
    lat: 13.3611,
    lon: 100.9847,
    population: 1550000
  },
  {
    slug: "hat-yai",
    labelTh: "หาดใหญ่",
    labelEn: "Hat Yai",
    regionTh: "ภาคใต้",
    regionEn: "South",
    lat: 7.0084,
    lon: 100.4747,
    population: 415000
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
