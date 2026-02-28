import {
  briefing as briefingSeed,
  cities as citySeed,
  cloneSeed,
  createTimeSnapshot,
  domains as domainSeed,
  mapFeatureCollections as mapFeatureSeed,
  mapLayers as layerSeed,
  mediaFeeds as mediaFeedSeed,
  news as newsSeed,
  overviewMetrics,
  projects as projectSeed,
  resilience as resilienceSeed,
  sources as sourceSeed
} from "@smart-city/shared";
import type {
  BriefingNote,
  DashboardView,
  MapFeatureCollection,
  MapLayerConfig,
  MediaFeedItem,
  NewsItem,
  OverviewSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SourceRecord,
  SyncHealthRecord,
  TimeRange,
  TimeSnapshot
} from "@smart-city/shared";
import type { AdapterSyncResult } from "../adapters/common.js";

interface StoreState {
  projects: ProjectRecord[];
  news: NewsItem[];
  sources: SourceRecord[];
  briefing: BriefingNote;
  resilience: ResilienceSnapshot;
  layers: MapLayerConfig[];
  mapFeaturesByLayer: Record<string, MapFeatureCollection>;
  mediaFeeds: MediaFeedItem[];
  syncHealth: SyncHealthRecord[];
  lastSyncAt: string;
  latestTime: TimeSnapshot;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function createState(): StoreState {
  const mapFeaturesByLayer = Object.fromEntries(
    cloneSeed(mapFeatureSeed).map((collection) => [collection.layerId, collection])
  ) as Record<string, MapFeatureCollection>;

  return {
    projects: cloneSeed(projectSeed),
    news: cloneSeed(newsSeed),
    sources: cloneSeed(sourceSeed),
    briefing: cloneSeed(briefingSeed),
    resilience: cloneSeed(resilienceSeed),
    layers: cloneSeed(layerSeed),
    mapFeaturesByLayer,
    mediaFeeds: cloneSeed(mediaFeedSeed),
    syncHealth: [],
    lastSyncAt: new Date().toISOString(),
    latestTime: createTimeSnapshot()
  };
}

const state = createState();

export const store = {
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

    const metrics = overviewMetrics.map((metric) => {
      if (metric.id === "active-projects") {
        return {
          ...metric,
          value: filteredProjects.length,
          displayValue: String(filteredProjects.length).padStart(2, "0"),
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

  getProjects(filters?: { city?: string; domain?: string; status?: string }) {
    return cloneSeed(
      state.projects.filter((project) => {
        if (filters?.city && project.citySlug !== filters.city) return false;
        if (filters?.domain && project.domainSlug !== filters.domain) return false;
        if (filters?.status && project.status !== filters.status) return false;
        return true;
      })
    );
  },

  getProject(id: string) {
    return state.projects.find((project) => project.id === id || project.slug === id);
  },

  getNews(filters?: { city?: string; domain?: string; kind?: string; limit?: number }) {
    const filtered = state.news.filter((item) => {
      if (filters?.city && item.citySlug && item.citySlug !== filters.city) return false;
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

  getSources() {
    return cloneSeed(state.sources);
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

    return cloneSeed(state.briefing);
  },

  createNews(input: Omit<NewsItem, "id" | "slug" | "publishedAt">) {
    const record: NewsItem = {
      ...input,
      id: `news-${Date.now()}`,
      slug: `news-${Date.now()}`,
      publishedAt: new Date().toISOString()
    };

    state.news.unshift(record);
    return cloneSeed(record);
  },

  createProject(input: Omit<ProjectRecord, "id" | "slug" | "updatedAt">) {
    const record: ProjectRecord = {
      ...input,
      id: `project-${Date.now()}`,
      slug: `project-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    state.projects.unshift(record);
    return cloneSeed(record);
  },

  updateProject(id: string, patch: Partial<ProjectRecord>) {
    const target = state.projects.find((project) => project.id === id || project.slug === id);
    if (!target) return null;

    Object.assign(target, patch, { updatedAt: new Date().toISOString() });
    return cloneSeed(target);
  },

  updateNews(id: string, patch: Partial<NewsItem>) {
    const target = state.news.find((item) => item.id === id || item.slug === id);
    if (!target) return null;

    Object.assign(target, patch);
    return cloneSeed(target);
  },

  applySyncResults(results: AdapterSyncResult[]) {
    state.lastSyncAt = new Date().toISOString();
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
      mapCollections.forEach((collection) => {
        state.mapFeaturesByLayer[collection.layerId] = cloneSeed(collection);
      });
    }

    const mediaFeedUpdates = results.flatMap((result) => result.mediaFeeds ?? []);
    if (mediaFeedUpdates.length > 0) {
      state.mediaFeeds = cloneSeed(mediaFeedUpdates);
    }

    return this.getSyncHealth();
  }
};
