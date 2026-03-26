import type {
  LocalizedText,
  SatelliteAreaOfInterest,
  SatelliteDigest,
  SatelliteMetric,
  SatellitePreviewItem,
  SatellitePreviewPresetId,
  SatelliteSceneRecord,
  SatelliteSearchResponse,
  SatelliteServiceStatus,
  SatelliteStatsResponse
} from "@smart-city/shared";
import { config } from "../config.js";

type PreviewPresetDefinition = {
  id: SatellitePreviewPresetId;
  collectionId: string;
  title: LocalizedText;
  description: LocalizedText;
  legend: LocalizedText;
  defaultNote: LocalizedText;
  timeRangeDays: number;
  maxCloudCoverage?: number;
  evalscript: string;
};

type TokenCacheEntry = {
  accessToken: string;
  expiresAt: number;
};

type PreviewCacheEntry = {
  body: Buffer;
  contentType: string;
  generatedAt: string;
  expiresAt: number;
};

const SATELLITE_DOCS_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html";
const THAILAND_AOI: SatelliteAreaOfInterest = {
  id: "thailand",
  label: {
    th: "ประเทศไทย",
    en: "Thailand"
  },
  bbox: [97.343, 5.612, 105.639, 20.465]
};
const TOKEN_SKEW_MS = 60_000;
const PREVIEW_CACHE_TTL_MS = 10 * 60_000;
const PREVIEW_IMAGE_WIDTH = 560;
const PREVIEW_IMAGE_HEIGHT = 720;

const PREVIEW_PRESETS: Record<SatellitePreviewPresetId, PreviewPresetDefinition> = {
  "true-color": {
    id: "true-color",
    collectionId: "sentinel-2-l2a",
    title: {
      th: "True color",
      en: "True color"
    },
    description: {
      th: "ภาพ Sentinel-2 แบบสีจริงสำหรับดูเมฆ เมือง และสภาพพื้นผิวล่าสุดของไทย",
      en: "Sentinel-2 true color for current cloud, urban, and land-surface context across Thailand."
    },
    legend: {
      th: "สีจริงจาก Sentinel-2 L2A",
      en: "Sentinel-2 L2A true-color composite"
    },
    defaultNote: {
      th: "คัดภาพล่าสุดที่เหมาะกับการดูบริบทประเทศ",
      en: "Uses the latest suitable scene for national context."
    },
    timeRangeDays: 14,
    maxCloudCoverage: 35,
    evalscript: `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B03", "B02", "dataMask"]
    }],
    output: {
      bands: 4
    }
  };
}

function evaluatePixel(sample) {
  return [
    2.5 * sample.B04,
    2.5 * sample.B03,
    2.5 * sample.B02,
    sample.dataMask
  ];
}`
  },
  vegetation: {
    id: "vegetation",
    collectionId: "sentinel-2-l2a",
    title: {
      th: "Vegetation",
      en: "Vegetation"
    },
    description: {
      th: "ภาพ NDVI ล่าสุดสำหรับดูความเขียว พื้นที่เกษตร และการเปลี่ยนแปลงพื้นที่สีเขียว",
      en: "Latest NDVI view for green cover, agriculture, and vegetation change."
    },
    legend: {
      th: "แดง = พื้นที่พืชพรรณหนาแน่น",
      en: "Red = denser vegetation response"
    },
    defaultNote: {
      th: "ใช้ Sentinel-2 ล่าสุดในช่วงเมฆไม่หนาแน่นเกินไป",
      en: "Uses the latest Sentinel-2 scene with manageable cloud cover."
    },
    timeRangeDays: 21,
    maxCloudCoverage: 40,
    evalscript: `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "dataMask"]
    }],
    output: {
      bands: 4
    }
  };
}

function ramp(value) {
  if (value < 0) {
    return [0.32, 0.2, 0.12];
  }
  if (value < 0.15) {
    return [0.74, 0.56, 0.2];
  }
  if (value < 0.35) {
    return [0.76, 0.78, 0.16];
  }
  if (value < 0.55) {
    return [0.42, 0.72, 0.17];
  }
  return [0.78, 0.1, 0.11];
}

function evaluatePixel(sample) {
  const ndvi = index(sample.B08, sample.B04);
  const color = ramp(ndvi);
  return [color[0], color[1], color[2], sample.dataMask];
}`
  },
  "flood-radar": {
    id: "flood-radar",
    collectionId: "sentinel-1-grd",
    title: {
      th: "Flood radar",
      en: "Flood radar"
    },
    description: {
      th: "ภาพเรดาร์ Sentinel-1 สำหรับดูน้ำท่วมและบริบทมรสุมเมื่อเมฆบังภาพเชิงแสง",
      en: "Sentinel-1 radar composite for flood and monsoon context when optical imagery is cloud-limited."
    },
    legend: {
      th: "น้ำมักมืดลง ขณะที่ผิวเมืองและพื้นผิวแข็งจะสว่างกว่า",
      en: "Water tends to darken while built surfaces appear brighter."
    },
    defaultNote: {
      th: "เรดาร์เหมาะกับฤดูฝนของไทยเพราะมองทะลุเมฆได้",
      en: "Radar is useful during Thailand's monsoon because it is not blocked by cloud."
    },
    timeRangeDays: 12,
    evalscript: `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["VV", "VH", "dataMask"]
    }],
    output: {
      bands: 4
    }
  };
}

function evaluatePixel(sample) {
  const vv = Math.max(sample.VV, 0.0001);
  const vh = Math.max(sample.VH, 0.0001);
  const water = Math.min((vv + vh) * 4.5, 1);
  const built = Math.min(vv * 7.5, 1);
  const rough = Math.min(vh * 10.5, 1);
  return [built, rough, water, sample.dataMask];
}`
  }
};

