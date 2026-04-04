import { cloneSeed, publicCctvCameras as seededPublicCctvCameras } from "@smart-city/shared";
import type { LocalizedText, PublicCctvCamera } from "@smart-city/shared";
import { fetchJsonOrNull } from "../adapters/common.js";
import { config } from "../config.js";
import { loadDurableJsonSnapshot, persistDurableJsonSnapshot } from "../data/durableStore.js";

interface LongdoCameraFeedItem {
  title?: string;
  camid?: string;
  latitude?: string | number;
  longitude?: string | number;
  organization?: string;
  incity?: string;
  imgurl?: string;
}

interface ProbeResult {
  ok: boolean;
  statusCode: number | null;
}

const PUBLIC_CCTV_FEED_URL = "https://camera.longdo.com/feed/?command=json";
const DUPLICATE_DISTANCE_DEGREES = 0.0015;
const SIGNAL_DOWN: LocalizedText = {
  th: "สัญญาณขัดข้อง",
  en: "Signal down"
};
const SIGNAL_LIVE: LocalizedText = {
  th: "สัญญาณพร้อมใช้งาน",
  en: "Live signal ready"
};

let cacheLoaded = false;
let cachedPayload:
  | {
      expiresAt: number;
      updatedAt: string;
      cameras: PublicCctvCamera[];
    }
  | null = null;
let refreshPromise: Promise<PublicCctvCamera[]> | null = null;
let writeQueue = Promise.resolve();

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

function getPakKretFallbackPreview(cameraId: string) {
  return cameraId.startsWith("CAMPK")
    ? `https://camera1.iticfoundation.org/jpeg2.php?camid=${encodeURIComponent(cameraId)}`
    : "";
}

function uniqueUrls(urls: string[]) {
  return urls.filter((value, index, values) => value && values.indexOf(value) === index);
}

function getCandidatePreviewUrls(camera: PublicCctvCamera) {
  return uniqueUrls([camera.previewUrl ?? "", camera.imageUrl, getPakKretFallbackPreview(camera.cameraId)]);
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { th?: unknown }).th === "string" &&
      typeof (value as { en?: unknown }).en === "string"
  );
}

function isPublicCctvCameraRecord(value: unknown): value is PublicCctvCamera {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.cameraId === "string" &&
    typeof record.source === "string" &&
    typeof record.lat === "number" &&
    typeof record.lon === "number" &&
    typeof record.imageUrl === "string" &&
    typeof record.zone === "string" &&
    typeof record.status === "string" &&
    isLocalizedText(record.label)
  );
}

function persistPublicCctvSnapshot(cameras: PublicCctvCamera[], updatedAt: string) {
  const payload = {
    updatedAt,
    total: cameras.length,
    live: cameras.filter((camera) => camera.status === "live").length,
    offline: cameras.filter((camera) => camera.status === "offline").length,
    cameras
  };

  writeQueue = writeQueue
    .then(() => persistDurableJsonSnapshot("public-cctv", config.cctvSnapshotPath, payload))
    .catch((error) => {
      console.warn("Failed to persist public CCTV snapshot", error);
    });

  return writeQueue;
}

async function ensurePersistedCacheLoaded() {
  if (cacheLoaded) {
    return;
  }

  cacheLoaded = true;

  try {
    const parsed = await loadDurableJsonSnapshot<{ updatedAt?: string; cameras?: unknown }>(
      "public-cctv",
      config.cctvSnapshotPath
    );
    if (!parsed) {
      return;
    }
    const persistedCameras = Array.isArray(parsed.cameras)
      ? parsed.cameras.filter((camera): camera is PublicCctvCamera => isPublicCctvCameraRecord(camera))
      : [];

    if (persistedCameras.length > 0) {
      cachedPayload = {
        expiresAt: config.allowLiveFetch ? 0 : Date.now() + Math.max(config.cctvCacheTtlMs, 60000),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        cameras: cloneSeed(persistedCameras)
      };
    }
  } catch {
    // Ignore missing or invalid persisted CCTV state.
  }
}

