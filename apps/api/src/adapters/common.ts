import type {
  FreshnessStatus,
  MapFeatureCollection,
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
    socialSignal: input.socialSignal,
    timeSnapshot: input.timeSnapshot
  };
}