let tokenCache: TokenCacheEntry | null = null;
const previewCache = new Map<SatellitePreviewPresetId, PreviewCacheEntry>();

class SatelliteServiceError extends Error {
  readonly statusCode: number;
  readonly isConfigurationError: boolean;

  constructor(message: string, statusCode = 502, isConfigurationError = false) {
    super(message);
    this.name = "SatelliteServiceError";
    this.statusCode = statusCode;
    this.isConfigurationError = isConfigurationError;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function createServiceStatus(error?: Error): SatelliteServiceStatus {
  if (!config.copernicusClientId || !config.copernicusClientSecret) {
    return {
      provider: "copernicus-data-space",
      configured: false,
      available: false,
      mode: "not-configured",
      message: "Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET to enable live Sentinel Hub previews.",
      docsUrl: SATELLITE_DOCS_URL
    };
  }

  if (error) {
    return {
      provider: "copernicus-data-space",
      configured: true,
      available: false,
      mode: "degraded",
      message: error.message,
      docsUrl: SATELLITE_DOCS_URL
    };
  }

  return {
    provider: "copernicus-data-space",
    configured: true,
    available: true,
    mode: "oauth-live",
    message: "OAuth-backed Sentinel Hub previews, scene search, and EO freshness metrics are active.",
    docsUrl: SATELLITE_DOCS_URL
  };
}

function createUnavailablePreview(definition: PreviewPresetDefinition, updatedAt: string): SatellitePreviewItem {
  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    collectionId: definition.collectionId,
    previewUrl: `/api/satellite/preview/${definition.id}`,
    legend: definition.legend,
    note: {
      th: "ต้องเพิ่ม OAuth credentials ของ Copernicus ก่อนจึงจะดึงภาพสดได้",
      en: "Add Copernicus OAuth credentials before live previews can be rendered."
    },
    available: false,
    generatedAt: updatedAt
  };
}

function formatSceneAgeHours(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  if (value < 24) {
    return `${Math.round(value)}h`;
  }

  return `${(value / 24).toFixed(1)}d`;
}

function formatPercentage(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return `${Math.round(value)}%`;
}

function formatIndexValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(2);
}

