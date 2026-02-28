import type {
  BriefingNote,
  CityProfile,
  DashboardView,
  DomainScorecard,
  GeoFeatureRecord,
  Locale,
  MapLayerConfig,
  MapFeatureCollection,
  MediaFeedItem,
  NewsItem,
  OverviewSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SourceMeta,
  SourceRecord,
  TimeRange,
  TimeSnapshot
} from "./types.js";

const seededAt = "2026-02-28T12:00:00.000Z";

const seedMeta = (
  sourceName: string,
  sourceUrl: string,
  mode: "live" | "manual" = "manual"
): SourceMeta => ({
  sourceName,
  sourceUrl,
  fetchedAt: seededAt,
  publishedAt: seededAt,
  freshnessStatus: mode === "live" ? "live" : "manual",
  confidence: mode === "live" ? 0.88 : 0.72,
  fallbackMode: mode
});

export const domains: DomainScorecard[] = [
  {
    id: "domain-environment",
    slug: "environment",
    title: { th: "สิ่งแวดล้อมอัจฉริยะ", en: "Smart Environment" },
    description: {
      th: "คุณภาพอากาศ น้ำ และการลดผลกระทบจากสภาพอากาศ",
      en: "Air, water, and climate resilience performance."
    },
    score: 78,
    trend: "up"
  },
  {
    id: "domain-economy",
    slug: "economy",
    title: { th: "เศรษฐกิจอัจฉริยะ", en: "Smart Economy" },
    description: {
      th: "การลงทุน เมืองนวัตกรรม และมูลค่าทางเศรษฐกิจ",
      en: "Investment, innovation clusters, and economic movement."
    },
    score: 73,
    trend: "up"
  },
  {
    id: "domain-mobility",
    slug: "mobility",
    title: { th: "การเดินทางอัจฉริยะ", en: "Smart Mobility" },
    description: {
      th: "การเชื่อมต่อ การเข้าถึง และประสิทธิภาพการเดินทาง",
      en: "Connectivity, access, and transport performance."
    },
    score: 69,
    trend: "steady"
  },
  {
    id: "domain-energy",
    slug: "energy",
    title: { th: "พลังงานอัจฉริยะ", en: "Smart Energy" },
    description: {
      th: "ประสิทธิภาพพลังงานและพลังงานทางเลือก",
      en: "Energy efficiency and alternative energy adoption."
    },
    score: 66,
    trend: "up"
  },
  {
    id: "domain-people",
    slug: "people",
    title: { th: "คนอัจฉริยะ", en: "Smart People" },
    description: {
      th: "ทักษะ การมีส่วนร่วม และกำลังคนแห่งอนาคต",
      en: "Skills, participation, and future-ready talent."
    },
    score: 71,
    trend: "up"
  },
  {
    id: "domain-living",
    slug: "living",
    title: { th: "การใช้ชีวิตอัจฉริยะ", en: "Smart Living" },
    description: {
      th: "คุณภาพชีวิต สุขภาพ ความปลอดภัย และบริการเมือง",
      en: "Quality of life, safety, and public-service access."
    },
    score: 75,
    trend: "steady"
  },
  {
    id: "domain-governance",
    slug: "governance",
    title: { th: "การบริหารภาครัฐอัจฉริยะ", en: "Smart Governance" },
    description: {
      th: "ข้อมูลเปิด ความโปร่งใส และการตอบสนองของภาครัฐ",
      en: "Open data, transparency, and response discipline."
    },
    score: 72,
    trend: "up"
  }
];

