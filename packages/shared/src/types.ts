export type Locale = "th" | "en";
export type DashboardView = "national" | "city" | "domain";
export type TimeRange = "24h" | "7d" | "30d" | "90d";
export type FreshnessStatus = "live" | "delayed" | "stale" | "manual";
export type FallbackMode = "live" | "cached" | "manual";
export type TrendDirection = "up" | "down" | "steady";

export interface LocalizedText {
  th: string;
  en: string;
}

export interface SourceMeta {
  sourceName: string;
  sourceUrl?: string;
  fetchedAt: string;
  publishedAt?: string;
  freshnessStatus: FreshnessStatus;
  confidence: number;
  fallbackMode: FallbackMode;
}

export interface PulseMetric {
  id: string;
  label: LocalizedText;
  value: number;
  unit?: string;
  displayValue: string;
  trend: TrendDirection;
  deltaText: LocalizedText;
  tone: "positive" | "neutral" | "warning";
  meta: SourceMeta;
}

export interface DomainScorecard {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  score: number;
  trend: TrendDirection;
}

export interface CityScore {
  domainSlug: string;
  score: number;
}

export interface CityProfile {
  id: string;
  slug: string;
  name: LocalizedText;
  region: LocalizedText;
  population: number;
  focus: LocalizedText;
  scores: CityScore[];
}

export interface ProjectRecord {
  id: string;
  slug: string;
  title: LocalizedText;
  citySlug: string;
  domainSlug: string;
  status: "active" | "watch" | "delayed" | "planned";
  completionPercent: number;
  owner: LocalizedText;
  summary: LocalizedText;
  nextMilestone: LocalizedText;
  updatedAt: string;
  source: SourceMeta;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  kind: "official" | "external";
  citySlug?: string;
  domainSlug?: string;
  publishedAt: string;
  source: SourceMeta;
}

export interface MapLayerConfig {
  id: string;
  label: LocalizedText;
  active: boolean;
  color: string;
  kind: "signal" | "dataset" | "external";
  defaultViews: Array<"bangkok" | "national">;
  sourceId: string;
  legendLabel?: string;
  zIndex?: number;
}

export interface GeoFeatureRecord {
  id: string;
  layerId: string;
  geometryType: "Point" | "LineString" | "Polygon";
  coordinates: unknown;
  title: string;
  description?: string;
  properties: Record<string, string | number | boolean | null>;
  source: SourceMeta;
}

export interface MapFeatureCollection {
  layerId: string;
  updatedAt: string;
  features: GeoFeatureRecord[];
  bounds?: [number, number, number, number];
  source: SourceMeta;
}

export interface MediaFeedItem {
  id: string;
  kind: "tv" | "webcam" | "stream" | "link";
  label: string;
  region?: string;
  embedUrl?: string;
  externalUrl?: string;
  isEmbeddable: boolean;
  status: "live" | "offline" | "unknown";
  source: SourceMeta;
}

export interface ResilienceSnapshot {
  updatedAt: string;
  weatherSummary: LocalizedText;
  pollutionSummary: LocalizedText;
  warnings: LocalizedText[];
  weatherTemperatureC: number;
  aqi: number;
  source: SourceMeta;
}

export interface ChangePulseItem {
  id: string;
  label: LocalizedText;
  value: number;
  tone: "positive" | "neutral" | "warning";
  detail: LocalizedText;
}

export interface ChangePulseThreshold {
  id: string;
  label: LocalizedText;
  state: "ok" | "watch" | "alert";
  detail: LocalizedText;
}

export interface ChangePulse {
  updatedAt: string;
  items: ChangePulseItem[];
  thresholds: ChangePulseThreshold[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  sourceId: string;
  label: string;
  detail: string;
  status: FreshnessStatus;
}

export interface SocialListeningSnapshot {
  updatedAt: string;
  mentionCount: number;
  sentimentScore: number;
  sourceCount: number;
  positiveShare: number;
  dominantSource: string;
  topTerms: string[];
  source: SourceMeta;
}

export interface OfficialImpactSnapshot {
  updatedAt: string;
  officialUpdates: number;
  liveSources: number;
  trackedCities: number;
  publicSignals: number;
  latestHeadline: LocalizedText;
  source: SourceMeta;
}

export interface SourceRecord {
  id: string;
  name: string;
  category: "catalog" | "news" | "environment" | "time" | "geospatial";
  url: string;
  freshnessStatus: FreshnessStatus;
  lastCheckedAt: string;
  message: string;
}

export interface SyncHealthRecord {
  sourceId: string;
  status: FreshnessStatus;
  fetchedAt: string;
  message: string;
}

export interface BriefingNote {
  id: string;
  headline: LocalizedText;
  body: LocalizedText;
  updatedAt: string;
  source: SourceMeta;
}

export interface TimeSnapshot {
  updatedAt: string;
  utcIso: string;
  bangkokIso: string;
  zones: Array<{
    label: string;
    timeZone: string;
    localTime: string;
  }>;
}

export interface OverviewSnapshot {
  updatedAt: string;
  view: DashboardView;
  timeRange: TimeRange;
  selectedCity?: string;
  selectedDomain?: string;
  activeLayers: string[];
  metrics: PulseMetric[];
  briefing: BriefingNote;
  cities: CityProfile[];
  domains: DomainScorecard[];
  sources: SourceRecord[];
}
