import {
  activityLog as activityLogSeed,
  auditTrail as auditTrailSeed,
  briefing as briefingSeed,
  cities as citySeed,
  changePulse as changePulseSeed,
  cloneSeed,
  createCommandCenterSnapshot,
  createMucSnapshot,
  createTimeSnapshot,
  decisionQueue as decisionQueueSeed,
  mttIncidents as incidentSeed,
  mttVisionPipelines as visionPipelineSeed,
  mttVisionResults as visionResultSeed,
  domains as domainSeed,
  districts as districtSeed,
  mapFeatureCollections as mapFeatureSeed,
  mapLayers as layerSeed,
  marketSnapshot as marketSnapshotSeed,
  mediaFeeds as mediaFeedSeed,
  news as newsSeed,
  officialImpact as officialImpactSeed,
  overviewMetrics,
  projects as projectSeed,
  resilience as resilienceSeed,
  socialListening as socialListeningSeed,
  sources as sourceSeed
} from "@smart-city/shared";
import type {
  ActivityLogItem,
  AuditEventRecord,
  BriefingNote,
  CommandCenterSnapshot,
  ChangePulse,
  DashboardView,
  DecisionQueueItem,
  DistrictProfile,
  MapFeatureCollection,
  MapLayerConfig,
  MarketSnapshot,
  MediaFeedItem,
  NewsItem,
  OfficialImpactSnapshot,
  OverviewSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SocialListeningSnapshot,
  SourceMeta,
  SourceRecord,
  SyncHealthRecord,
  TimeRange,
  TimeSnapshot,
  MucSnapshot,
  GateFlowBucket,
  VehicleDetection,
  IncidentRecord,
  VisionPipelineConfig,
  VisionDetectionResult
} from "@smart-city/shared";
import type { AdapterSyncResult } from "../adapters/common.js";
import { persistStoreSnapshot } from "./persistence.js";

interface StoreState {
  projects: ProjectRecord[];
  news: NewsItem[];
  districts: DistrictProfile[];
  decisionQueue: DecisionQueueItem[];
  auditTrail: AuditEventRecord[];
  sources: SourceRecord[];
  briefing: BriefingNote;
  resilience: ResilienceSnapshot;
  changePulse: ChangePulse;
  activityLog: ActivityLogItem[];
  socialListening: SocialListeningSnapshot;
  officialImpact: OfficialImpactSnapshot;
  marketSnapshot: MarketSnapshot;
  layers: MapLayerConfig[];
  mapFeaturesByLayer: Record<string, MapFeatureCollection>;
  mediaFeeds: MediaFeedItem[];
  syncHealth: SyncHealthRecord[];
  lastSyncAt: string;
  latestTime: TimeSnapshot;
  commandCenter: CommandCenterSnapshot;
  mucSnapshot: MucSnapshot;
  incidents: IncidentRecord[];
  visionPipelines: VisionPipelineConfig[];
  visionResults: VisionDetectionResult[];
}