export const cities: CityProfile[] = [
  {
    id: "city-bangkok",
    slug: "bangkok",
    name: { th: "กรุงเทพมหานคร", en: "Bangkok" },
    region: { th: "ภาคกลาง", en: "Central" },
    population: 10539000,
    focus: {
      th: "การจัดการน้ำ การเดินทาง และบริการดิจิทัลระดับเมือง",
      en: "Flood response, mobility, and city-scale digital services."
    },
    scores: [
      { domainSlug: "environment", score: 79 },
      { domainSlug: "mobility", score: 74 },
      { domainSlug: "governance", score: 77 }
    ]
  },
  {
    id: "city-phuket",
    slug: "phuket",
    name: { th: "ภูเก็ต", en: "Phuket" },
    region: { th: "ภาคใต้", en: "South" },
    population: 417000,
    focus: {
      th: "การท่องเที่ยวอัจฉริยะ ความปลอดภัย และโครงสร้างพื้นฐาน",
      en: "Smart tourism, safety, and infrastructure readiness."
    },
    scores: [
      { domainSlug: "economy", score: 76 },
      { domainSlug: "living", score: 74 },
      { domainSlug: "governance", score: 70 }
    ]
  },
  {
    id: "city-khon-kaen",
    slug: "khon-kaen",
    name: { th: "ขอนแก่น", en: "Khon Kaen" },
    region: { th: "ภาคตะวันออกเฉียงเหนือ", en: "Northeast" },
    population: 412000,
    focus: {
      th: "การเดินทางสาธารณะและการพัฒนาเศรษฐกิจระดับภูมิภาค",
      en: "Public transport and regional economic modernization."
    },
    scores: [
      { domainSlug: "mobility", score: 73 },
      { domainSlug: "economy", score: 72 },
      { domainSlug: "people", score: 68 }
    ]
  },
  {
    id: "city-chiang-mai",
    slug: "chiang-mai",
    name: { th: "เชียงใหม่", en: "Chiang Mai" },
    region: { th: "ภาคเหนือ", en: "North" },
    population: 1270000,
    focus: {
      th: "อากาศ คุณภาพชีวิต และนวัตกรรมเชิงวัฒนธรรม",
      en: "Air quality, livability, and cultural innovation."
    },
    scores: [
      { domainSlug: "environment", score: 74 },
      { domainSlug: "living", score: 76 },
      { domainSlug: "people", score: 71 }
    ]
  }
];

