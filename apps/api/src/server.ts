import cors from "@fastify/cors";
import Fastify from "fastify";
import type { AssistantQueryRequest, DashboardView, TimeRange } from "@smart-city/shared";
import { config } from "./config.js";
import { getDurableStorageMode } from "./data/durableStore.js";
import { requireAdmin } from "./lib/adminAuth.js";
import { store } from "./data/store.js";
import { getAssistantStatus, queryAssistant } from "./services/knowledgeAssistant.js";
import { getSlicThailandSnapshot } from "./services/slicThailand.js";
import {
  getSatelliteDigest,
  getSatellitePreview,
  getSatelliteSearch,
  getSatelliteStats,
  getStacTileInfo
} from "./services/satellite.js";
import { getPublicCctvCameras } from "./services/publicCctv.js";
import { runSourceSync } from "./services/sync.js";
import { fetchOverpassLayer } from "./adapters/overpassAdapter.js";

function parseList(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export async function createServer() {
  const app = Fastify({
    logger: true,
    disableRequestLogging: true
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => {
    const sources = store.getSources();
    const syncHealth = store.getSyncHealth();
    const liveSourceCount = sources.filter((source) => source.freshnessStatus === "live").length;
    const staleSourceCount = sources.filter((source) => source.freshnessStatus === "stale").length;
    const latestSyncAt =
      syncHealth[0]?.fetchedAt ??
      [...sources]
        .sort((left, right) => right.lastCheckedAt.localeCompare(left.lastCheckedAt))[0]?.lastCheckedAt ??
      new Date().toISOString();

    return {
      ok: true,
      degraded: staleSourceCount > 0,
      service: "smart-city-monitor-api",
      updatedAt: new Date().toISOString(),
      lastSyncAt: latestSyncAt,
      liveSourceCount,
      staleSourceCount,
      durableStorage: getDurableStorageMode(),
      autoSyncEnabled: config.autoSyncEnabled,
      opsSyncIntervalMs: config.opsSyncIntervalMs,
      fullSyncIntervalMs: config.syncIntervalMs
    };
  });

  app.get("/api/overview", async (request) => {
    const query = request.query as {
      view?: DashboardView;
      city?: string;
      domain?: string;
      timeRange?: TimeRange;
      layers?: string;
    };

    return store.getOverview({
      view: query.view,
      city: query.city,
      domain: query.domain,
      timeRange: query.timeRange,
      layers: parseList(query.layers)
    });
  });

  app.get("/api/pulse", async (request) => {
    const query = request.query as {
      view?: DashboardView;
      city?: string;
      domain?: string;
      timeRange?: TimeRange;
      layers?: string;
    };
    return store.getOverview({
      view: query.view,
      city: query.city,
      domain: query.domain,
      timeRange: query.timeRange,
      layers: parseList(query.layers)
    }).metrics;
  });

  app.get("/api/projects", async (request) => {
    const query = request.query as { city?: string; district?: string; domain?: string; status?: string };
    return store.getProjects(query);
  });

  app.get("/api/projects/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const project = store.getProject(params.id);
    if (!project) {
      reply.code(404);
      return { message: "Project not found" };
    }
    return project;
  });

  app.get("/api/news", async (request) => {
    const query = request.query as { city?: string; district?: string; domain?: string; kind?: string; limit?: string };
    return store.getNews({
      city: query.city,
      district: query.district,
      domain: query.domain,
      kind: query.kind,
      limit: query.limit ? Number(query.limit) : undefined
    });
  });

  app.get("/api/news/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const item = store.getNewsItem(params.id);
    if (!item) {
      reply.code(404);
      return { message: "News item not found" };
    }
    return item;
  });

  app.get("/api/map/layers", async (request) => {
    const query = request.query as { layers?: string };
    return store.getMapLayers({
      layers: parseList(query.layers)
    });
  });

  app.get("/api/map/features", async (request) => {
    const query = request.query as { layer?: string; layers?: string };
    return store.getMapFeatures({
      layer: query.layer,
      layers: parseList(query.layers)
    });
  });

  app.get("/api/cities", async () => store.getCities());

  app.get("/api/districts", async (request) => {
    const query = request.query as { city?: string };
    return store.getDistricts(query);
  });

  app.get("/api/cities/:slug", async (request, reply) => {
    const params = request.params as { slug: string };
    const city = store.getCity(params.slug);
    if (!city) {
      reply.code(404);
      return { message: "City not found" };
    }
    return city;
  });

  app.get("/api/domains", async () => store.getDomains());

  app.get("/api/domains/:slug", async (request, reply) => {
    const params = request.params as { slug: string };
    const domain = store.getDomain(params.slug);
    if (!domain) {
      reply.code(404);
      return { message: "Domain not found" };
    }
    return domain;
  });

  app.get("/api/indicators", async (request) => {
    const query = request.query as { city?: string };
    return store.getIndicators(query);
  });

  app.get("/api/resilience", async () => store.getResilience());
  app.get("/api/changes", async () => store.getChangePulse());
  app.get("/api/decisions", async (request) => {
    const query = request.query as { city?: string; district?: string; domain?: string; limit?: string };
    return store.getDecisionQueue({
      city: query.city,
      district: query.district,
      domain: query.domain,
      limit: query.limit ? Number(query.limit) : undefined
    });
  });
  app.get("/api/activity", async (request) => {
    const query = request.query as { limit?: string };
    return store.getActivityLog(query.limit ? Number(query.limit) : undefined);
  });
  app.get("/api/social-listening", async () => store.getSocialListening());
  app.get("/api/impact", async () => store.getOfficialImpact());
  app.get("/api/markets", async () => store.getMarketSnapshot());
  app.get("/api/sources", async () => store.getSources());
  app.get("/api/command-center", async () => store.getCommandCenter());

  /* ── Bangkok Governor's IOC endpoints ── */
  app.get("/api/traffy-fondue", async () => store.getTraffyFondue());
  app.get("/api/flood-status", async () => store.getFloodStatus());
  app.get("/api/traffic-congestion", async () => store.getTrafficCongestion());

  app.get("/api/satellite/digest", async () => getSatelliteDigest());
  app.get("/api/satellite/stats", async () => getSatelliteStats());
  app.get("/api/satellite/search", async (request) => {
    const query = request.query as { collection?: string; limit?: string };
    return getSatelliteSearch(query.collection, query.limit ? Number(query.limit) : undefined);
  });
  app.get("/api/satellite/preview/:presetId", async (request, reply) => {
    const params = request.params as { presetId: string };

    try {
      const preview = await getSatellitePreview(params.presetId);
      reply.header("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
      reply.type(preview.contentType);
      return reply.send(preview.body);
    } catch (error) {
      reply.code(404);
      return {
        message: error instanceof Error ? error.message : "Satellite preview not found"
      };
    }
  });
  /* STAC tile discovery — returns verified tile dates for EO layers */
  app.get("/api/satellite/stac-tiles", async (request, reply) => {
    const query = request.query as { layer?: string };
    if (!query.layer) {
      reply.code(400);
      return { message: "layer parameter required" };
    }
    reply.header("Cache-Control", "public, max-age=1800, stale-while-revalidate=300");
    return getStacTileInfo(query.layer);
  });

  /* ── Overpass road & waterway layers ── */
  app.get("/api/layers/bangkok-highways", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
    return fetchOverpassLayer("bangkok-highways");
  });
  app.get("/api/layers/bangkok-arterials", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
    return fetchOverpassLayer("bangkok-arterials");
  });
  app.get("/api/layers/bangkok-waterways", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
    return fetchOverpassLayer("bangkok-waterways");
  });

  app.get("/api/briefings/latest", async () => store.getBriefing());
  app.get("/api/time", async () => store.getTime());
  app.get("/api/media/feeds", async (request) => {
    const query = request.query as { kind?: string; kinds?: string };
    return store.getMediaFeeds({
      kinds: parseList(query.kinds ?? query.kind)
    });
  });
  app.get("/api/cctv/public", async () => getPublicCctvCameras());
  app.get("/api/media/channels", async () => store.getMediaChannels());
  app.get("/api/assistant/status", async () => getAssistantStatus());
  app.get("/api/external/slic-thailand", async () => getSlicThailandSnapshot());
  app.post("/api/assistant/query", async (request, reply) => {
    const body = request.body as AssistantQueryRequest;

    if (!body?.question || typeof body.question !== "string" || body.question.trim() === "") {
      reply.code(400);
      return { message: "Question is required" };
    }

    return queryAssistant({
      ...body,
      question: body.question.trim(),
      context:
        body.context && typeof body.context === "object"
          ? body.context
          : {
              view: "city",
              activeLayers: []
            }
    });
  });

  app.post("/api/admin/news", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body as {
      title: { th: string; en: string };
      excerpt: { th: string; en: string };
      kind?: "official" | "external";
      citySlug?: string;
      domainSlug?: string;
    };

    return store.createNews({
      title: body.title,
      excerpt: body.excerpt,
      kind: body.kind ?? "official",
      citySlug: body.citySlug,
      domainSlug: body.domainSlug,
      source: {
        sourceName: "Smart City Thailand Office",
        sourceUrl: "https://www.depa.or.th/th/smart-city-plan/smart-city-office",
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "manual",
        confidence: 0.92,
        fallbackMode: "manual"
      }
    });
  });

  app.patch("/api/admin/news/:id", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const params = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const updated = store.updateNews(params.id, body);
    if (!updated) {
      reply.code(404);
      return { message: "News item not found" };
    }
    return updated;
  });

  app.post("/api/admin/projects", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body as {
      title: { th: string; en: string };
      citySlug: string;
      domainSlug: string;
      status: "active" | "watch" | "delayed" | "planned";
      completionPercent: number;
      owner: { th: string; en: string };
      summary: { th: string; en: string };
      nextMilestone: { th: string; en: string };
    };

    return store.createProject({
      ...body,
      source: {
        sourceName: "Smart City Thailand Office",
        sourceUrl: "https://www.depa.or.th/th/smart-city-plan/smart-city-office",
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "manual",
        confidence: 0.94,
        fallbackMode: "manual"
      }
    });
  });

  app.patch("/api/admin/projects/:id", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const params = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const updated = store.updateProject(params.id, body);
    if (!updated) {
      reply.code(404);
      return { message: "Project not found" };
    }
    return updated;
  });

  app.post("/api/admin/briefings", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body as {
      headline: { th: string; en: string };
      body: { th: string; en: string };
    };
    return store.setBriefing({
      headline: body.headline,
      body: body.body
    });
  });

  app.post("/api/admin/sources/sync", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return runSourceSync();
  });

  app.get("/api/admin/sources/health", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return store.getSyncHealth();
  });

  app.get("/api/admin/audit", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const query = request.query as { limit?: string };
    return store.getAuditTrail(query.limit ? Number(query.limit) : undefined);
  });

  app.post("/api/admin/map-sources/sync/:sourceId", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const params = request.params as { sourceId: string };
    const syncResult = await runSourceSync();
    return {
      ok: true,
      sourceId: params.sourceId,
      syncHealth: syncResult
    };
  });

  app.get("/api/admin/map-sources/health", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return store.getSyncHealth().filter((item) => item.sourceId.includes("bangkok") || item.sourceId.includes("gistda"));
  });

  app.post("/api/admin/media/feeds", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body as {
      kind: "tv" | "webcam" | "stream" | "link";
      label: string;
      region?: string;
      embedUrl?: string;
      externalUrl?: string;
      isEmbeddable?: boolean;
      status?: "live" | "offline" | "unknown";
    };

    return store.createMediaFeed({
      kind: body.kind,
      label: body.label,
      region: body.region,
      embedUrl: body.embedUrl,
      externalUrl: body.externalUrl,
      isEmbeddable: body.isEmbeddable ?? false,
      status: body.status ?? "unknown",
      source: {
        sourceName: "Curated Media Feeds",
        sourceUrl: body.externalUrl ?? body.embedUrl ?? "https://www.youtube.com",
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "manual",
        confidence: 0.72,
        fallbackMode: "manual"
      }
    });
  });

  app.post("/api/admin/uploads", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body as { filename?: string };
    return {
      ok: true,
      message: "Upload pipeline placeholder. Wire object storage before production.",
      filename: body.filename ?? null
    };
  });

  return app;
}
