import { cloneSeed, publicCctvCameras as seededPublicCctvCameras } from "@smart-city/shared";
import type { PublicCctvCamera } from "@smart-city/shared";
import { fetchJsonOrNull } from "../adapters/common.js";

interface LongdoCameraFeedItem {
  title?: string;
  camid?: string;
  latitude?: string | number;
  longitude?: string | number;
  organization?: string;
  incity?: string;
  imgurl?: string;
}

const PUBLIC_CCTV_FEED_URL = "https://camera.longdo.com/feed/?command=json";
const CACHE_TTL_MS = 5 * 60 * 1000;
const DUPLICATE_DISTANCE_DEGREES = 0.0015;

let cachedPayload:
  | {
      expiresAt: number;
      cameras: PublicCctvCamera[];
    }
  | null = null;

function toFiniteNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hasUsablePreviewImage(item: LongdoCameraFeedItem) {
  const imageUrl = String(item.imgurl ?? "").trim();
  return imageUrl !== "" && !imageUrl.includes("X.X.X.X:YYYY") && !imageUrl.endsWith("camid=");
}

function normalizeLongdoCamera(item: LongdoCameraFeedItem): PublicCctvCamera | null {
  const title = String(item.title ?? "").trim();
  const cameraId = String(item.camid ?? "").trim();
  const lat = toFiniteNumber(item.latitude);
  const lon = toFiniteNumber(item.longitude);

  if (!title || !cameraId || lat === null || lon === null || !hasUsablePreviewImage(item)) {
    return null;
  }

  const sourceOrg = String(item.organization ?? "").trim();
  const zone = item.incity === "Y" ? "urban-traffic" : "regional-traffic";
  const source =
    sourceOrg && sourceOrg !== "iTIC Motion"
      ? `${sourceOrg} via iTIC / Longdo`
      : "iTIC / Longdo Traffic";

  return {
    id: `longdo-${slugify(cameraId)}`,
    cameraId,
    label: { th: title, en: title },
    source,
    lat,
    lon,
    imageUrl: String(item.imgurl).trim(),
    status: "live",
    zone
  };
}

function isDuplicateCamera(left: PublicCctvCamera, right: PublicCctvCamera) {
  if (left.cameraId === right.cameraId) {
    return true;
  }

  const latDiff = Math.abs(left.lat - right.lat);
  const lonDiff = Math.abs(left.lon - right.lon);
  return latDiff <= DUPLICATE_DISTANCE_DEGREES && lonDiff <= DUPLICATE_DISTANCE_DEGREES;
}

function mergePublicCameras(liveCameras: PublicCctvCamera[]) {
  const merged = cloneSeed(seededPublicCctvCameras);

  liveCameras.forEach((camera) => {
    if (!merged.some((existing) => isDuplicateCamera(existing, camera))) {
      merged.push(camera);
    }
  });

  return merged;
}

export async function getPublicCctvCameras(): Promise<PublicCctvCamera[]> {
  if (cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return cloneSeed(cachedPayload.cameras);
  }

  const liveFeed = await fetchJsonOrNull<LongdoCameraFeedItem[]>(PUBLIC_CCTV_FEED_URL);
  const liveCameras = Array.isArray(liveFeed)
    ? liveFeed.map((item) => normalizeLongdoCamera(item)).filter((item): item is PublicCctvCamera => Boolean(item))
    : [];

  const cameras = liveCameras.length > 0 ? mergePublicCameras(liveCameras) : cloneSeed(seededPublicCctvCameras);

  cachedPayload = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    cameras
  };

  return cloneSeed(cameras);
}