function buildSearchWindow(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + TOKEN_SKEW_MS) {
    return tokenCache.accessToken;
  }

  if (!config.copernicusClientId || !config.copernicusClientSecret) {
    throw new SatelliteServiceError(
      "Copernicus OAuth credentials are not configured.",
      503,
      true
    );
  }

  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.copernicusClientId,
    client_secret: config.copernicusClientSecret
  });

  const response = await fetch(config.copernicusTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formBody.toString()
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || typeof payload.access_token !== "string") {
    throw new SatelliteServiceError(
      payload.error_description ?? "Copernicus OAuth token exchange failed.",
      response.status || 502
    );
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 600) * 1000
  };

  return payload.access_token;
}

async function searchScenes(collectionId: string, limit = 6) {
  const token = await getAccessToken();
  const window = buildSearchWindow(collectionId === "sentinel-5p-l2" ? 5 : 21);
  const response = await fetch(config.sentinelHubCatalogSearchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      bbox: THAILAND_AOI.bbox,
      datetime: `${window.from}/${window.to}`,
      collections: [collectionId],
      limit
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    features?: unknown[];
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new SatelliteServiceError(payload.message ?? payload.error ?? "Catalog search failed.", response.status || 502);
  }

  const features = Array.isArray(payload.features) ? payload.features : [];
  const scenes: SatelliteSceneRecord[] = [];

  for (const feature of features) {
    if (!isRecord(feature)) {
      continue;
    }

    const featureId = typeof feature.id === "string" ? feature.id : `${collectionId}-${Math.random().toString(36).slice(2)}`;
    const properties = isRecord(feature.properties) ? feature.properties : {};
    const assets = isRecord(feature.assets) ? feature.assets : {};
    const quicklook =
      (["thumbnail", "overview", "preview", "visual"].find((key) => {
        const asset = assets[key];
        return isRecord(asset) && typeof asset.href === "string";
      }) ?? "") || "";

    const quicklookAsset = quicklook ? assets[quicklook] : null;
    const cloudCover =
      numberOrNull(properties["eo:cloud_cover"]) ??
      numberOrNull(properties.cloudCover) ??
      numberOrNull(properties.cloudcover);

    scenes.push({
      id: featureId,
      collectionId,
      title:
        typeof properties.title === "string"
          ? properties.title
          : typeof properties.id === "string"
            ? properties.id
            : `${collectionId} scene`,
      timestamp:
        typeof properties.datetime === "string"
          ? properties.datetime
          : typeof properties.start_datetime === "string"
            ? properties.start_datetime
            : new Date().toISOString(),
      cloudCover: cloudCover ?? undefined,
      quicklookUrl: isRecord(quicklookAsset) && typeof quicklookAsset.href === "string" ? quicklookAsset.href : undefined
    });
  }

  return scenes.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
}

async function fetchPreviewImage(presetId: SatellitePreviewPresetId) {
  const cached = previewCache.get(presetId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const definition = PREVIEW_PRESETS[presetId];
  const token = await getAccessToken();
  const window = buildSearchWindow(definition.timeRangeDays);
  const dataFilter: Record<string, unknown> = {
    timeRange: {
      from: window.from,
      to: window.to
    }
  };

  if (definition.maxCloudCoverage !== undefined) {
    dataFilter.maxCloudCoverage = definition.maxCloudCoverage;
    dataFilter.mosaickingOrder = "leastCC";
  }

  const response = await fetch(config.sentinelHubProcessUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "image/png",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        bounds: {
          bbox: THAILAND_AOI.bbox
        },
        data: [
          {
            type: definition.collectionId,
            dataFilter
          }
        ]
      },
      output: {
        width: PREVIEW_IMAGE_WIDTH,
        height: PREVIEW_IMAGE_HEIGHT,
        responses: [
          {
            identifier: "default",
            format: {
              type: "image/png"
            }
          }
        ]
      },
      evalscript: definition.evalscript
    })
  });

  if (!response.ok) {
    const errorMessage = await response.text().catch(() => "Sentinel Hub process request failed.");
    throw new SatelliteServiceError(errorMessage || "Sentinel Hub process request failed.", response.status || 502);
  }

  const entry: PreviewCacheEntry = {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "image/png",
    generatedAt: new Date().toISOString(),
    expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS
  };

  previewCache.set(presetId, entry);
  return entry;
}

