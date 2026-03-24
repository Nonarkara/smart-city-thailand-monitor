import type { GeoFeatureRecord, MapFeatureCollection, MediaFeedItem, NewsItem } from "@smart-city/shared";
import { buildResult, fetchJsonOrNull, thailandMonitoringCities, type MonitoringCity } from "./common.js";
import type { AdapterSyncResult } from "./common.js";

type TrafficEventClass = "accident" | "closure" | "breakdown" | "construction" | "traffic";
type TrafficEventStatus = "active" | "scheduled" | "expired";

interface LongdoEvent {
  eid?: string | number;
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  latitude?: string | number;
  longitude?: string | number;
  type?: string | number;
  start?: string;
  stop?: string;
  contributor?: string;
  icon?: string;
  showlevel?: string | number;
  severity?: string | number;
  images?: string[];
}

interface LongdoCamera {
  title?: string;
  link?: string;
  camid?: string;
  lastupdate?: string;
  latitude?: string | number;
  longitude?: string | number;
  organization?: string;
  vdourl?: string;
  imgurl?: string;
  hls_url?: string;
}

interface NormalizedTrafficEvent {
  id: string;
  title: string;
  titleTh: string;
  titleEn: string;
  description: string;
  descriptionTh: string;
  descriptionEn: string;
  latitude: number;
  longitude: number;
  eventClass: TrafficEventClass;
  status: TrafficEventStatus;
  severityLabel: "high" | "watch" | "monitor";
  severityScore: number;
  priorityScore: number;
  startedAt?: string;
  endedAt?: string;
  city?: MonitoringCity;
  contributor?: string;
  icon?: string;
  imageUrl?: string;
}

const sourceId = "itic-traffic";
const sourceUrl = "https://traffic.longdo.com";
const eventUrl = "https://event.longdo.com/feed/json";
const cameraUrl = "https://camera.longdo.com/feed/?command=json";

