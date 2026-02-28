import type {
  FreshnessStatus,
  MapFeatureCollection,
  MediaFeedItem,
  NewsItem,
  ProjectRecord,
  ResilienceSnapshot,
  SyncHealthRecord,
  TimeSnapshot
} from "@smart-city/shared";
import { config } from "../config.js";

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
  timeSnapshot?: TimeSnapshot;
}

export async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  if (!config.allowLiveFetch || !url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
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
    timeSnapshot: input.timeSnapshot
  };
}