async function fetchNdviMetric() {
  const token = await getAccessToken();
  const window = buildSearchWindow(21);
  const response = await fetch(config.sentinelHubStatsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        bounds: {
          bbox: THAILAND_AOI.bbox
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: window.from,
                to: window.to
              },
              maxCloudCoverage: 35
            }
          }
        ]
      },
      aggregation: {
        timeRange: {
          from: window.from,
          to: window.to
        },
        aggregationInterval: {
          of: "P21D"
        },
        resx: "0.05",
        resy: "0.05",
        evalscript: `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "dataMask"]
    }],
    output: [
      {
        id: "indices",
        bands: 1,
        sampleType: "FLOAT32"
      },
      {
        id: "dataMask",
        bands: 1
      }
    ]
  };
}

function evaluatePixel(sample) {
  return {
    indices: [index(sample.B08, sample.B04)],
    dataMask: [sample.dataMask]
  };
}`
      },
      calculations: {
        indices: {
          statistics: {
            default: {
              percentiles: {
                k: [50]
              }
            }
          }
        }
      }
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: Array<{
      outputs?: Record<string, { bands?: Record<string, { stats?: Record<string, unknown> }> }>;
    }>;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new SatelliteServiceError(payload.message ?? payload.error ?? "Sentinel Hub statistics request failed.", response.status || 502);
  }

  const firstOutput = Array.isArray(payload.data) ? payload.data[payload.data.length - 1] : undefined;
  const outputs = isRecord(firstOutput?.outputs) ? firstOutput.outputs : {};

  for (const output of Object.values(outputs)) {
    if (!isRecord(output?.bands)) {
      continue;
    }

    for (const band of Object.values(output.bands)) {
      if (!isRecord(band?.stats)) {
        continue;
      }

      const stats = band.stats;
      if (isRecord(stats.percentiles)) {
        const percentile50 = numberOrNull(stats.percentiles["50.0"]) ?? numberOrNull(stats.percentiles["50"]);
        if (percentile50 !== null) {
          return percentile50;
        }
      }

      const mean = numberOrNull(stats.mean);
      if (mean !== null) {
        return mean;
      }
    }
  }

  return null;
}

function createDigestMetrics(latestScene: SatelliteSceneRecord | null, bestCloudCover: number | null, ndviMedian: number | null) {
  const latestSceneAgeHours =
    latestScene ? (Date.now() - new Date(latestScene.timestamp).getTime()) / (1000 * 60 * 60) : null;

  return [
    {
      id: "ndvi-median",
      title: {
        th: "NDVI median",
        en: "NDVI median"
      },
      description: {
        th: "ค่ากลาง NDVI ทั่วไทยจาก Sentinel-2 ในหน้าต่างล่าสุด",
        en: "Median nationwide NDVI from Sentinel-2 over the latest processing window."
      },
      collectionId: "sentinel-2-l2a",
      value: ndviMedian,
      displayValue: formatIndexValue(ndviMedian)
    },
    {
      id: "latest-scene-age",
      title: {
        th: "Latest scene age",
        en: "Latest scene age"
      },
      description: {
        th: "เวลาตั้งแต่ภาพ Sentinel-2 ล่าสุดที่ค้นได้สำหรับประเทศไทย",
        en: "Elapsed time since the latest searchable Sentinel-2 scene over Thailand."
      },
      collectionId: "sentinel-2-l2a",
      value: latestSceneAgeHours,
      displayValue: formatSceneAgeHours(latestSceneAgeHours),
      unit: "hours"
    },
    {
      id: "best-cloud-cover",
      title: {
        th: "Best cloud cover",
        en: "Best cloud cover"
      },
      description: {
        th: "เมฆปกคลุมน้อยที่สุดจากชุดภาพ Sentinel-2 ล่าสุดที่ค้นได้",
        en: "Lowest reported cloud cover among the latest searchable Sentinel-2 scenes."
      },
      collectionId: "sentinel-2-l2a",
      value: bestCloudCover,
      displayValue: formatPercentage(bestCloudCover),
      unit: "%"
    }
  ] satisfies SatelliteMetric[];
}