async function probePreviewUrl(url: string): Promise<ProbeResult> {
  if (!url || !config.allowLiveFetch) {
    return { ok: false, statusCode: null };
  }

  const methods: RequestInit["method"][] = ["HEAD", "GET"];

  for (const method of methods) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(Math.max(config.cctvProbeTimeoutMs, 500)),
        headers: method === "GET" ? { Range: "bytes=0-0" } : undefined
      });
      const contentType = response.headers.get("content-type") ?? "";
      const isImageResponse = contentType === "" || contentType.startsWith("image/");

      if (response.ok && isImageResponse) {
        return { ok: true, statusCode: response.status };
      }

      if (method === "HEAD" && response.status === 405) {
        continue;
      }

      return { ok: false, statusCode: response.status };
    } catch {
      // Try the next method or fallback URL.
    }
  }

  return { ok: false, statusCode: null };
}

async function mapWithConcurrency<T, TResult>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<TResult>
) {
  const results = new Array<TResult>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
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
  const previewUrl = String(item.imgurl).trim();

  return {
    id: `longdo-${slugify(cameraId)}`,
    cameraId,
    label: { th: title, en: title },
    source,
    lat,
    lon,
    imageUrl: previewUrl,
    previewUrl,
    status: "live",
    statusDetail: SIGNAL_LIVE,
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

async function buildPublicCctvBaseSnapshot() {
  const liveFeed = await fetchJsonOrNull<LongdoCameraFeedItem[]>(PUBLIC_CCTV_FEED_URL);
  const liveCameras = Array.isArray(liveFeed)
    ? liveFeed.map((item) => normalizeLongdoCamera(item)).filter((item): item is PublicCctvCamera => Boolean(item))
    : [];

  return liveCameras.length > 0 ? mergePublicCameras(liveCameras) : cloneSeed(seededPublicCctvCameras);
}

async function enrichCameraSignals(cameras: PublicCctvCamera[]) {
  const checkedAt = new Date().toISOString();
  const concurrency = Math.max(1, config.cctvProbeConcurrency);

  return mapWithConcurrency(cameras, concurrency, async (camera) => {
    const previewCandidates = getCandidatePreviewUrls(camera);
    let lastStatusCode: number | null = null;
    let lastSuccessfulAt = camera.lastSuccessfulAt;

    for (const previewUrl of previewCandidates) {
      const result = await probePreviewUrl(previewUrl);
      if (result.ok) {
        lastSuccessfulAt = checkedAt;
        return {
          ...camera,
          previewUrl,
          status: "live" as const,
          statusDetail: SIGNAL_LIVE,
          lastCheckedAt: checkedAt,
          lastSuccessfulAt,
          statusCode: result.statusCode
        };
      }

      if (result.statusCode !== null) {
        lastStatusCode = result.statusCode;
      }
    }

    return {
      ...camera,
      previewUrl: previewCandidates[previewCandidates.length - 1] ?? camera.previewUrl ?? camera.imageUrl,
      status: "offline" as const,
      statusDetail: SIGNAL_DOWN,
      lastCheckedAt: checkedAt,
      lastSuccessfulAt,
      statusCode: lastStatusCode
    };
  });
}

export async function refreshPublicCctvSnapshot(force = false): Promise<PublicCctvCamera[]> {
  await ensurePersistedCacheLoaded();

  if (!force && cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return cloneSeed(cachedPayload.cameras);
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const cameras = await enrichCameraSignals(await buildPublicCctvBaseSnapshot());
    const updatedAt = new Date().toISOString();

    cachedPayload = {
      expiresAt: Date.now() + Math.max(config.cctvCacheTtlMs, 60000),
      updatedAt,
      cameras
    };

    await persistPublicCctvSnapshot(cameras, updatedAt);
    return cloneSeed(cameras);
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function getPublicCctvCameras(): Promise<PublicCctvCamera[]> {
  await ensurePersistedCacheLoaded();

  if (cachedPayload) {
    if (cachedPayload.expiresAt <= Date.now() && config.allowLiveFetch) {
      void refreshPublicCctvSnapshot().catch(() => {
        // Serve the last known snapshot if background refresh fails.
      });
    }

    return cloneSeed(cachedPayload.cameras);
  }

  if (!config.allowLiveFetch) {
    return cloneSeed(seededPublicCctvCameras);
  }

  try {
    return await refreshPublicCctvSnapshot();
  } catch {
    return cloneSeed(seededPublicCctvCameras);
  }
}
