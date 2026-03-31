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
  districtSlug?: string;
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
  districtSlug?: string;
  domainSlug?: string;
  publishedAt: string;
  source: SourceMeta;
}

export interface DistrictProfile {
  id: string;
  slug: string;
  citySlug: string;
  name: LocalizedText;
  population: number;
  focus: LocalizedText;
  priority: LocalizedText;
  riskLevel: "low" | "watch" | "high";
  updatedAt: string;
  center?: [number, number];
  bounds?: [number, number, number, number];
  watchpoints: LocalizedText[];
  recommendedLayers: string[];
  source: SourceMeta;
}

export interface DecisionQueueItem {
  id: string;
  citySlug: string;
  districtSlug?: string;
  domainSlug: string;
  title: LocalizedText;
  summary: LocalizedText;
  severity: "monitor" | "watch" | "urgent";
  status: "new" | "in-progress" | "ready";
  confidence: number;
  owner: LocalizedText;
  recommendedAction: LocalizedText;
  dueAt: string;
  updatedAt: string;
  sourceIds: string[];
  layerIds: string[];
}

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: "briefing" | "news" | "project" | "source-sync" | "media-feed";
  entityId: string;
  detail: string;
  status: "manual" | "success" | "failed";
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

export interface TrendKeyword {
  term: LocalizedText;
  count: number;
  trend: TrendDirection;
  sentiment: "positive" | "neutral" | "negative";
}