function parseCoordinate(value: string | number | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseThaiTimestamp(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(`${normalized}+07:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function inferNearestCity(latitude: number, longitude: number) {
  return (
    [...thailandMonitoringCities].sort((left, right) => {
      const leftDistance =
        Math.abs(left.lat - latitude) + Math.abs((left.lon - longitude) * Math.cos((latitude * Math.PI) / 180));
      const rightDistance =
        Math.abs(right.lat - latitude) + Math.abs((right.lon - longitude) * Math.cos((latitude * Math.PI) / 180));
      return leftDistance - rightDistance;
    })[0] ?? undefined
  );
}

function getTrafficEventClass(event: LongdoEvent): TrafficEventClass {
  const typeCode = Number(event.type ?? 0);
  if (typeCode === 3) {
    return "accident";
  }

  if (typeCode === 18) {
    return "closure";
  }

  const haystack = [
    event.icon,
    event.title_en,
    event.title,
    event.description_en,
    event.description
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");

  if (/accident|crash|collision|อุบัติเหตุ/.test(haystack)) {
    return "accident";
  }

  if (/closure|closed|diversion|blocked|ปิด|เบี่ยง|กีดขวาง/.test(haystack)) {
    return "closure";
  }

  if (/breakdown|stall|รถเสีย/.test(haystack)) {
    return "breakdown";
  }

  if (/construction|mrta|roadwork|ก่อสร้าง/.test(haystack)) {
    return "construction";
  }

  return "traffic";
}

function getTrafficEventStatus(startedAt?: string, endedAt?: string): TrafficEventStatus {
  const now = Date.now();
  const startMs = startedAt ? new Date(startedAt).getTime() : Number.NaN;
  const endMs = endedAt ? new Date(endedAt).getTime() : Number.NaN;

  if (!Number.isNaN(endMs) && endMs < now) {
    return "expired";
  }

  if (!Number.isNaN(startMs) && startMs > now) {
    return "scheduled";
  }

  return "active";
}

function getSeverityLabel(eventClass: TrafficEventClass, severityScore: number) {
  if (eventClass === "accident" || severityScore >= 3) {
    return "high" as const;
  }

  if (eventClass === "closure" || eventClass === "breakdown" || severityScore >= 1) {
    return "watch" as const;
  }

  return "monitor" as const;
}

function getPriorityScore(eventClass: TrafficEventClass, status: TrafficEventStatus, severityScore: number) {
  const classWeight: Record<TrafficEventClass, number> = {
    accident: 92,
    closure: 84,
    breakdown: 72,
    construction: 66,
    traffic: 54
  };
  const statusWeight: Record<TrafficEventStatus, number> = {
    active: 14,
    scheduled: 6,
    expired: 0
  };

  return classWeight[eventClass] + statusWeight[status] + severityScore * 6;
}

function describeTrafficEvent(eventClass: TrafficEventClass, status: TrafficEventStatus, description: string) {
  if (description) {
    return description;
  }

  const prefix =
    eventClass === "accident"
      ? "Live accident signal"
      : eventClass === "closure"
        ? "Road closure or diversion"
        : eventClass === "breakdown"
          ? "Vehicle breakdown signal"
          : eventClass === "construction"
            ? "Construction-related traffic impact"
            : "Traffic event";

  return status === "scheduled" ? `${prefix} scheduled ahead.` : `${prefix} active now.`;
}

function computeBounds(features: GeoFeatureRecord[]): [number, number, number, number] | undefined {
  const points = features
    .filter((feature) => feature.geometryType === "Point")
    .map((feature) => feature.coordinates)
    .filter(Array.isArray)
    .map((value) => [Number(value[0]), Number(value[1])] as [number, number])
    .filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude));

  if (points.length === 0) {
    return undefined;
  }

  return [
    Math.min(...points.map(([, latitude]) => latitude)),
    Math.min(...points.map(([longitude]) => longitude)),
    Math.max(...points.map(([, latitude]) => latitude)),
    Math.max(...points.map(([longitude]) => longitude))
  ];
}

function normalizeTrafficEvent(event: LongdoEvent): NormalizedTrafficEvent | null {
  const latitude = parseCoordinate(event.latitude);
  const longitude = parseCoordinate(event.longitude);
  if (latitude === null || longitude === null) {
    return null;
  }

  const id = String(event.eid ?? "").trim();
  if (!id) {
    return null;
  }

  const titleTh = normalizeText(event.title);
  const titleEn = normalizeText(event.title_en);
  const descriptionTh = normalizeText(event.description);
  const descriptionEn = normalizeText(event.description_en);
  const startedAt = parseThaiTimestamp(event.start);
  const endedAt = parseThaiTimestamp(event.stop);
  const eventClass = getTrafficEventClass(event);
  const status = getTrafficEventStatus(startedAt, endedAt);
  const severityScore = Math.max(0, Number(event.severity ?? 0));

  return {
    id,
    title: titleEn || titleTh || "Traffic event",
    titleTh: titleTh || titleEn || "เหตุการณ์จราจร",
    titleEn: titleEn || titleTh || "Traffic event",
    description: describeTrafficEvent(eventClass, status, descriptionEn || descriptionTh),
    descriptionTh: descriptionTh || descriptionEn || "อัปเดตสภาพจราจรสด",
    descriptionEn: descriptionEn || descriptionTh || "Live traffic operations update.",
    latitude,
    longitude,
    eventClass,
    status,
    severityLabel: getSeverityLabel(eventClass, severityScore),
    severityScore,
    priorityScore: getPriorityScore(eventClass, status, severityScore),
    startedAt,
    endedAt,
    city: inferNearestCity(latitude, longitude),
    contributor: normalizeText(event.contributor),
    icon: normalizeText(event.icon),
    imageUrl: event.images?.[0]
  };
}

export async function runIticSync(): Promise<AdapterSyncResult> {
  const fetchedAt = new Date().toISOString();
  const [events, cameras] = await Promise.all([
    fetchJsonOrNull<LongdoEvent[]>(eventUrl),
    fetchJsonOrNull<LongdoCamera[]>(cameraUrl)
  ]);

  if (!events && !cameras) {
    return buildResult({
      sourceId,
      sourceUrl,
      status: "stale",
      message: "Failed to fetch ITIC traffic data from Longdo feeds."
    });
  }

  const newsItems: NewsItem[] = [];
  const mapFeatureCollections: MapFeatureCollection[] = [];
  const mediaFeeds: MediaFeedItem[] = [];
  const normalizedEvents = (events ?? [])
    .map((event) => normalizeTrafficEvent(event))
    .filter((event): event is NormalizedTrafficEvent => Boolean(event))
    .filter((event) => event.status !== "expired")
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return new Date(right.startedAt ?? fetchedAt).getTime() - new Date(left.startedAt ?? fetchedAt).getTime();
    });

  if (normalizedEvents.length > 0) {
    const trafficFeatures: GeoFeatureRecord[] = normalizedEvents.slice(0, 120).map((event) => ({
      id: `itic-ev-${event.id}`,
      layerId: "itic-traffic",
      geometryType: "Point",
      coordinates: [event.longitude, event.latitude],
      title: event.title,
      description: event.description,
      properties: {
        city: event.city?.labelEn ?? null,
        citySlug: event.city?.slug ?? null,
        region: event.city?.regionEn ?? null,
        kind: event.eventClass,
        eventClass: event.eventClass,
        status: event.status,
        severityLabel: event.severityLabel,
        severityScore: event.severityScore,
        priorityScore: event.priorityScore,
        startedAt: event.startedAt ?? null,
        endedAt: event.endedAt ?? null,
        contributor: event.contributor ?? null
      },
      source: {
        sourceName: "iTIC / Longdo Traffic",
        sourceUrl,
        fetchedAt,
        publishedAt: event.startedAt ?? fetchedAt,
        freshnessStatus: "live",
        confidence: 0.94,
        fallbackMode: "live"
      }
    }));

    mapFeatureCollections.push({
      layerId: "itic-traffic",
      updatedAt: fetchedAt,
      source: {
        sourceName: "iTIC / Longdo Traffic",
        sourceUrl,
        fetchedAt,
        publishedAt: normalizedEvents[0]?.startedAt ?? fetchedAt,
        freshnessStatus: "live",
        confidence: 0.94,
        fallbackMode: "live"
      },
      bounds: computeBounds(trafficFeatures),
      features: trafficFeatures
    });

    normalizedEvents
      .filter((event) => event.eventClass !== "traffic")
      .slice(0, 12)
      .forEach((event) => {
        newsItems.push({
          id: `itic-news-${event.id}`,
          slug: `itic-news-${event.id}`,
          title: {
            th: event.titleTh,
            en: event.titleEn
          },
          excerpt: {
            th: event.descriptionTh,
            en: event.descriptionEn
          },
          kind: "external",
          citySlug: event.city?.slug,
          domainSlug: "mobility",
          publishedAt: event.startedAt ?? fetchedAt,
          source: {
            sourceName: "iTIC / Longdo Traffic",
            sourceUrl,
            fetchedAt,
            publishedAt: event.startedAt ?? fetchedAt,
            freshnessStatus: "live",
            confidence: 0.94,
            fallbackMode: "live"
          }
        });
      });
  }

  (cameras ?? [])
    .slice(0, 24)
    .forEach((camera, index) => {
      const latitude = parseCoordinate(camera.latitude);
      const longitude = parseCoordinate(camera.longitude);
      const nearestCity =
        latitude !== null && longitude !== null ? inferNearestCity(latitude, longitude) : undefined;
      const label = normalizeText(camera.title) || camera.camid || `ITIC camera ${index + 1}`;
      const externalUrl = camera.link || camera.vdourl || sourceUrl;
      const embedUrl = camera.hls_url || camera.vdourl || camera.imgurl || camera.link;

      mediaFeeds.push({
        id: `itic-cam-${camera.camid ?? index}`,
        kind: "webcam",
        label,
        region: (nearestCity?.labelEn ?? normalizeText(camera.organization)) || "Thailand",
        embedUrl,
        externalUrl,
        isEmbeddable: Boolean(embedUrl),
        status: embedUrl ? "live" : "unknown",
        source: {
          sourceName: normalizeText(camera.organization) || "iTIC Traffic Camera",
          sourceUrl: externalUrl,
          fetchedAt,
          publishedAt: parseThaiTimestamp(camera.lastupdate) ?? fetchedAt,
          freshnessStatus: embedUrl ? "live" : "manual",
          confidence: embedUrl ? 0.9 : 0.72,
          fallbackMode: embedUrl ? "live" : "manual"
        }
      });
    });

  const activeEvents = normalizedEvents.filter((event) => event.status === "active").length;
  const scheduledClosures = normalizedEvents.filter(
    (event) => event.status === "scheduled" && event.eventClass === "closure"
  ).length;

  return buildResult({
    sourceId,
    sourceUrl,
    status: "live",
    message: `Synchronized ${activeEvents} active traffic events, ${scheduledClosures} scheduled closures, and ${mediaFeeds.length} cameras.`,
    newsItems,
    mapFeatureCollections,
    mediaFeeds
  });
}
