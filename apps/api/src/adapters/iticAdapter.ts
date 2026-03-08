import { buildResult, fetchJsonOrNull } from "./common.js";
import type { AdapterSyncResult } from "./common.js";
import type { NewsItem, MapFeatureCollection, MediaFeedItem } from "@smart-city/shared";

interface LongdoEvent {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: number;
  start: string;
  stop: string;
}

interface LongdoCamera {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  url: string;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

export async function runIticSync(): Promise<AdapterSyncResult> {
  const sourceId = "itic-traffic";
  const sourceUrl = "https://iticfoundation.org";
  
  const eventUrl = "https://event.longdo.com/feed/json";
  const cameraUrl = "https://camera.longdo.com/feed/?command=json";

  const [events, cameras] = await Promise.all([
    fetchJsonOrNull<LongdoEvent[]>(eventUrl),
    fetchJsonOrNull<LongdoCamera[]>(cameraUrl)
  ]);

  if (!events && !cameras) {
    return buildResult({
      sourceId,
      sourceUrl,
      status: "stale",
      message: "Failed to fetch ITIC traffic data from Longdo feeds"
    });
  }

  const newsItems: NewsItem[] = [];
  const mapFeatureCollections: MapFeatureCollection[] = [];
  const mediaFeeds: MediaFeedItem[] = [];

  // Process Events
  if (events) {
    const trafficFeatures: MapFeatureCollection = {
      layerId: "itic-traffic",
      updatedAt: new Date().toISOString(),
      source: {
        sourceName: "iTIC / Longdo Traffic",
        sourceUrl: "https://traffic.longdo.com",
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "live",
        confidence: 0.9,
        fallbackMode: "live"
      },
      features: events.map(ev => ({
        id: `itic-ev-${ev.id}`,
        layerId: "itic-traffic",
        geometryType: "Point",
        coordinates: [ev.longitude, ev.latitude],
        title: ev.title,
        description: ev.description,
        properties: {
          kind: "traffic",
          type: ev.type
        },
        source: {
          sourceName: "iTIC / Longdo Traffic",
          sourceUrl: "https://traffic.longdo.com",
          fetchedAt: new Date().toISOString(),
          publishedAt: ev.start,
          freshnessStatus: "live",
          confidence: 0.9,
          fallbackMode: "live"
        }
      }))
    };
    mapFeatureCollections.push(trafficFeatures);

    // Filter relevant events for news (e.g. accidents, closures)
    events.slice(0, 10).forEach(ev => {
      const publishedAt = ev.start ? new Date(ev.start).toISOString() : new Date().toISOString();

      newsItems.push({
        id: `itic-news-${ev.id}`,
        slug: slugify(ev.title, `itic-news-${ev.id}`),
        title: { en: ev.title, th: ev.title },
        excerpt: { en: ev.description, th: ev.description },
        kind: "external",
        publishedAt,
        source: {
          sourceName: "iTIC / Longdo Traffic",
          sourceUrl: "https://traffic.longdo.com",
          fetchedAt: new Date().toISOString(),
          publishedAt,
          freshnessStatus: "live",
          confidence: 0.9,
          fallbackMode: "live"
        }
      });
    });
  }

  // Process Cameras
  if (cameras) {
    cameras.slice(0, 20).forEach(cam => {
      mediaFeeds.push({
        id: `itic-cam-${cam.id}`,
        kind: "webcam",
        label: cam.title,
        region: "Greater Bangkok",
        embedUrl: cam.url,
        externalUrl: `https://traffic.longdo.com/camera/${cam.id}`,
        isEmbeddable: true,
        status: "live",
        source: {
          sourceName: "iTIC Traffic Camera",
          sourceUrl: "https://traffic.longdo.com",
          fetchedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          freshnessStatus: "live",
          confidence: 0.95,
          fallbackMode: "live"
        }
      });
    });
  }

  return buildResult({
    sourceId,
    sourceUrl,
    status: "live",
    message: `Synchronized ${events?.length ?? 0} events and ${cameras?.length ?? 0} cameras`,
    newsItems,
    mapFeatureCollections,
    mediaFeeds
  });
}