export interface SocialListeningSnapshot {
  updatedAt: string;
  mentionCount: number;
  sentimentScore: number;
  sourceCount: number;
  positiveShare: number;
  dominantSource: string;
  topTerms: string[];
  trendKeywords?: TrendKeyword[];
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

export interface MarketSignalItem {
  id: string;
  label: LocalizedText;
  value: string;
  changeText: LocalizedText;
  tone: "positive" | "neutral" | "warning";
}

export interface MarketSnapshot {
  updatedAt: string;
  items: MarketSignalItem[];
  source: SourceMeta;
}

export interface SourceRecord {
  id: string;
  name: string;
  category: "catalog" | "news" | "environment" | "time" | "geospatial" | "finance";
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
  thaiTime?: string;
  thaiDate?: string;
  buddhistYear?: number;
  zones: Array<{
    label: string;
    timeZone: string;
    localTime: string;
  }>;
}

export interface AssistantViewContext {
  view: DashboardView;
  citySlug?: string;
  cityName?: string;
  districtSlug?: string;
  districtName?: string;
  domainSlug?: string;
  domainLabel?: string;
  activeLayers: string[];
  executiveSignal?: string;
  watchpoints?: string[];
}

export interface AssistantQueryRequest {
  question: string;
  locale?: Locale;
  context: AssistantViewContext;
}

export interface KnowledgeCitation {
  id: string;
  documentTitle: string;
  fileName: string;
  excerpt: string;
  pageLabel?: string;
  score: number;
}

export interface AssistantResponse {
  answer: LocalizedText;
  contextSummary: LocalizedText;
  citations: KnowledgeCitation[];
  provider: "local-rag" | "gemini";
  generatedAt: string;
  knowledgeAvailable: boolean;
  documentCount: number;
  geminiReady: boolean;
}

export interface AssistantStatus {
  available: boolean;
  documentCount: number;
  indexedAt?: string;
  knowledgeDir?: string;
  geminiReady: boolean;
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

export type SatellitePreviewPresetId = "true-color" | "vegetation" | "flood-radar";

export interface SatelliteAreaOfInterest {
  id: string;
  label: LocalizedText;
  bbox: [number, number, number, number];
}

export interface SatelliteServiceStatus {
  provider: "copernicus-data-space";
  configured: boolean;
  available: boolean;
  mode: "oauth-live" | "not-configured" | "degraded";
  message: string;
  docsUrl: string;
}

export interface SatellitePreviewItem {
  id: SatellitePreviewPresetId;
  title: LocalizedText;
  description: LocalizedText;
  collectionId: string;
  previewUrl: string;
  legend: LocalizedText;
  note: LocalizedText;
  available: boolean;
  generatedAt?: string;
  sceneDate?: string;
  cloudCover?: number;
}

export interface SatelliteMetric {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  collectionId: string;
  value: number | null;
  displayValue: string;
  unit?: string;
}

export interface SatelliteSceneRecord {
  id: string;
  collectionId: string;
  title: string;
  timestamp: string;
  cloudCover?: number;
  quicklookUrl?: string;
}

export interface SatelliteStatsResponse {
  updatedAt: string;
  area: SatelliteAreaOfInterest;
  status: SatelliteServiceStatus;
  metrics: SatelliteMetric[];
}

export interface SatelliteSearchResponse {
  updatedAt: string;
  area: SatelliteAreaOfInterest;
  status: SatelliteServiceStatus;
  collectionId: string;
  scenes: SatelliteSceneRecord[];
}

export interface SatelliteDigest {
  updatedAt: string;
  area: SatelliteAreaOfInterest;
  status: SatelliteServiceStatus;
  previews: SatellitePreviewItem[];
  metrics: SatelliteMetric[];
  scenes: SatelliteSceneRecord[];
}

export type CommandConnectorStatus = "live" | "ready" | "pilot" | "planned";
export type CommandSignalStatus = "live" | "ready" | "pilot" | "planned";

export interface CommandCenterMetric {
  id: string;
  label: LocalizedText;
  value: string;
  detail: LocalizedText;
  tone: "positive" | "neutral" | "warning";
}

export interface CommandConnector {
  id: string;
  title: string;
  project: string;
  category: "mobility" | "environment" | "earth-observation" | "reporting" | "media" | "analytics" | "platform";
  status: CommandConnectorStatus;
  route?: string;
  cadence: string;
  auth: string;
  detail: LocalizedText;
  systems: string[];
}

export interface CameraEventSample {
  id: string;
  cameraId: string;
  zone: LocalizedText;
  detection: LocalizedText;
  detail: LocalizedText;
  severity: "watch" | "alert" | "stable";
  status: LocalizedText;
  model: string;
  minutesAgo: number;
  confidence: number;
  targetLayers: string[];
}

export interface SensorFeedSample {
  id: string;
  label: LocalizedText;
  zone: LocalizedText;
  category: "traffic" | "parking" | "crowd" | "weather" | "water" | "air";
  status: CommandSignalStatus;
  value: string;
  detail: LocalizedText;
  cadence: string;
  sourceLabel: string;
  targetLayers: string[];
}

export interface ReporterCaseSample {
  id: string;
  ticketNumber: string;
  problemType: LocalizedText;
  description: LocalizedText;
  locationText: string;
  urgency: "low" | "medium" | "high";
  status: "received" | "assigned" | "in_progress" | "completed";
  teamName: string;
  staffName: string;
  aiSummary: LocalizedText;
  matchedCameraId?: string;
  minutesAgo: number;
  targetLayers: string[];
}

export interface WorkflowBoardStatus {
  id: string;
  title: LocalizedText;
  status: "live" | "watch" | "pilot" | "stable";
  metric: string;
  detail: LocalizedText;
}

export interface FusionQueueItem {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  confidence: number;
}

export interface ExpansionTrack {
  id: string;
  title: LocalizedText;
  stage: "base" | "next" | "future";
  detail: LocalizedText;
  systems: string[];
}

export interface PublicCctvCamera {
  id: string;
  cameraId: string;
  label: LocalizedText;
  source: string;
  lat: number;
  lon: number;
  imageUrl: string;
  previewUrl?: string;
  status: "live" | "offline" | "unknown";
  statusDetail?: LocalizedText;
  lastCheckedAt?: string;
  lastSuccessfulAt?: string;
  statusCode?: number | null;
  zone: string;
}

export interface CommandCenterSnapshot {
  updatedAt: string;
  zoneLabel: LocalizedText;
  mission: LocalizedText;
  screenMode: LocalizedText;
  metrics: CommandCenterMetric[];
  connectors: CommandConnector[];
  cameraEvents: CameraEventSample[];
  sensorFeeds: SensorFeedSample[];
  reporterCases: ReporterCaseSample[];
  workflowBoards: WorkflowBoardStatus[];
  fusionQueue: FusionQueueItem[];
  expansionTracks: ExpansionTrack[];
}

/* ── IMPACT Arena & Venue Events ── */
export type EventCategory = "concert" | "expo" | "convention" | "sport" | "graduation" | "other";

export interface ImpactArenaEvent {
  id: string;
  title: LocalizedText;
  venue: LocalizedText;
  date: string;
  timeStart: string;
  timeEnd: string;
  expectedCrowd: number;
  category: EventCategory;
  parkingPressure: "low" | "moderate" | "high";
  status: "confirmed" | "tentative" | "cancelled";
  hall?: string;
  hallCapacity?: number;
  organizer?: string;
  ticketUrl?: string;
}

/* ── MTT Traffic Corridors ── */
export type TrafficCorridorStatus = "clear" | "moderate" | "congested" | "blocked";

export interface TrafficCorridor {
  id: string;
  label: LocalizedText;
  status: TrafficCorridorStatus;
  speedKmh: number;
  delayMinutes: number;
  trend: TrendDirection;
}

export interface MttTrafficSnapshot {
  updatedAt: string;
  corridors: TrafficCorridor[];
  overallStatus: TrafficCorridorStatus;
  source: SourceMeta;
}

/* ── MUC (Municipal Operations Center) ── */

/* Gate & Vehicle Intelligence */
export type VehicleClass = "car" | "pickup" | "van" | "bus" | "truck" | "motorcycle";
export type DetectionType = "plate-read" | "vehicle-count" | "vehicle-classify";
export type GateDirection = "entry" | "exit" | "bidirectional";

export interface MttGate {
  id: string;
  label: LocalizedText;
  direction: GateDirection;
  lat: number;
  lon: number;
  corridorId?: string;
  cameraIds: string[];
  capacity: number; // vehicles per hour
}

export interface VehicleDetection {
  id: string;
  cameraId: string;
  gateId: string;
  timestamp: string;
  detectionType: DetectionType;
  plateText?: string;
  plateConfidence?: number;
  vehicleClass: VehicleClass;
  direction: "in" | "out";
  confidence: number;
  model: string;
}

export interface GateFlowBucket {
  gateId: string;
  periodStart: string;
  periodMinutes: number; // 15 or 60
  countIn: number;
  countOut: number;
  byClass: Partial<Record<VehicleClass, { in: number; out: number }>>;
  avgSpeedKmh?: number;
}

export interface EntryExitMatch {
  id: string;
  entryGateId: string;
  exitGateId: string;
  entryTime: string;
  exitTime: string;
  transitMinutes: number;
  vehicleClass: VehicleClass;
  plateHash?: string; // anonymized
  confidence: number;
}

export interface GateFlowSnapshot {
  updatedAt: string;
  gates: MttGate[];
  buckets: GateFlowBucket[];
  recentDetections: VehicleDetection[];
  matches: EntryExitMatch[];
  source: SourceMeta;
}

/* Traffic Flow Intelligence */
export type BottleneckSeverity = "clear" | "building" | "bottleneck" | "gridlock";

export interface TrafficFlowLine {
  id: string;
  fromGateId: string;
  toGateId: string;
  volumePerHour: number;
  avgTransitMinutes: number;
  status: BottleneckSeverity;
  coordinates: [number, number][]; // polyline [lat, lon][]
}

export interface TrafficBottleneck {
  id: string;
  corridorId: string;
  label: LocalizedText;
  severity: BottleneckSeverity;
  volumeRatio: number; // current / capacity, e.g. 1.42 = 142%
  estimatedDelayMinutes: number;
  suggestion: LocalizedText;
  lat: number;
  lon: number;
}

export interface TrafficHourlyPattern {
  hour: number; // 0-23
  avgVolumeIn: number;
  avgVolumeOut: number;
  avgSpeedKmh: number;
  peakGateId?: string;
}

export interface TrafficFlowSnapshot {
  updatedAt: string;
  flowLines: TrafficFlowLine[];
  bottlenecks: TrafficBottleneck[];
  hourlyPatterns: TrafficHourlyPattern[];
  suggestions: LocalizedText[];
  source: SourceMeta;
}

/* Air Quality Construction Monitoring */
export type AqiZoneType = "residential" | "construction" | "commercial" | "mixed" | "green-space";

export interface AqiSensorPlacement {
  id: string;
  label: LocalizedText;
  lat: number;
  lon: number;
  installed: boolean; // true = real, false = recommended
  provider: string;
  zoneType: AqiZoneType;
}

export interface AqiZoneCard {
  id: string;
  label: LocalizedText;
  zoneType: AqiZoneType;
  currentAqi: number;
  pm25: number;
  pm10: number;
  threshold: number; // 75 for construction, 100 for normal
  isAboveThreshold: boolean;
  trend: TrendDirection;
  detail: LocalizedText;
  sensorIds: string[];
  constructionNote?: LocalizedText;
}

export interface AqiHistoryPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AqiConstructionPhase {
  id: string;
  label: LocalizedText;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "planned";
  avgAqiDelta: number; // how much AQI rose vs baseline
  detail: LocalizedText;
}

export interface AqiConstructionSnapshot {
  updatedAt: string;
  overallAqi: number;
  overallTrend: TrendDirection;
  zones: AqiZoneCard[];
  sensors: AqiSensorPlacement[];
  history: AqiHistoryPoint[];
  constructionPhases: AqiConstructionPhase[];
  alertCount: number;
  source: SourceMeta;
}

/* CCTV Operations Console */
export type CctvGridLayout = "2x2" | "3x3" | "4x4";

export interface CctvCameraGroup {
  id: string;
  label: LocalizedText;
  gateId?: string;
  zone: string;
  cameraIds: string[];
}

export interface CctvDetectionHistoryItem {
  id: string;
  cameraId: string;
  timestamp: string;
  detectionType: DetectionType;
  detail: LocalizedText;
  severity: "watch" | "alert" | "stable";
  confidence: number;
}

export interface CctvConsoleSnapshot {
  updatedAt: string;
  groups: CctvCameraGroup[];
  detectionHistory: CctvDetectionHistoryItem[];
  source: SourceMeta;
}

/* MUC Top-Level */
export interface MucSnapshot {
  updatedAt: string;
  gateFlow: GateFlowSnapshot;
  trafficFlow: TrafficFlowSnapshot;
  airQuality: AqiConstructionSnapshot;
  cctvConsole: CctvConsoleSnapshot;
}

/* ── AI Vision Pipeline ── */
export type VisionModelId = "yolov8-vehicle" | "lpr-th-v2" | "crowd-flow" | "incident-sense";

export interface VisionPipelineConfig {
  id: string;
  cameraId: string;
  modelId: VisionModelId;
  enabled: boolean;
  interval: number;
  confidenceThreshold: number;
  rtspUrl?: string;
  mjpegUrl?: string;
  status: "ready" | "active" | "error" | "waiting-camera";
  lastFrameAt?: string;
  lastDetectionAt?: string;
  detectionCount: number;
}

export interface VisionDetectionItem {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  metadata?: Record<string, string | number>;
}

export interface VisionDetectionResult {
  id: string;
  pipelineId: string;
  cameraId: string;
  modelId: VisionModelId;
  timestamp: string;
  frameUrl?: string;
  detections: VisionDetectionItem[];
  processingMs: number;
}

/* ── Incident / Maintenance Tracker ── */
export type IncidentCategory = "water" | "road" | "electrical" | "security" | "waste" | "noise" | "construction" | "other";
export type IncidentStatus = "new" | "assigned" | "in-progress" | "resolved" | "closed";

export interface IncidentRecord {
  id: string;
  ticketNumber: string;
  title: LocalizedText;
  description: LocalizedText;
  category: IncidentCategory;
  urgency: "low" | "medium" | "high" | "critical";
  status: IncidentStatus;
  lat: number;
  lon: number;
  zoneId?: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  photoUrls: string[];
  aiSummary?: LocalizedText;
  matchedCameraId?: string;
  updatedAt: string;
}

/* ── Flood & Water Monitoring ── */
export interface WaterLevelStation {
  id: string;
  label: LocalizedText;
  lat: number;
  lon: number;
  provider: "thaiwater" | "rid" | "bma-drainage" | "manual";
  currentLevelM: number;
  warningLevelM: number;
  criticalLevelM: number;
  status: "normal" | "watch" | "warning" | "critical";
  trend: TrendDirection;
  lastUpdated: string;
}

export interface FloodRiskSnapshot {
  updatedAt: string;
  stations: WaterLevelStation[];
  precipitationForecast24h: number;
  precipitationForecast48h: number;
  floodRiskLevel: "low" | "moderate" | "high" | "critical";
  drainagePumpStatus: "all-operational" | "partial" | "emergency";
  activeWarnings: LocalizedText[];
  source: SourceMeta;
}

/* ── Public Transit ── */
export type TransitLine = "mrt-purple" | "mrt-blue" | "bts-sukhumvit" | "bts-silom" | "shuttle" | "bus";

export interface TransitConnection {
  id: string;
  line: TransitLine;
  routeNumber?: string;
  station: LocalizedText;
  direction?: LocalizedText;
  distanceKm: number;
  travelMinutes: number;
  status: "normal" | "delayed" | "disrupted" | "closed";
  nextArrival?: string;
  frequency?: string;
  provider: "bmta" | "bts" | "mrt" | "mtt-shuttle" | "viabus";
  note?: LocalizedText;
}

export interface TransitSnapshot {
  updatedAt: string;
  connections: TransitConnection[];
  source: SourceMeta;
}

/* ── Community Intelligence Feeds ── */
export interface CommunityIntelSnapshot {
  updatedAt: string;
  uvIndex: number;
  uvLabel: string;
  sunriseLocal: string;
  sunsetLocal: string;
  flightsOverhead: number;
  nearbyEarthquakes: Array<{
    magnitude: number;
    place: string;
    time: string;
    distanceKm: number;
  }>;
  thaiHolidays: Array<{
    date: string;
    localName: string;
    name: string;
  }>;
  lotteryLatest?: {
    date: string;
    firstPrize: string;
  };
  populationThailand: number;
  githubLastCommit?: string;
}