function createPlaceholderSvg(title: string, message: string) {
  const safeTitle = title.replace(/[<&>]/g, "");
  const safeMessage = message.replace(/[<&>]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="720" viewBox="0 0 560 720" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1d2942"/>
      <stop offset="100%" stop-color="#283b63"/>
    </linearGradient>
  </defs>
  <rect width="560" height="720" rx="26" fill="url(#bg)"/>
  <rect x="28" y="28" width="504" height="664" rx="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
  <text x="44" y="86" fill="#f5f7fb" font-family="IBM Plex Sans, Arial, sans-serif" font-size="28" font-weight="700">${safeTitle}</text>
  <text x="44" y="126" fill="#b8c5e2" font-family="IBM Plex Sans, Arial, sans-serif" font-size="18">Live Copernicus preview unavailable</text>
  <text x="44" y="182" fill="#f5f7fb" font-family="IBM Plex Sans, Arial, sans-serif" font-size="22">${safeMessage}</text>
  <text x="44" y="654" fill="#b8c5e2" font-family="IBM Plex Mono, monospace" font-size="16">Configure OAuth client credentials to enable live imagery.</text>
</svg>`;
}

async function resolveLiveSatelliteData() {
  const [sentinel2Scenes, sentinel1Scenes, ndviMedian] = await Promise.all([
    searchScenes("sentinel-2-l2a", 6).catch(() => []),
    searchScenes("sentinel-1-grd", 4).catch(() => []),
    fetchNdviMetric().catch(() => null)
  ]);

  if (sentinel2Scenes.length === 0 && sentinel1Scenes.length === 0) {
    throw new Error("Satellite catalog search is unavailable.");
  }

  const latestSentinel2Scene = sentinel2Scenes[0] ?? null;
  const bestCloudCover =
    sentinel2Scenes.reduce<number | null>((best, scene) => {
      if (scene.cloudCover === undefined) {
        return best;
      }

      return best === null ? scene.cloudCover : Math.min(best, scene.cloudCover);
    }, null);

  const scenes = [...sentinel2Scenes.slice(0, 3), ...sentinel1Scenes.slice(0, 2)]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 5);

  const updatedAt = new Date().toISOString();
  const previews = Object.values(PREVIEW_PRESETS).map((definition) => {
    const matchingScene =
      definition.collectionId === "sentinel-1-grd"
        ? sentinel1Scenes[0] ?? null
        : sentinel2Scenes[0] ?? null;

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      collectionId: definition.collectionId,
      previewUrl: `/api/satellite/preview/${definition.id}`,
      legend: definition.legend,
      note: definition.defaultNote,
      available: true,
      generatedAt: updatedAt,
      sceneDate: matchingScene?.timestamp,
      cloudCover: matchingScene?.cloudCover
    } satisfies SatellitePreviewItem;
  });

  const metrics = createDigestMetrics(latestSentinel2Scene, bestCloudCover, ndviMedian);

  return {
    updatedAt,
    previews,
    metrics,
    scenes
  };
}

export async function getSatelliteDigest(): Promise<SatelliteDigest> {
  const updatedAt = new Date().toISOString();

  try {
    const live = await resolveLiveSatelliteData();
    return {
      updatedAt: live.updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(),
      previews: live.previews,
      metrics: live.metrics,
      scenes: live.scenes
    };
  } catch (error) {
    return {
      updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(error instanceof Error ? error : new Error("Satellite service unavailable.")),
      previews: Object.values(PREVIEW_PRESETS).map((definition) => createUnavailablePreview(definition, updatedAt)),
      metrics: createDigestMetrics(null, null, null),
      scenes: []
    };
  }
}

export async function getSatelliteSearch(collectionId = "sentinel-2-l2a", limit = 6): Promise<SatelliteSearchResponse> {
  const updatedAt = new Date().toISOString();
  const normalizedLimit = Math.min(Math.max(limit, 1), 12);

  try {
    return {
      updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(),
      collectionId,
      scenes: await searchScenes(collectionId, normalizedLimit)
    };
  } catch (error) {
    return {
      updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(error instanceof Error ? error : new Error("Catalog search failed.")),
      collectionId,
      scenes: []
    };
  }
}

export async function getSatelliteStats(): Promise<SatelliteStatsResponse> {
  const updatedAt = new Date().toISOString();

  try {
    const scenes = await searchScenes("sentinel-2-l2a", 6);
    const bestCloudCover =
      scenes.reduce<number | null>((best, scene) => {
        if (scene.cloudCover === undefined) {
          return best;
        }

        return best === null ? scene.cloudCover : Math.min(best, scene.cloudCover);
      }, null);
    const ndviMedian = await fetchNdviMetric();
    return {
      updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(),
      metrics: createDigestMetrics(scenes[0] ?? null, bestCloudCover, ndviMedian)
    };
  } catch (error) {
    return {
      updatedAt,
      area: THAILAND_AOI,
      status: createServiceStatus(error instanceof Error ? error : new Error("Statistics request failed.")),
      metrics: createDigestMetrics(null, null, null)
    };
  }
}

export async function getSatellitePreview(presetId: string) {
  if (!Object.hasOwn(PREVIEW_PRESETS, presetId)) {
    throw new SatelliteServiceError("Unknown satellite preview preset.", 404);
  }

  try {
    return await fetchPreviewImage(presetId as SatellitePreviewPresetId);
  } catch (error) {
    const message =
      error instanceof SatelliteServiceError && error.isConfigurationError
        ? "OAuth credentials missing"
        : "Satellite preview failed";
    return {
      body: Buffer.from(
        createPlaceholderSvg(PREVIEW_PRESETS[presetId as SatellitePreviewPresetId].title.en, message),
        "utf8"
      ),
      contentType: "image/svg+xml",
      generatedAt: new Date().toISOString(),
      expiresAt: Date.now() + 60_000
    } satisfies PreviewCacheEntry;
  }
}

/* ── STAC Tile Discovery ──
 * Queries NASA CMR-STAC to find the latest available date for a given GIBS
 * product. Returns tile URLs with verified dates so the frontend doesn't have
 * to guess. Falls back to yesterday/2-days-ago if STAC is unreachable.
 *
 * Best practice: STAC discovery → COG partial reads → no full downloads.
 * See: stacspec.org, cmr.earthdata.nasa.gov/stac
 */

const GIBS_STAC_BASE = "https://cmr.earthdata.nasa.gov/stac";

/** Map from our EO layer IDs to NASA CMR collection concept IDs */
const EO_STAC_COLLECTIONS: Record<string, { conceptId: string; gibsLayer: string; tileMatrix: string; format: string }> = {
  "eo-aerosol":       { conceptId: "C1443528505-LAADS", gibsLayer: "MODIS_Combined_Value_Added_AOD", tileMatrix: "GoogleMapsCompatible_Level6", format: "png" },
  "eo-precipitation": { conceptId: "C1598621093-GES_DISC", gibsLayer: "IMERG_Precipitation_Rate", tileMatrix: "GoogleMapsCompatible_Level6", format: "png" },
  "eo-vegetation":    { conceptId: "C203234517-LPDAAC_ECS", gibsLayer: "MODIS_Terra_NDVI_8Day", tileMatrix: "GoogleMapsCompatible_Level9", format: "png" },
  "eo-cloud-phase":   { conceptId: "C1443775451-LAADS", gibsLayer: "MODIS_Aqua_Cloud_Phase_Infrared_Day", tileMatrix: "GoogleMapsCompatible_Level6", format: "png" },
  "eo-fire-thermal":  { conceptId: "C1443775394-LAADS", gibsLayer: "MODIS_Aqua_Brightness_Temp_Band31_Day", tileMatrix: "GoogleMapsCompatible_Level7", format: "png" }
};

type StacTileResult = {
  layerId: string;
  url: string;
  date: string;
  fallbackUrl: string;
  fallbackDate: string;
  source: "stac" | "static";
};

const stacTileCache = new Map<string, { result: StacTileResult; expiresAt: number }>();
const STAC_CACHE_TTL = 30 * 60_000; // 30 minutes

function gibsTileUrl(layer: string, date: string, tileMatrix: string, format = "png") {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/${tileMatrix}/{z}/{y}/{x}.${format}`;
}

function isoDateOffset(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getStacTileInfo(layerId: string): Promise<StacTileResult> {
  const cached = stacTileCache.get(layerId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const mapping = EO_STAC_COLLECTIONS[layerId];
  const yesterday = isoDateOffset(-1);
  const twoDaysAgo = isoDateOffset(-2);

  if (!mapping) {
    return {
      layerId,
      url: "",
      date: yesterday,
      fallbackUrl: "",
      fallbackDate: twoDaysAgo,
      source: "static"
    };
  }

  const staticResult: StacTileResult = {
    layerId,
    url: gibsTileUrl(mapping.gibsLayer, yesterday, mapping.tileMatrix, mapping.format),
    date: yesterday,
    fallbackUrl: gibsTileUrl(mapping.gibsLayer, twoDaysAgo, mapping.tileMatrix, mapping.format),
    fallbackDate: twoDaysAgo,
    source: "static"
  };

  if (!config.allowLiveFetch) {
    stacTileCache.set(layerId, { result: staticResult, expiresAt: Date.now() + STAC_CACHE_TTL });
    return staticResult;
  }

  try {
    const searchUrl = `${GIBS_STAC_BASE}/LPCLOUD/search`;
    const sevenDaysAgo = isoDateOffset(-7);
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: [mapping.conceptId],
        datetime: `${sevenDaysAgo}T00:00:00Z/..`,
        bbox: [97.3, 5.6, 105.7, 20.5],
        limit: 1,
        sortby: [{ field: "datetime", direction: "desc" }]
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      stacTileCache.set(layerId, { result: staticResult, expiresAt: Date.now() + STAC_CACHE_TTL });
      return staticResult;
    }

    const payload = (await response.json()) as { features?: Array<{ properties?: { datetime?: string } }> };
    const latestDate = payload.features?.[0]?.properties?.datetime?.slice(0, 10);

    if (latestDate) {
      const stacResult: StacTileResult = {
        layerId,
        url: gibsTileUrl(mapping.gibsLayer, latestDate, mapping.tileMatrix, mapping.format),
        date: latestDate,
        fallbackUrl: gibsTileUrl(mapping.gibsLayer, yesterday, mapping.tileMatrix, mapping.format),
        fallbackDate: yesterday,
        source: "stac"
      };
      stacTileCache.set(layerId, { result: stacResult, expiresAt: Date.now() + STAC_CACHE_TTL });
      return stacResult;
    }
  } catch {
    // STAC query failed — fall back to static dates
  }

  stacTileCache.set(layerId, { result: staticResult, expiresAt: Date.now() + STAC_CACHE_TTL });
  return staticResult;
}