export type StoreSnapshot = StoreState;

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function uniqueTopTerms(values: string[]) {
  const counts = new Map<string, number>();
  values
    .flatMap((value) => value.toLowerCase().split(/\s+/))
    .filter(Boolean)
    .forEach((term) => {
      counts.set(term, (counts.get(term) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([term]) => term);
}

const COMMON_TERMS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "city",
  "smart",
  "thailand",
  "depa"
]);

function topTermsFromNews(items: NewsItem[]) {
  const tokens = items.flatMap((item) =>
    `${item.title.en} ${item.excerpt.en}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !COMMON_TERMS.has(token))
  );

  return uniqueTopTerms(tokens).slice(0, 5);
}

function createState(): StoreState {
  const mapFeaturesByLayer = Object.fromEntries(
    cloneSeed(mapFeatureSeed).map((collection) => [collection.layerId, collection])
  ) as Record<string, MapFeatureCollection>;

  return {
    projects: cloneSeed(projectSeed),
    news: cloneSeed(newsSeed),
    districts: cloneSeed(districtSeed),
    decisionQueue: cloneSeed(decisionQueueSeed),
    auditTrail: cloneSeed(auditTrailSeed),
    sources: cloneSeed(sourceSeed),
    briefing: cloneSeed(briefingSeed),
    resilience: cloneSeed(resilienceSeed),
    changePulse: cloneSeed(changePulseSeed),
    activityLog: cloneSeed(activityLogSeed),
    socialListening: cloneSeed(socialListeningSeed),
    officialImpact: cloneSeed(officialImpactSeed),
    marketSnapshot: cloneSeed(marketSnapshotSeed),
    layers: cloneSeed(layerSeed),
    mapFeaturesByLayer,
    mediaFeeds: cloneSeed(mediaFeedSeed),
    syncHealth: [],
    lastSyncAt: new Date().toISOString(),
    latestTime: createTimeSnapshot(),
    commandCenter: createCommandCenterSnapshot(),
    mucSnapshot: createMucSnapshot(),
    incidents: cloneSeed(incidentSeed),
    visionPipelines: cloneSeed(visionPipelineSeed),
    visionResults: cloneSeed(visionResultSeed)
  };
}

const state = createState();

function getDecisionSeverityRank(severity: DecisionQueueItem["severity"]) {
  return severity === "urgent" ? 0 : severity === "watch" ? 1 : 2;
}

function pushAuditEvent(event: AuditEventRecord) {
  state.auditTrail = [cloneSeed(event), ...state.auditTrail]
    .filter(
      (value, index, values) =>
        values.findIndex((candidate) => candidate.id === value.id) === index
    )
    .slice(0, 40);
}

function mergeByKey<T>(seeded: T[], persisted: T[], getKey: (value: T) => string) {
  const merged = [...persisted, ...seeded];
  return cloneSeed(
    merged.filter(
      (value, index, values) => values.findIndex((candidate) => getKey(candidate) === getKey(value)) === index
    )
  );
}

function mergeCollectionBounds(boundsList: Array<MapFeatureCollection["bounds"] | undefined>) {
  const validBounds = boundsList.filter(
    (bounds): bounds is [number, number, number, number] => Array.isArray(bounds) && bounds.length === 4
  );

  if (validBounds.length === 0) {
    return undefined;
  }

  return [
    Math.min(...validBounds.map((bounds) => bounds[0])),
    Math.min(...validBounds.map((bounds) => bounds[1])),
    Math.max(...validBounds.map((bounds) => bounds[2])),
    Math.max(...validBounds.map((bounds) => bounds[3]))
  ] as [number, number, number, number];
}

function mergeMapCollections(collections: MapFeatureCollection[]) {
  const primaryCollection = collections[0];
  if (!primaryCollection) {
    return null;
  }

  const mergedFeatures = collections
    .flatMap((collection) => collection.features)
    .filter(
      (feature, index, features) =>
        features.findIndex((candidate) => candidate.id === feature.id) === index
    );
  const sourceNames = [...new Set(collections.map((collection) => collection.source.sourceName).filter(Boolean))];
  const latestUpdatedAt =
    [...collections]
      .map((collection) => collection.updatedAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? primaryCollection.updatedAt;

  return {
    ...cloneSeed(primaryCollection),
    updatedAt: latestUpdatedAt,
    features: cloneSeed(mergedFeatures),
    bounds: mergeCollectionBounds(collections.map((collection) => collection.bounds)),
    source: {
      ...primaryCollection.source,
      sourceName: sourceNames.join(" + "),
      freshnessStatus: collections.some((collection) => collection.source.freshnessStatus === "live")
        ? "live"
        : primaryCollection.source.freshnessStatus,
      confidence: Math.max(...collections.map((collection) => collection.source.confidence ?? 0))
    }
  } satisfies MapFeatureCollection;
}

function mergeSourceBacked<T extends { source: SourceMeta }>(seeded: T, persisted?: T): T {
  if (!persisted) {
    return cloneSeed(seeded);
  }

  return cloneSeed({
    ...seeded,
    ...persisted,
    source: {
      ...seeded.source,
      ...persisted.source
    }
  }) as T;
}

function persistCurrentState() {
  void persistStoreSnapshot(store.getSnapshot());
}

export const store = {
  getSnapshot(): StoreSnapshot {
    return cloneSeed(state);
  },

  hydrate(snapshot?: Partial<StoreSnapshot> | null) {
    if (!snapshot) {
      return this.getSnapshot();
    }

    const seeded = createState();

    state.projects = Array.isArray(snapshot.projects)
      ? mergeByKey(seeded.projects, snapshot.projects, (project) => project.slug)
      : seeded.projects;
    state.news = Array.isArray(snapshot.news)
      ? mergeByKey(seeded.news, snapshot.news, (item) => item.slug)
      : seeded.news;
    state.districts = Array.isArray(snapshot.districts)
      ? mergeByKey(seeded.districts, snapshot.districts, (district) => district.slug)
      : seeded.districts;
    state.decisionQueue = Array.isArray(snapshot.decisionQueue)
      ? mergeByKey(seeded.decisionQueue, snapshot.decisionQueue, (item) => item.id)
      : seeded.decisionQueue;
    state.auditTrail = Array.isArray(snapshot.auditTrail)
      ? mergeByKey(seeded.auditTrail, snapshot.auditTrail, (item) => item.id).slice(0, 40)
      : seeded.auditTrail;
    state.sources = Array.isArray(snapshot.sources)
      ? mergeByKey(seeded.sources, snapshot.sources, (source) => source.id)
      : seeded.sources;
    state.activityLog = Array.isArray(snapshot.activityLog)
      ? mergeByKey(seeded.activityLog, snapshot.activityLog, (item) => item.id).slice(0, 24)
      : seeded.activityLog;
    state.layers = Array.isArray(snapshot.layers)
      ? mergeByKey(seeded.layers, snapshot.layers, (layer) => layer.id)
      : seeded.layers;
    state.mediaFeeds = Array.isArray(snapshot.mediaFeeds)
      ? mergeByKey(seeded.mediaFeeds, snapshot.mediaFeeds, (item) => item.id)
      : seeded.mediaFeeds;
    state.syncHealth = Array.isArray(snapshot.syncHealth) ? cloneSeed(snapshot.syncHealth) : [];
    state.lastSyncAt = typeof snapshot.lastSyncAt === "string" ? snapshot.lastSyncAt : seeded.lastSyncAt;
    state.latestTime = snapshot.latestTime ? cloneSeed(snapshot.latestTime) : seeded.latestTime;
    state.commandCenter = snapshot.commandCenter ? cloneSeed(snapshot.commandCenter) : seeded.commandCenter;
    state.briefing = mergeSourceBacked(seeded.briefing, snapshot.briefing);
    state.resilience = mergeSourceBacked(seeded.resilience, snapshot.resilience);
    state.changePulse = snapshot.changePulse ? cloneSeed(snapshot.changePulse) : seeded.changePulse;
    state.socialListening = mergeSourceBacked(seeded.socialListening, snapshot.socialListening);
    state.officialImpact = mergeSourceBacked(seeded.officialImpact, snapshot.officialImpact);
    state.marketSnapshot = mergeSourceBacked(seeded.marketSnapshot, snapshot.marketSnapshot);
    state.mapFeaturesByLayer = {
      ...cloneSeed(seeded.mapFeaturesByLayer),
      ...(snapshot.mapFeaturesByLayer ? cloneSeed(snapshot.mapFeaturesByLayer) : {})
    };

    return this.getSnapshot();
  },

  getOverview(filters: {
    view?: DashboardView;
    timeRange?: TimeRange;
    city?: string;
    domain?: string;
    layers?: string[];
  }): OverviewSnapshot {
    const filteredProjects = filters.city
      ? state.projects.filter((project) => project.citySlug === filters.city)
      : state.projects;
    const coverageCount = state.mapFeaturesByLayer["smart-city-thailand"]?.features.length ?? citySeed.length;
    const liveSourceCount = state.sources.filter((source) => source.freshnessStatus === "live").length;
    const warningCount = state.resilience.warnings.length;

    const metrics = overviewMetrics.map((metric) => {
      if (metric.id === "active-projects") {
        return {
          ...metric,
          value: filteredProjects.length,
          displayValue: String(filteredProjects.length).padStart(2, "0"),
          meta: { ...metric.meta, fetchedAt: new Date().toISOString() }
        };
      }

      if (metric.id === "cities-tracked") {
        return {
          ...metric,
          value: coverageCount,
          displayValue: String(coverageCount).padStart(2, "0"),
          meta: { ...metric.meta, fetchedAt: new Date().toISOString() }
        };
      }

      if (metric.id === "resilience-watch") {
        return {
          ...metric,
          value: warningCount,
          displayValue: String(warningCount).padStart(2, "0"),
          meta: { ...metric.meta, fetchedAt: new Date().toISOString() }
        };
      }

      if (metric.id === "data-sources") {
        return {
          ...metric,
          value: liveSourceCount,
          displayValue: String(liveSourceCount).padStart(2, "0"),
          meta: { ...metric.meta, fetchedAt: new Date().toISOString() }
        };
      }

      return {
        ...metric,
        meta: { ...metric.meta, fetchedAt: new Date().toISOString() }
      };
    });

    return {
      updatedAt: new Date().toISOString(),
      view: filters.view ?? "national",
      timeRange: filters.timeRange ?? "7d",
      selectedCity: filters.city,
      selectedDomain: filters.domain,
      activeLayers: filters.layers ?? state.layers.filter((layer) => layer.active).map((layer) => layer.id),
      metrics,
      briefing: cloneSeed(state.briefing),
      cities: cloneSeed(citySeed),
      domains: cloneSeed(domainSeed),
      sources: cloneSeed(state.sources)
    };
  },

  getProjects(filters?: { city?: string; district?: string; domain?: string; status?: string }) {
    return cloneSeed(
      state.projects.filter((project) => {
        if (filters?.city && project.citySlug !== filters.city) return false;
        if (filters?.district && project.districtSlug && project.districtSlug !== filters.district) return false;
        if (filters?.domain && project.domainSlug !== filters.domain) return false;
        if (filters?.status && project.status !== filters.status) return false;
        return true;
      })
    );
  },

  getProject(id: string) {
    return state.projects.find((project) => project.id === id || project.slug === id);
  },

  getNews(filters?: { city?: string; district?: string; domain?: string; kind?: string; limit?: number }) {
    const filtered = state.news.filter((item) => {
      if (filters?.city && item.citySlug && item.citySlug !== filters.city) return false;
      if (filters?.district && item.districtSlug && item.districtSlug !== filters.district) return false;
      if (filters?.domain && item.domainSlug && item.domainSlug !== filters.domain) return false;
      if (filters?.kind && item.kind !== filters.kind) return false;
      return true;
    });

    return cloneSeed(filtered.slice(0, filters?.limit ?? filtered.length));
  },

  getNewsItem(id: string) {
    return state.news.find((item) => item.id === id || item.slug === id);
  },

  getCities() {
    return cloneSeed(citySeed);
  },

  getCity(slug: string) {
    return citySeed.find((city) => city.slug === slug);
  },

  getDistricts(filters?: { city?: string }) {
    return cloneSeed(
      state.districts.filter((district) => {
        if (filters?.city && district.citySlug !== filters.city) {
          return false;
        }

        return true;
      })
    );
  },

  getDomains() {
    return cloneSeed(domainSeed);
  },

  getDomain(slug: string) {
    return domainSeed.find((domain) => domain.slug === slug);
  },

  getIndicators(filters?: { city?: string }) {
    return citySeed.map((city) => ({
      city: city.slug,
      cityName: city.name,
      averageScore: average(city.scores.map((score) => score.score)),
      focus: city.focus,
      selected: filters?.city === city.slug
    }));
  },

  getResilience() {
    return cloneSeed(state.resilience);
  },

  getChangePulse() {
    return cloneSeed(state.changePulse);
  },

  getDecisionQueue(filters?: { city?: string; district?: string; domain?: string; limit?: number }) {
    const filtered = state.decisionQueue
      .filter((item) => {
        if (filters?.city && item.citySlug !== filters.city) return false;
        if (filters?.district && item.districtSlug && item.districtSlug !== filters.district) return false;
        if (filters?.domain && item.domainSlug !== filters.domain) return false;
        return true;
      })
      .sort((left, right) => {
        const severityDelta = getDecisionSeverityRank(left.severity) - getDecisionSeverityRank(right.severity);
        if (severityDelta !== 0) {
          return severityDelta;
        }

        return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
      });

    return cloneSeed(filtered.slice(0, filters?.limit ?? filtered.length));
  },

  getActivityLog(limit?: number) {
    return cloneSeed(state.activityLog.slice(0, limit ?? state.activityLog.length));
  },

  getAuditTrail(limit?: number) {
    return cloneSeed(state.auditTrail.slice(0, limit ?? state.auditTrail.length));
  },

  getSocialListening() {
    return cloneSeed(state.socialListening);
  },

  getOfficialImpact() {
    return cloneSeed(state.officialImpact);
  },

  getMarketSnapshot() {
    return cloneSeed(state.marketSnapshot);
  },

  getSources() {
    return cloneSeed(state.sources);
  },

  getCommandCenter() {
    return cloneSeed({
      ...state.commandCenter,
      updatedAt: new Date().toISOString()
    });
  },

  getMucSnapshot() {
    return cloneSeed({
      ...state.mucSnapshot,
      updatedAt: new Date().toISOString()
    });
  },

  getGateFlow() {
    return cloneSeed(state.mucSnapshot.gateFlow);
  },

  getTrafficFlow() {
    return cloneSeed(state.mucSnapshot.trafficFlow);
  },

  getAirQuality() {
    return cloneSeed(state.mucSnapshot.airQuality);
  },

  getCctvConsole() {
    return cloneSeed(state.mucSnapshot.cctvConsole);
  },

  getGateFlowBuckets(filters?: { gate?: string; hours?: number }): GateFlowBucket[] {
    let buckets = state.mucSnapshot.gateFlow.buckets;
    if (filters?.gate) {
      buckets = buckets.filter((b) => b.gateId === filters.gate);
    }
    if (filters?.hours) {
      const cutoff = new Date(Date.now() - filters.hours * 3600_000).toISOString();
      buckets = buckets.filter((b) => b.periodStart >= cutoff);
    }
    return cloneSeed(buckets);
  },

  getVehicleDetections(filters?: { camera?: string; gate?: string; limit?: number }): VehicleDetection[] {
    let detections = state.mucSnapshot.gateFlow.recentDetections;
    if (filters?.camera) {
      detections = detections.filter((d) => d.cameraId === filters.camera);
    }
    if (filters?.gate) {
      detections = detections.filter((d) => d.gateId === filters.gate);
    }
    detections = [...detections].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (filters?.limit) {
      detections = detections.slice(0, filters.limit);
    }
    return cloneSeed(detections);
  },

  /* ── Incidents ── */
  getIncidents(filters?: { status?: string; category?: string; zone?: string; limit?: number }): IncidentRecord[] {
    let items = state.incidents;
    if (filters?.status) items = items.filter((i) => i.status === filters.status);
    if (filters?.category) items = items.filter((i) => i.category === filters.category);
    if (filters?.zone) items = items.filter((i) => i.zoneId === filters.zone);
    items = [...items].sort((a, b) => {
      const urgRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const ua = urgRank[a.urgency] ?? 9;
      const ub = urgRank[b.urgency] ?? 9;
      if (ua !== ub) return ua - ub;
      return b.reportedAt.localeCompare(a.reportedAt);
    });
    if (filters?.limit) items = items.slice(0, filters.limit);
    return cloneSeed(items);
  },

  getIncidentById(id: string): IncidentRecord | null {
    const item = state.incidents.find((i) => i.id === id);
    return item ? cloneSeed(item) : null;
  },

  createIncident(data: Omit<IncidentRecord, "id" | "ticketNumber" | "updatedAt">): IncidentRecord {
    const seq = state.incidents.length + 1;
    const record: IncidentRecord = {
      ...data,
      id: `inc-${Date.now()}-${seq}`,
      ticketNumber: `MTT-${String(seq).padStart(4, "0")}`,
      updatedAt: new Date().toISOString()
    };
    state.incidents.unshift(record);
    persistCurrentState();
    return cloneSeed(record);
  },

  updateIncident(id: string, patch: Partial<Pick<IncidentRecord, "status" | "assignedTo" | "resolvedAt" | "urgency" | "aiSummary">>): IncidentRecord | null {
    const idx = state.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    Object.assign(state.incidents[idx], patch, { updatedAt: new Date().toISOString() });
    if (patch.status === "resolved" && !patch.resolvedAt) {
      state.incidents[idx].resolvedAt = new Date().toISOString();
    }
    persistCurrentState();
    return cloneSeed(state.incidents[idx]);
  },

  /* ── Vision Pipeline ── */
  getVisionPipelines(): VisionPipelineConfig[] {
    return cloneSeed(state.visionPipelines);
  },

  getVisionPipelineByCamera(cameraId: string): VisionPipelineConfig | null {
    const item = state.visionPipelines.find((p) => p.cameraId === cameraId);
    return item ? cloneSeed(item) : null;
  },

  getVisionResults(filters?: { camera?: string; limit?: number }): VisionDetectionResult[] {
    let items = state.visionResults;
    if (filters?.camera) items = items.filter((r) => r.cameraId === filters.camera);
    items = [...items].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (filters?.limit) items = items.slice(0, filters.limit);
    return cloneSeed(items);
  },

  getMapLayers(filters?: { layers?: string[] }) {
    const activeLayerSet = new Set(filters?.layers ?? state.layers.filter((layer) => layer.active).map((layer) => layer.id));
    return cloneSeed(
      state.layers.map((layer) => ({
        ...layer,
        active: activeLayerSet.has(layer.id)
      }))
    );
  },

  getMapFeatures(filters?: { layer?: string; layers?: string[] }) {
    const requestedLayers = filters?.layer
      ? [filters.layer]
      : filters?.layers && filters.layers.length > 0
        ? filters.layers
        : Object.keys(state.mapFeaturesByLayer);

    return cloneSeed(
      requestedLayers
        .map((layerId) => state.mapFeaturesByLayer[layerId])
        .filter((collection): collection is MapFeatureCollection => Boolean(collection))
    );
  },

  getMediaFeeds(filters?: { kinds?: string[] }) {
    const kindSet = filters?.kinds && filters.kinds.length > 0 ? new Set(filters.kinds) : null;
    return cloneSeed(
      state.mediaFeeds.filter((item) => {
        if (!kindSet) return true;
        return kindSet.has(item.kind);
      })
    );
  },

  getMediaChannels() {
    return cloneSeed(
      state.mediaFeeds.map((item) => ({
        id: item.id,
        label: item.label,
        kind: item.kind,
        region: item.region,
        status: item.status,
        isEmbeddable: item.isEmbeddable
      }))
    );
  },

  getBriefing() {
    return cloneSeed(state.briefing);
  },

  getTime() {
    state.latestTime = createTimeSnapshot();
    return cloneSeed(state.latestTime);
  },

  getSyncHealth() {
    return cloneSeed(state.syncHealth);
  },

  createMediaFeed(input: Omit<MediaFeedItem, "id">) {
    const record: MediaFeedItem = {
      ...input,
      id: `media-${Date.now()}`
    };

    state.mediaFeeds.unshift(record);
    pushAuditEvent({
      id: `audit-media-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "admin.console",
      action: "create",
      entityType: "media-feed",
      entityId: record.id,
      detail: `Added media feed ${record.label}.`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(record);
  },

  setBriefing(input: Pick<BriefingNote, "headline" | "body">) {
    state.briefing = {
      ...state.briefing,
      headline: input.headline,
      body: input.body,
      updatedAt: new Date().toISOString(),
      source: {
        ...state.briefing.source,
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "manual"
      }
    };

    pushAuditEvent({
      id: `audit-briefing-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "admin.console",
      action: "publish",
      entityType: "briefing",
      entityId: state.briefing.id,
      detail: `Published briefing "${state.briefing.headline.en}".`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(state.briefing);
  },

  createNews(input: Omit<NewsItem, "id" | "slug" | "publishedAt">) {
    const createdAt = new Date().toISOString();
    const record: NewsItem = {
      ...input,
      id: `news-${Date.now()}`,
      slug: `news-${Date.now()}`,
      publishedAt: createdAt
    };

    state.news.unshift(record);
    pushAuditEvent({
      id: `audit-news-${Date.now()}`,
      timestamp: createdAt,
      actor: "admin.console",
      action: "create",
      entityType: "news",
      entityId: record.id,
      detail: `Created news item "${record.title.en}".`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(record);
  },

  createProject(input: Omit<ProjectRecord, "id" | "slug" | "updatedAt">) {
    const createdAt = new Date().toISOString();
    const record: ProjectRecord = {
      ...input,
      id: `project-${Date.now()}`,
      slug: `project-${Date.now()}`,
      updatedAt: createdAt
    };

    state.projects.unshift(record);
    pushAuditEvent({
      id: `audit-project-${Date.now()}`,
      timestamp: createdAt,
      actor: "admin.console",
      action: "create",
      entityType: "project",
      entityId: record.id,
      detail: `Created project "${record.title.en}".`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(record);
  },

  updateProject(id: string, patch: Partial<ProjectRecord>) {
    const target = state.projects.find((project) => project.id === id || project.slug === id);
    if (!target) return null;

    Object.assign(target, patch, { updatedAt: new Date().toISOString() });
    pushAuditEvent({
      id: `audit-project-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "admin.console",
      action: "update",
      entityType: "project",
      entityId: target.id,
      detail: `Updated project "${target.title.en}".`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(target);
  },

  updateNews(id: string, patch: Partial<NewsItem>) {
    const target = state.news.find((item) => item.id === id || item.slug === id);
    if (!target) return null;

    Object.assign(target, patch);
    pushAuditEvent({
      id: `audit-news-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "admin.console",
      action: "update",
      entityType: "news",
      entityId: target.id,
      detail: `Updated news item "${target.title.en}".`,
      status: "manual"
    });
    persistCurrentState();
    return cloneSeed(target);
  },

  applySyncResults(results: AdapterSyncResult[]) {
    const syncTimestamp = new Date().toISOString();
    state.lastSyncAt = syncTimestamp;
    state.syncHealth = results.map((result) => ({
      sourceId: result.sourceId,
      status: result.status,
      fetchedAt: result.fetchedAt,
      message: result.message
    }));

    const sourceMap = new Map(state.sources.map((source) => [source.id, source]));
    results.forEach((result) => {
      const source = sourceMap.get(result.sourceId);
      if (source) {
        source.freshnessStatus = result.status;
        source.lastCheckedAt = result.fetchedAt;
        source.message = result.message;
      }

      if (result.resiliencePatch) {
        state.resilience = {
          ...state.resilience,
          ...result.resiliencePatch,
          updatedAt: result.fetchedAt,
          source: {
            ...state.resilience.source,
            fetchedAt: result.fetchedAt,
            freshnessStatus: result.status
          }
        };
      }

      if (result.socialListeningPatch) {
        state.socialListening = {
          ...state.socialListening,
          ...result.socialListeningPatch,
          updatedAt: result.fetchedAt
        };
      }

      if (result.officialImpactPatch) {
        state.officialImpact = {
          ...state.officialImpact,
          ...result.officialImpactPatch,
          updatedAt: result.fetchedAt
        };
      }

      if (result.marketSnapshotPatch) {
        state.marketSnapshot = {
          ...state.marketSnapshot,
          ...result.marketSnapshotPatch,
          updatedAt: result.fetchedAt
        };
      }

      if (result.timeSnapshot) {
        state.latestTime = result.timeSnapshot;
      }
    });

    const externalNews = results.flatMap((result) => result.newsItems ?? []);
    if (externalNews.length > 0) {
      const official = state.news.filter((item) => item.kind === "official");
      const dedupedExternal = externalNews.filter(
        (item, index, array) =>
          array.findIndex(
            (candidate) =>
              candidate.title.en === item.title.en && candidate.publishedAt === item.publishedAt
          ) === index
      );
      state.news = [...official, ...dedupedExternal];
    }

    const incomingProjects = results.flatMap((result) => result.projectRecords ?? []);
    if (incomingProjects.length > 0) {
      // Put freshly synced projects first so repeated syncs can update existing rows.
      const mergedProjects = [...incomingProjects, ...state.projects];
      state.projects = cloneSeed(
        mergedProjects.filter(
          (project, index, array) => array.findIndex((candidate) => candidate.slug === project.slug) === index
        )
      );
    }

    const mapCollections = results.flatMap((result) => result.mapFeatureCollections ?? []);
    if (mapCollections.length > 0) {
      const collectionsByLayer = new Map<string, MapFeatureCollection[]>();
      mapCollections.forEach((collection) => {
        const existing = collectionsByLayer.get(collection.layerId) ?? [];
        existing.push(collection);
        collectionsByLayer.set(collection.layerId, existing);
      });

      collectionsByLayer.forEach((collections, layerId) => {
        const nextCollection =
          collections.length === 1 ? cloneSeed(collections[0]) : mergeMapCollections(collections);
        if (!nextCollection) {
          return;
        }

        state.mapFeaturesByLayer[layerId] = cloneSeed(nextCollection);
      });
    }

    const mediaFeedUpdates = results.flatMap((result) => result.mediaFeeds ?? []);
    if (mediaFeedUpdates.length > 0) {
      const mergedMedia = [...mediaFeedUpdates, ...state.mediaFeeds];
      state.mediaFeeds = cloneSeed(
        mergedMedia.filter((item, index, array) => {
          const key = item.id || item.externalUrl || item.label;
          return (
            array.findIndex((candidate) => (candidate.id || candidate.externalUrl || candidate.label) === key) === index
          );
        })
      );
    }

    pushAuditEvent({
      id: `audit-sync-${Date.now()}`,
      timestamp: syncTimestamp,
      actor: "sync.scheduler",
      action: "sync",
      entityType: "source-sync",
      entityId: results.map((result) => result.sourceId).join(","),
      detail: `Processed ${results.length} source sync result${results.length === 1 ? "" : "s"}.`,
      status: results.every((result) => result.status === "live" || result.status === "manual") ? "success" : "failed"
    });

    const socialSignals = results
      .map((result) => result.socialSignal)
      .filter((signal): signal is NonNullable<AdapterSyncResult["socialSignal"]> => Boolean(signal));

    if (socialSignals.length > 0) {
      const mentionCount = socialSignals.reduce((sum, signal) => sum + signal.mentionCount, 0);
      const weightedSentiment = socialSignals.reduce(
        (sum, signal) => sum + signal.sentimentScore * Math.max(signal.mentionCount, 1),
        0
      );
      const weightedPositiveShare = socialSignals.reduce(
        (sum, signal) => sum + signal.positiveShare * Math.max(signal.mentionCount, 1),
        0
      );
      const weight = socialSignals.reduce((sum, signal) => sum + Math.max(signal.mentionCount, 1), 0);
      const dominantSignal =
        [...socialSignals].sort((left, right) => right.mentionCount - left.mentionCount)[0] ?? socialSignals[0];

      state.socialListening = {
        ...state.socialListening,
        updatedAt: syncTimestamp,
        mentionCount,
        sentimentScore: Math.round(weightedSentiment / Math.max(weight, 1)),
        sourceCount: socialSignals.reduce((sum, signal) => sum + signal.sourceCount, 0),
        positiveShare: Number((weightedPositiveShare / Math.max(weight, 1)).toFixed(2)),
        dominantSource: dominantSignal.dominantSource,
        topTerms: uniqueTopTerms(socialSignals.flatMap((signal) => signal.topTerms)),
        source: {
          sourceName: dominantSignal.sourceName,
          sourceUrl: state.socialListening.source.sourceUrl,
          fetchedAt: syncTimestamp,
          publishedAt: syncTimestamp,
          freshnessStatus: "live",
          confidence: 0.78,
          fallbackMode: "live"
        }
      };
    } else {
      const externalNarrative = state.news.filter((item) => item.kind === "external");
      const liveMediaCount = state.mediaFeeds.filter((item) => item.status === "live").length;
      const derivedMentionCount = externalNarrative.length + liveMediaCount;
      const toneBase = Math.min(85, 32 + derivedMentionCount * 4);
      const dominantSource =
        externalNarrative[0]?.source.sourceName ??
        state.mediaFeeds[0]?.source.sourceName ??
        "Live External Signals";

      state.socialListening = {
        ...state.socialListening,
        updatedAt: syncTimestamp,
        mentionCount: derivedMentionCount,
        sentimentScore: toneBase,
        sourceCount: new Set(
          externalNarrative.map((item) => item.source.sourceName).concat(state.mediaFeeds.map((item) => item.source.sourceName))
        ).size,
        positiveShare: Number(Math.min(0.85, 0.42 + derivedMentionCount * 0.02).toFixed(2)),
        dominantSource,
        topTerms: topTermsFromNews(externalNarrative),
        source: {
          sourceName: dominantSource,
          sourceUrl: externalNarrative[0]?.source.sourceUrl ?? state.socialListening.source.sourceUrl,
          fetchedAt: syncTimestamp,
          publishedAt: syncTimestamp,
          freshnessStatus: derivedMentionCount > 0 ? "live" : "manual",
          confidence: derivedMentionCount > 0 ? 0.61 : 0.42,
          fallbackMode: derivedMentionCount > 0 ? "cached" : "manual"
        }
      };
    }

    const liveSourceCount = state.sources.filter((source) => source.freshnessStatus === "live").length;
    const staleSourceCount = state.sources.filter((source) => source.freshnessStatus === "stale").length;
    const delayedSourceCount = state.sources.filter((source) => source.freshnessStatus === "delayed").length;
    const newSignalCount = externalNews.length + incomingProjects.length + mapCollections.length + mediaFeedUpdates.length;
    const warningCount = state.resilience.warnings.length;

    state.changePulse = {
      updatedAt: syncTimestamp,
      items: [
        {
          id: "change-new-signals",
          label: { th: "สัญญาณใหม่", en: "New Signals" },
          value: newSignalCount,
          tone: newSignalCount > 0 ? "positive" : "neutral",
          detail: {
            th: `ข่าว ${externalNews.length} | แผนที่ ${mapCollections.length} | โครงการ ${incomingProjects.length}`,
            en: `${externalNews.length} news | ${mapCollections.length} map updates | ${incomingProjects.length} project changes`
          }
        },
        {
          id: "change-live-sources",
          label: { th: "แหล่งข้อมูลสด", en: "Live Sources" },
          value: liveSourceCount,
          tone: staleSourceCount > 0 ? "warning" : "neutral",
          detail: {
            th: `${staleSourceCount + delayedSourceCount} แหล่งข้อมูลต้องติดตาม`,
            en: `${staleSourceCount + delayedSourceCount} source(s) need attention`
          }
        },
        {
          id: "change-social",
          label: { th: "การกล่าวถึง", en: "Mentions" },
          value: state.socialListening.mentionCount,
          tone: state.socialListening.mentionCount >= 12 ? "positive" : "neutral",
          detail: {
            th: `แหล่งหลัก: ${state.socialListening.dominantSource}`,
            en: `Lead source: ${state.socialListening.dominantSource}`
          }
        },
        {
          id: "change-alerts",
          label: { th: "จุดเฝ้าระวัง", en: "Watchpoints" },
          value: warningCount,
          tone: warningCount > 0 ? "warning" : "neutral",
          detail: {
            th: state.resilience.warnings[0]?.th ?? "ไม่มีการเตือนเพิ่มเติม",
            en: state.resilience.warnings[0]?.en ?? "No active warnings"
          }
        }
      ],
      thresholds: [
        {
          id: "threshold-media",
          label: { th: "สัญญาณสื่อ", en: "Media Spike" },
          state: state.socialListening.mentionCount >= 20 ? "alert" : state.socialListening.mentionCount >= 10 ? "watch" : "ok",
          detail: {
            th: "ติดตามเมื่อจำนวนการกล่าวถึงเพิ่มขึ้นเร็ว",
            en: "Escalate when mentions rise sharply"
          }
        },
        {
          id: "threshold-stale",
          label: { th: "ข้อมูลล่าช้า", en: "Stale Sources" },
          state: staleSourceCount > 1 ? "alert" : staleSourceCount > 0 || delayedSourceCount > 0 ? "watch" : "ok",
          detail: {
            th: `${staleSourceCount + delayedSourceCount} แหล่งข้อมูลนอกกรอบสด`,
            en: `${staleSourceCount + delayedSourceCount} sources outside the fresh window`
          }
        },
        {
          id: "threshold-air",
          label: { th: "คุณภาพอากาศ", en: "Air Quality" },
          state: state.resilience.aqi >= 90 ? "alert" : state.resilience.aqi >= 60 ? "watch" : "ok",
          detail: {
            th: `AQI ปัจจุบัน ${state.resilience.aqi}`,
            en: `Current AQI ${state.resilience.aqi}`
          }
        }
      ]
    };

    const newActivityEntries: ActivityLogItem[] = results.map((result, index) => {
      const source = sourceMap.get(result.sourceId);
      return {
        id: `activity-${result.sourceId}-${result.fetchedAt}-${index}`,
        timestamp: result.fetchedAt,
        sourceId: result.sourceId,
        label: source?.name ?? result.sourceId,
        detail: result.message,
        status: result.status
      };
    });

    state.activityLog = [...newActivityEntries, ...state.activityLog].slice(0, 24);

    const trackedCities = state.mapFeaturesByLayer["smart-city-thailand"]?.features.length ?? citySeed.length;
    const officialUpdates =
      state.news.filter((item) => item.kind === "official").length +
      state.projects.filter((project) => project.source.sourceName === "Smart City Thailand Office").length;

    state.officialImpact = {
      ...state.officialImpact,
      updatedAt: syncTimestamp,
      officialUpdates,
      liveSources: liveSourceCount,
      trackedCities,
      publicSignals: state.news.filter((item) => item.kind === "external").length + state.mediaFeeds.length,
      latestHeadline: cloneSeed(state.briefing.headline),
      source: {
        ...state.officialImpact.source,
        fetchedAt: syncTimestamp,
        publishedAt: syncTimestamp,
        freshnessStatus: staleSourceCount > 0 ? "delayed" : "live"
      }
    };

    persistCurrentState();
    return this.getSyncHealth();
  }
};