export const projects: ProjectRecord[] = [
  {
    id: "project-1",
    slug: "bangkok-flood-command",
    title: { th: "ศูนย์สั่งการน้ำท่วมกรุงเทพ", en: "Bangkok Flood Command Grid" },
    citySlug: "bangkok",
    domainSlug: "environment",
    status: "active",
    completionPercent: 81,
    owner: { th: "สำนักงานเมืองอัจฉริยะ", en: "Smart City Office" },
    summary: {
      th: "เชื่อมข้อมูลฝน ระบายน้ำ และสัญญาณภาคสนามเพื่อจัดการการตอบสนอง",
      en: "Links rainfall, drainage, and field signals for faster flood response."
    },
    nextMilestone: {
      th: "ทดสอบเตือนภัย 10 เขตในไตรมาสหน้า",
      en: "Pilot district warning workflow in 10 districts next quarter."
    },
    updatedAt: seededAt,
    source: seedMeta("Smart City Thailand Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
  },
  {
    id: "project-2",
    slug: "phuket-tourism-mobility-loop",
    title: { th: "Phuket Tourism Mobility Loop", en: "Phuket Tourism Mobility Loop" },
    citySlug: "phuket",
    domainSlug: "mobility",
    status: "watch",
    completionPercent: 58,
    owner: { th: "เทศบาลและพันธมิตรท้องถิ่น", en: "Municipal and local partners" },
    summary: {
      th: "เชื่อมการเดินทาง การท่องเที่ยว และความปลอดภัยในโครงข่ายเดียว",
      en: "Unifies mobility, tourism, and safety data into one operating view."
    },
    nextMilestone: {
      th: "เชื่อมข้อมูลรถโดยสารและจุดท่องเที่ยวหลัก",
      en: "Connect transport feeds and major tourist nodes."
    },
    updatedAt: seededAt,
    source: seedMeta("CityData Thailand", "https://www.citydata.in.th")
  },
  {
    id: "project-3",
    slug: "khon-kaen-civic-transit",
    title: { th: "Khon Kaen Civic Transit Pulse", en: "Khon Kaen Civic Transit Pulse" },
    citySlug: "khon-kaen",
    domainSlug: "people",
    status: "active",
    completionPercent: 67,
    owner: { th: "ภาคีเมืองและมหาวิทยาลัย", en: "City coalition and universities" },
    summary: {
      th: "ใช้ข้อมูลสาธารณะเพื่อติดตามการเข้าถึงบริการและการเดินทาง",
      en: "Tracks service access and mobility outcomes with public data."
    },
    nextMilestone: {
      th: "เผยแพร่แดชบอร์ดชุมชนเวอร์ชันสาธารณะ",
      en: "Publish public community-facing metrics board."
    },
    updatedAt: seededAt,
    source: seedMeta("data.go.th", "https://data.go.th")
  }
];

export const news: NewsItem[] = [
  {
    id: "news-1",
    slug: "official-quarterly-briefing",
    title: {
      th: "สรุปสถานะเมืองอัจฉริยะประจำไตรมาส",
      en: "Quarterly Smart City Thailand operating brief published"
    },
    excerpt: {
      th: "สรุปความคืบหน้า โครงการเร่งด่วน และเมืองที่ต้องจับตา",
      en: "Highlights program momentum, urgent projects, and cities requiring attention."
    },
    kind: "official",
    publishedAt: seededAt,
    source: seedMeta("Smart City Thailand Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
  },
  {
    id: "news-2",
    slug: "citydata-new-dashboard",
    title: {
      th: "CityData ขยายชุดแดชบอร์ดเมืองและข้อมูลเปิด",
      en: "CityData expands city dashboards and open datasets"
    },
    excerpt: {
      th: "ชุดข้อมูลใหม่ช่วยให้การเปรียบเทียบเมืองและการวิเคราะห์นโยบายทำได้เร็วขึ้น",
      en: "New datasets improve city comparison and policy analysis workflows."
    },
    kind: "external",
    publishedAt: seededAt,
    source: seedMeta("CityData Thailand", "https://www.citydata.in.th", "live")
  },
  {
    id: "news-3",
    slug: "air-quality-watch",
    title: {
      th: "ภาคเหนือเฝ้าระวังคุณภาพอากาศต่อเนื่อง",
      en: "Northern air-quality watch remains elevated"
    },
    excerpt: {
      th: "ตัวชี้วัดด้านสิ่งแวดล้อมยังเป็นจุดที่ต้องเร่งติดตาม",
      en: "Environmental indicators remain a near-term pressure point."
    },
    kind: "external",
    citySlug: "chiang-mai",
    domainSlug: "environment",
    publishedAt: seededAt,
    source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
  }
];

export const sources: SourceRecord[] = [
  {
    id: "citydata",
    name: "CityData Thailand",
    category: "catalog",
    url: "https://www.citydata.in.th",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Catalog and city dashboard metadata ready for normalization."
  },
  {
    id: "data-go-th",
    name: "Open Government Data Thailand",
    category: "catalog",
    url: "https://data.go.th",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Dataset-level adapters should be configured per resource."
  },
  {
    id: "urbanis",
    name: "The Urbanis",
    category: "catalog",
    url: "https://urbandata.theurbanis.com",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Awaiting endpoint confirmation for machine-readable ingestion."
  },
  {
    id: "gistda-disaster",
    name: "GISTDA Disaster API",
    category: "geospatial",
    url: "https://disaster.gistda.or.th/services/open-api",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Ready for map-layer enrichment when endpoint payloads are confirmed."
  },
  {
    id: "google-news-rss",
    name: "Google News RSS",
    category: "news",
    url: "https://news.google.com",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Default free external news feed. Server sync can refresh every 5 minutes."
  },
  {
    id: "bangkok-passages",
    name: "Bangkok Shared Places Map",
    category: "geospatial",
    url: "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.838530327896784%2C100.64165750169461&z=11",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Public Google My Maps layer normalized into the hero map."
  },
  {
    id: "news-api",
    name: "NewsAPI",
    category: "news",
    url: "https://newsapi.org/docs",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Optional secondary news source. Key required only if you want more coverage."
  },
  {
    id: "open-meteo-weather",
    name: "Open-Meteo Forecast",
    category: "environment",
    url: "https://open-meteo.com/en/docs",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Default weather source for v1."
  },
  {
    id: "open-meteo-air",
    name: "Open-Meteo Air Quality",
    category: "environment",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Default air-quality source for v1."
  },
  {
    id: "time-sync",
    name: "Server Time Sync",
    category: "time",
    url: "https://www.nist.gov/pml/time-and-frequency-division/time-services/internet-time-service-its",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Server clock powers UTC and multi-time-zone views."
  },
  {
    id: "live-media",
    name: "Curated Media Feeds",
    category: "news",
    url: "https://www.youtube.com",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Embed-safe and link-safe live media references for the monitor."
  }
];

export const mapLayers: MapLayerConfig[] = [
  {
    id: "smart-city-thailand",
    label: { th: "Smart City TH", en: "Smart City TH" },
    active: true,
    color: "#ff5b57",
    kind: "dataset",
    defaultViews: ["national"],
    sourceId: "citydata",
    legendLabel: "Coverage",
    zIndex: 42
  },
  {
    id: "bangkok-passages",
    label: { th: "Bangkok Places", en: "Bangkok Places" },
    active: true,
    color: "#22c55e",
    kind: "dataset",
    defaultViews: ["bangkok"],
    sourceId: "bangkok-passages",
    legendLabel: "Places",
    zIndex: 40
  },
  {
    id: "projects",
    label: { th: "โครงการ", en: "Projects" },
    active: true,
    color: "#0057ff",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "citydata",
    legendLabel: "Projects",
    zIndex: 30
  },
  {
    id: "news",
    label: { th: "ข่าว", en: "News" },
    active: true,
    color: "#00a16a",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "google-news-rss",
    legendLabel: "News",
    zIndex: 35
  },
  {
    id: "resilience",
    label: { th: "ความยืดหยุ่น", en: "Resilience" },
    active: true,
    color: "#ff8f00",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "open-meteo-weather",
    legendLabel: "Resilience",
    zIndex: 20
  },
  {
    id: "economy",
    label: { th: "เศรษฐกิจ", en: "Economy" },
    active: true,
    color: "#5d3df7",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "data-go-th",
    legendLabel: "Economy",
    zIndex: 18
  },
  {
    id: "weather",
    label: { th: "อากาศ", en: "Weather" },
    active: true,
    color: "#00a3b4",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "open-meteo-weather",
    legendLabel: "Weather",
    zIndex: 22
  },
  {
    id: "pollution",
    label: { th: "มลพิษ", en: "Pollution" },
    active: true,
    color: "#c1254a",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "open-meteo-air",
    legendLabel: "Pollution",
    zIndex: 24
  },
  {
    id: "disaster",
    label: { th: "ภัยพิบัติ", en: "Disaster" },
    active: false,
    color: "#d64200",
    kind: "signal",
    defaultViews: ["national"],
    sourceId: "gistda-disaster",
    legendLabel: "Disaster",
    zIndex: 16
  }
];

const bangkokPlaceMeta = seedMeta(
  "Bangkok Shared Places Map",
  "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.838530327896784%2C100.64165750169461&z=11",
  "live"
);

const smartCityThailandMeta = seedMeta(
  "CityData Smart City Thailand",
  "https://www.citydata.in.th/en/smart-city-thailand/",
  "live"
);

export const mapFeatureCollections: MapFeatureCollection[] = [
  {
    layerId: "smart-city-thailand",
    updatedAt: seededAt,
    bounds: [7.0, 98.2, 19.95, 104.9],
    source: smartCityThailandMeta,
    features: [
      {
        id: "smart-city-th-1",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok Metropolitan Smart City",
        description: "National capital operating zone within the Smart City Thailand network.",
        properties: { city: "Bangkok", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-2",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5144, 13.8591],
        title: "Nonthaburi",
        description: "Greater Bangkok smart service and urban-management footprint.",
        properties: { city: "Nonthaburi", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-3",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.525, 14.0208],
        title: "Pathum Thani",
        description: "Peri-urban smart growth and service-delivery zone.",
        properties: { city: "Pathum Thani", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-4",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5689, 14.3532],
        title: "Phra Nakhon Si Ayutthaya",
        description: "Historic city modernization and governance footprint.",
        properties: { city: "Ayutthaya", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-5",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.0622, 13.8199],
        title: "Nakhon Pathom",
        description: "Regional livability and public-service smart city node.",
        properties: { city: "Nakhon Pathom", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-6",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.5328, 14.0228],
        title: "Kanchanaburi",
        description: "Western corridor pilot area within the national smart city footprint.",
        properties: { city: "Kanchanaburi", region: "West" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-7",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.9311, 13.1737],
        title: "Chon Buri - Si Racha",
        description: "EEC-connected industrial and urban innovation zone.",
        properties: { city: "Si Racha", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-8",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.8825, 12.9236],
        title: "Pattaya",
        description: "Smart tourism, mobility, and public-space operating zone.",
        properties: { city: "Pattaya", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-9",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [101.2816, 12.6814],
        title: "Rayong",
        description: "Industrial and logistics smart city growth corridor.",
        properties: { city: "Rayong", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-10",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [98.9853, 18.7883],
        title: "Chiang Mai",
        description: "Livability, environment, and innovation city cluster.",
        properties: { city: "Chiang Mai", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-11",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.8406, 19.9105],
        title: "Chiang Rai",
        description: "Northern regional smart city and border-economy node.",
        properties: { city: "Chiang Rai", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-12",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.2659, 16.8211],
        title: "Phitsanulok",
        description: "Upper-central logistics and service modernization node.",
        properties: { city: "Phitsanulok", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-13",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.1231, 15.6987],
        title: "Nakhon Sawan",
        description: "Gateway city monitoring and regional integration node.",
        properties: { city: "Nakhon Sawan", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-14",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [102.8236, 16.4322],
        title: "Khon Kaen",
        description: "Flagship regional smart mobility and civic innovation city.",
        properties: { city: "Khon Kaen", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-15",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [102.7875, 17.4138],
        title: "Udon Thani",
        description: "Northeastern smart growth and service-access node.",
        properties: { city: "Udon Thani", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-16",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [102.0977, 14.9799],
        title: "Nakhon Ratchasima",
        description: "Regional transport, economy, and city services hub.",
        properties: { city: "Nakhon Ratchasima", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-17",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [104.847, 15.2447],
        title: "Ubon Ratchathani",
        description: "Eastern-Isan smart city and service modernization node.",
        properties: { city: "Ubon Ratchathani", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-18",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [98.3923, 7.8804],
        title: "Phuket",
        description: "Smart tourism and island-scale city systems pilot.",
        properties: { city: "Phuket", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-19",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.3215, 9.1382],
        title: "Surat Thani",
        description: "Southern regional smart service and logistics node.",
        properties: { city: "Surat Thani", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-20",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.4747, 7.0084],
        title: "Hat Yai / Songkhla",
        description: "Southern metro cluster within the Smart City Thailand network.",
        properties: { city: "Hat Yai", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-21",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.6534, 13.6904],
        title: "Samut Prakan",
        description: "Industrial edge-city and coastal infrastructure smart zone.",
        properties: { city: "Samut Prakan", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-22",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.6087, 13.5991],
        title: "Samut Sakhon",
        description: "Coastal production and logistics smart service footprint.",
        properties: { city: "Samut Sakhon", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-23",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.6157, 13.5475],
        title: "Samut Songkhram",
        description: "Water-edge service and resilient community pilot area.",
        properties: { city: "Samut Songkhram", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-24",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.7959, 13.3611],
        title: "Chachoengsao",
        description: "Eastern corridor smart administration and services node.",
        properties: { city: "Chachoengsao", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-25",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [101.3686, 14.0509],
        title: "Prachinburi",
        description: "Industrial transition and green-growth smart city zone.",
        properties: { city: "Prachinburi", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-26",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [102.1039, 12.6115],
        title: "Chanthaburi",
        description: "Eastern trade and agricultural logistics smart node.",
        properties: { city: "Chanthaburi", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-27",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.9925, 15.1852],
        title: "Lopburi",
        description: "Historic city and service modernization cluster.",
        properties: { city: "Lopburi", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-28",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.9159, 14.5336],
        title: "Saraburi",
        description: "Central logistics and industrial-support smart node.",
        properties: { city: "Saraburi", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-29",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [103.1035, 16.0544],
        title: "Maha Sarakham",
        description: "Education-led civic services and regional innovation node.",
        properties: { city: "Maha Sarakham", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-30",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [103.6531, 16.0514],
        title: "Roi Et",
        description: "Provincial service delivery and smart-governance footprint.",
        properties: { city: "Roi Et", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-31",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [104.1486, 17.1611],
        title: "Sakon Nakhon",
        description: "Northeastern service-access and resilient growth node.",
        properties: { city: "Sakon Nakhon", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-32",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [104.7786, 17.392],
        title: "Nakhon Phanom",
        description: "Mekong-edge connectivity and cross-border services node.",
        properties: { city: "Nakhon Phanom", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-33",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [103.101, 14.993],
        title: "Buri Ram",
        description: "Regional mobility, events, and civic management zone.",
        properties: { city: "Buri Ram", region: "Northeast" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-34",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.9631, 8.4304],
        title: "Nakhon Si Thammarat",
        description: "Southern regional governance and service-access cluster.",
        properties: { city: "Nakhon Si Thammarat", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-35",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.0818, 8.0863],
        title: "Krabi",
        description: "Tourism, mobility, and coastal resilience smart node.",
        properties: { city: "Krabi", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-36",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.6114, 7.5568],
        title: "Trang",
        description: "Southern coastal services and logistics smart footprint.",
        properties: { city: "Trang", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-37",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.025, 6.6238],
        title: "Satun",
        description: "Southern border-facing service modernization and livability node.",
        properties: { city: "Satun", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-38",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [101.2505, 6.8695],
        title: "Pattani",
        description: "Deep South civic services and resilient urban-management node.",
        properties: { city: "Pattani", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-39",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.0136, 9.512],
        title: "Koh Samui",
        description: "Island-scale tourism, utilities, and mobility smart city footprint.",
        properties: { city: "Koh Samui", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-40",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [98.45, 8.4519],
        title: "Phang Nga",
        description: "Coastal resilience and tourism-service operating zone.",
        properties: { city: "Phang Nga", region: "South" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-41",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.9059, 13.1381],
        title: "Saensuk",
        description: "Municipal smart beach-city services and public-space management node.",
        properties: { city: "Saensuk", region: "East" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-42",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5169, 13.7437],
        title: "Samyan",
        description: "Dense urban district innovation and public-realm operating node.",
        properties: { city: "Bangkok", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-43",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.523, 13.7792],
        title: "Khlong Phadung Krung Kasem",
        description: "Inner Bangkok canal corridor and civic regeneration smart zone.",
        properties: { city: "Bangkok", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-44",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.4931, 13.7526],
        title: "Rattanakosin",
        description: "Historic core conservation, mobility, and service-management zone.",
        properties: { city: "Bangkok", region: "Central" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-45",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [98.9515, 18.8054],
        title: "CMU Smart Campus",
        description: "University-led smart campus and urban experimentation node.",
        properties: { city: "Chiang Mai", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-46",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.8826, 18.2897],
        title: "Lampang / Mae Moh",
        description: "Northern energy transition and smart utility operations footprint.",
        properties: { city: "Lampang", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-47",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.7714, 19.1503],
        title: "Nan Municipality",
        description: "Provincial-scale smart living and civic services node.",
        properties: { city: "Nan", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-48",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.1333, 18.576],
        title: "Sri-Trang",
        description: "Northern regional smart community and service pilot footprint.",
        properties: { city: "Lamphun", region: "North" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-49",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [99.8218, 17.0056],
        title: "Tak",
        description: "Western-border logistics, administration, and service-access node.",
        properties: { city: "Tak", region: "West" },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-50",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [102.0283, 14.9738],
        title: "Korat",
        description: "Metropolitan-scale northeastern gateway and service transformation zone.",
        properties: { city: "Nakhon Ratchasima", region: "Northeast" },
        source: smartCityThailandMeta
      }
    ]
  },
  {
    layerId: "bangkok-passages",
    updatedAt: seededAt,
    bounds: [13.69, 100.43, 13.87, 100.74],
    source: bangkokPlaceMeta,
    features: [
      {
        id: "bangkok-place-1",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5267632, 13.7541639],
        title: "The moon massage in Bangkok",
        description: "Shared public place record imported from the Google My Maps dataset.",
        properties: {
          city: "Bangkok",
          dataset: "shared-map"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-2",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5511, 13.8012],
        title: "Bangkok Local Place Cluster",
        description: "Fallback marker used while the live My Maps source is syncing.",
        properties: {
          city: "Bangkok",
          dataset: "fallback"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-3",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.6416575, 13.8385303],
        title: "Shared Map Focus",
        description: "The default Bangkok focus derived from the shared map center.",
        properties: {
          city: "Bangkok",
          dataset: "fallback"
        },
        source: bangkokPlaceMeta
      }
    ]
  }
];

export const mediaFeeds: MediaFeedItem[] = [
  {
    id: "media-thai-pbs",
    kind: "link",
    label: "Thai PBS Live",
    region: "Thailand",
    externalUrl: "https://www.thaipbs.or.th/live",
    isEmbeddable: false,
    status: "live",
    source: seedMeta("Curated Media Feeds", "https://www.thaipbs.or.th/live")
  },
  {
    id: "media-tnn16",
    kind: "link",
    label: "TNN16 Live",
    region: "Thailand",
    externalUrl: "https://www.tnnthailand.com/live",
    isEmbeddable: false,
    status: "live",
    source: seedMeta("Curated Media Feeds", "https://www.tnnthailand.com/live")
  },
  {
    id: "media-youtube-smart-city",
    kind: "stream",
    label: "Smart City Talks",
    region: "Public",
    externalUrl: "https://www.youtube.com/results?search_query=smart+city+thailand+live",
    isEmbeddable: false,
    status: "unknown",
    source: seedMeta("Curated Media Feeds", "https://www.youtube.com")
  }
];

export const resilience: ResilienceSnapshot = {
  updatedAt: seededAt,
  weatherSummary: {
    th: "กรุงเทพฯ 31°C มีเมฆบางส่วน ลมปานกลาง",
    en: "Bangkok 31C, partly cloudy, moderate wind."
  },
  pollutionSummary: {
    th: "AQI ประเทศภาพรวม 68 | ภาคเหนือยังต้องจับตา",
    en: "National AQI snapshot 68 | North remains under watch."
  },
  warnings: [
    { th: "เฝ้าระวังฝนสะสมเขตลุ่มต่ำ", en: "Watch low-lying areas for cumulative rainfall." },
    { th: "เชียงใหม่ควรสื่อสาร PM2.5 แบบรายวัน", en: "Chiang Mai should continue daily PM2.5 advisories." }
  ],
  weatherTemperatureC: 31,
  aqi: 68,
  source: seedMeta("Open-Meteo", "https://open-meteo.com/en/docs", "live")
};

export const briefing: BriefingNote = {
  id: "briefing-1",
  headline: {
    th: "สถานะวันนี้: ความคืบหน้าเดินหน้า แต่ความยืดหยุ่นและอากาศยังต้องเฝ้าระวัง",
    en: "Today: Progress is moving, but resilience and air quality still require attention."
  },
  body: {
    th: "เมืองหลักยังเดินหน้าในด้านธรรมาภิบาลและบริการดิจิทัล ขณะที่ประเด็นคุณภาพอากาศและน้ำยังเป็นตัวแปรที่ต้องติดตามใกล้ชิด",
    en: "Core cities are advancing in governance and service delivery, while air quality and water response remain the main watchpoints."
  },
  updatedAt: seededAt,
  source: seedMeta("Smart City Thailand Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
};

export const overviewMetrics = [
  {
    id: "active-projects",
    label: { th: "โครงการที่กำลังเดินหน้า", en: "Active Programs" },
    value: 42,
    displayValue: "42",
    trend: "up" as const,
    deltaText: { th: "+6 จากเดือนก่อน", en: "+6 vs last month" },
    tone: "positive" as const,
    meta: seedMeta("Smart City Thailand Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
  },
  {
    id: "cities-tracked",
    label: { th: "เมืองที่ติดตาม", en: "Cities Tracked" },
    value: 26,
    displayValue: "26",
    trend: "steady" as const,
    deltaText: { th: "คงที่", en: "Stable" },
    tone: "neutral" as const,
    meta: seedMeta("CityData Thailand", "https://www.citydata.in.th", "live")
  },
  {
    id: "resilience-watch",
    label: { th: "สัญญาณเฝ้าระวัง", en: "Watch Signals" },
    value: 3,
    displayValue: "03",
    trend: "down" as const,
    deltaText: { th: "ลดลง 1 จุด", en: "Down 1 from prior period" },
    tone: "warning" as const,
    meta: seedMeta("Open-Meteo", "https://open-meteo.com/en/docs", "live")
  },
  {
    id: "data-sources",
    label: { th: "แหล่งข้อมูลพร้อมใช้งาน", en: "Healthy Sources" },
    value: 11,
    displayValue: "11",
    trend: "up" as const,
    deltaText: { th: "เพิ่มขึ้น 5", en: "+5 integrated sources" },
    tone: "positive" as const,
    meta: seedMeta("Source Registry", "https://www.citydata.in.th")
  }
];

export function createOverviewSnapshot(options?: {
  view?: DashboardView;
  timeRange?: TimeRange;
  city?: string;
  domain?: string;
  layers?: string[];
}): OverviewSnapshot {
  return {
    updatedAt: new Date().toISOString(),
    view: options?.view ?? "national",
    timeRange: options?.timeRange ?? "7d",
    selectedCity: options?.city,
    selectedDomain: options?.domain,
    activeLayers: options?.layers ?? mapLayers.filter((layer) => layer.active).map((layer) => layer.id),
    metrics: overviewMetrics.map((metric) => ({ ...metric, meta: { ...metric.meta, fetchedAt: new Date().toISOString() } })),
    briefing: { ...briefing, updatedAt: new Date().toISOString() },
    cities: cloneSeed(cities),
    domains: cloneSeed(domains),
    sources: cloneSeed(sources)
  };
}

export function createTimeSnapshot(): TimeSnapshot {
  const now = new Date();
  const format = (timeZone: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
      hour12: false
    }).format(now);

  const bangkokParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok"
  }).formatToParts(now);

  const bangkokValue = (type: string) =>
    bangkokParts.find((part) => part.type === type)?.value ?? "00";

  return {
    updatedAt: now.toISOString(),
    utcIso: now.toISOString(),
    bangkokIso: `${bangkokValue("year")}-${bangkokValue("month")}-${bangkokValue("day")}T${bangkokValue("hour")}:${bangkokValue("minute")}:${bangkokValue("second")}+07:00`,
    zones: [
      { label: "Bangkok", timeZone: "Asia/Bangkok", localTime: format("Asia/Bangkok") },
      { label: "UTC", timeZone: "UTC", localTime: format("UTC") },
      { label: "Tokyo", timeZone: "Asia/Tokyo", localTime: format("Asia/Tokyo") },
      { label: "London", timeZone: "Europe/London", localTime: format("Europe/London") }
    ]
  };
}

export function localize(locale: Locale, value: { th: string; en: string }): string {
  return value[locale];
}

export function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
