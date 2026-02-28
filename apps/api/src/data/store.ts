import {
  activityLog as activityLogSeed,
  briefing as briefingSeed,
  cities as citySeed,
  changePulse as changePulseSeed,
  cloneSeed,
  createTimeSnapshot,
  domains as domainSeed,
  mapFeatureCollections as mapFeatureSeed,
  mapLayers as layerSeed,
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
  BriefingNote,
  ChangePulse,
  DashboardView,
  MapFeatureCollection,
  MapLayerConfig,
  MediaFeedItem,
  NewsItem,
  OfficialImpactSnapshot,
  OverviewSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SocialListeningSnapshot,
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
  changePulse: ChangePulse;
  activityLog: ActivityLogItem[];
  socialListening: SocialListeningSnapshot;
  officialImpact: OfficialImpactSnapshot;
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
    sources: cloneSeed(sourceSeed),
    briefing: cloneSeed(briefingSeed),
    resilience: cloneSeed(resilienceSeed),
    changePulse: cloneSeed(changePulseSeed),
    activityLog: cloneSeed(activityLogSeed),
    socialListening: cloneSeed(socialListeningSeed),
    officialImpact: cloneSeed(officialImpactSeed),
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

  getChangePulse() {
    return cloneSeed(state.changePulse);
  },

  getActivityLog(limit?: number) {
    return cloneSeed(state.activityLog.slice(0, limit ?? state.activityLog.length));
  },

  getSocialListening() {
    return cloneSeed(state.socialListening);
  },

  getOfficialImpact() {
    return cloneSeed(state.officialImpact);
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

    return this.getSyncHealth();
  }
};
