import type {
  ActivityLogItem,
  BriefingNote,
  CityProfile,
  ChangePulse,
  DashboardView,
  DomainScorecard,
  GeoFeatureRecord,
  Locale,
  MapLayerConfig,
  MapFeatureCollection,
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
    id: "city-mtt",
    slug: "muang-thong-thani",
    name: { th: "เมืองทองธานี", en: "Muang Thong Thani" },
    region: { th: "นนทบุรี", en: "Nonthaburi" },
    population: 80000,
    focus: {
      th: "ศูนย์ประชุม IMPACT นิคมที่อยู่อาศัย และโครงสร้างพื้นฐานเมืองอัจฉริยะ",
      en: "IMPACT convention hub, mixed-use residential, and smart city infrastructure."
    },
    scores: [
      { domainSlug: "economy", score: 82 },
      { domainSlug: "mobility", score: 76 },
      { domainSlug: "environment", score: 74 },
      { domainSlug: "energy", score: 71 },
      { domainSlug: "living", score: 79 }
    ]
  },
  {
    id: "city-nonthaburi",
    slug: "nonthaburi",
    name: { th: "จังหวัดนนทบุรี", en: "Nonthaburi" },
    region: { th: "ภาคกลาง", en: "Central" },
    population: 1300000,
    focus: {
      th: "เมืองบริวารกรุงเทพ การขนส่ง และเขตที่อยู่อาศัยชั้นนำ",
      en: "Bangkok satellite city, transit-oriented development, and residential services."
    },
    scores: [
      { domainSlug: "mobility", score: 78 },
      { domainSlug: "governance", score: 74 },
      { domainSlug: "living", score: 75 }
    ]
  },
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
    id: "city-pakred",
    slug: "pak-kret",
    name: { th: "อำเภอปากเกร็ด", en: "Pak Kret" },
    region: { th: "นนทบุรี", en: "Nonthaburi" },
    population: 210000,
    focus: {
      th: "ชุมชนริมน้ำ พื้นที่อยู่อาศัย และบริการเมืองระดับอำเภอ",
      en: "Riverfront community, residential zones, and district-level smart services."
    },
    scores: [
      { domainSlug: "environment", score: 72 },
      { domainSlug: "living", score: 76 },
      { domainSlug: "mobility", score: 70 }
    ]
  },
  {
    id: "city-pathumthani",
    slug: "pathumthani",
    name: { th: "ปทุมธานี", en: "Pathumthani" },
    region: { th: "ภาคกลาง", en: "Central" },
    population: 1200000,
    focus: {
      th: "เขตอุตสาหกรรม มหาวิทยาลัย และนิคมที่อยู่อาศัยทางเหนือของกรุงเทพ",
      en: "Industrial estates, universities, and northern Bangkok residential corridor."
    },
    scores: [
      { domainSlug: "economy", score: 75 },
      { domainSlug: "people", score: 73 },
      { domainSlug: "mobility", score: 71 }
    ]
  }
];

export const projects: ProjectRecord[] = [
  {
    id: "project-mtt-1",
    slug: "mtt-smart-environment-sensor",
    title: { th: "ระบบเซนเซอร์สิ่งแวดล้อมเมืองทองธานี", en: "MTT Smart Environment Sensor Grid" },
    citySlug: "muang-thong-thani",
    domainSlug: "environment",
    status: "active",
    completionPercent: 74,
    owner: { th: "depa / SLIC", en: "depa / SLIC" },
    summary: {
      th: "ติดตั้งเซนเซอร์ PM2.5 อุณหภูมิ ความชื้น และเสียง ทั่วพื้นที่เมืองทองธานี",
      en: "Deploys PM2.5, temperature, humidity, and noise sensors across the MTT estate."
    },
    nextMilestone: {
      th: "ขยายครอบคลุม 30 จุดในไตรมาสหน้า",
      en: "Expand to 30 sensor nodes next quarter."
    },
    updatedAt: seededAt,
    source: seedMeta("depa Smart City Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
  },
  {
    id: "project-mtt-2",
    slug: "mtt-impact-mobility",
    title: { th: "ระบบขนส่งอัจฉริยะ IMPACT", en: "IMPACT Smart Mobility & EV Loop" },
    citySlug: "muang-thong-thani",
    domainSlug: "mobility",
    status: "active",
    completionPercent: 61,
    owner: { th: "IMPACT Exhibition Center / เทศบาลนนทบุรี", en: "IMPACT Exhibition Center / Nonthaburi Municipality" },
    summary: {
      th: "เชื่อม EV shuttle รถสาธารณะ และสัญญาณจราจรในพื้นที่ IMPACT และเมืองทองธานี",
      en: "Connects EV shuttles, public transit, and traffic signals around IMPACT and MTT."
    },
    nextMilestone: {
      th: "ทดสอบ EV loop เชื่อม MRT สายสีม่วง ในไตรมาสหน้า",
      en: "Pilot EV loop connecting MRT Purple Line stations next quarter."
    },
    updatedAt: seededAt,
    source: seedMeta("IMPACT Exhibition Center", "https://www.impact.co.th")
  },
  {
    id: "project-mtt-3",
    slug: "mtt-slic-innovation-hub",
    title: { th: "SLIC นวัตกรรมเมืองทองธานี", en: "SLIC Smart Innovation Hub" },
    citySlug: "muang-thong-thani",
    domainSlug: "economy",
    status: "active",
    completionPercent: 85,
    owner: { th: "SLIC / depa", en: "SLIC / depa" },
    summary: {
      th: "พื้นที่ทดลองนวัตกรรมเมืองอัจฉริยะ รวม co-working พื้นที่ sandbox และหน่วยงานพันธมิตร",
      en: "Smart city innovation sandbox combining co-working, prototyping, and partner agencies in MTT."
    },
    nextMilestone: {
      th: "เปิดตัว cohort startup ที่ 3 และ open data layer",
      en: "Launch Cohort 3 startups and public open-data layer."
    },
    updatedAt: seededAt,
    source: seedMeta("SLIC", "https://www.depa.or.th")
  },
  {
    id: "project-mtt-4",
    slug: "mtt-energy-grid",
    title: { th: "กริดพลังงานอัจฉริยะเมืองทองธานี", en: "MTT Smart Energy Microgrid" },
    citySlug: "muang-thong-thani",
    domainSlug: "energy",
    status: "watch",
    completionPercent: 47,
    owner: { th: "EGAT / ผู้ประกอบการเอกชน", en: "EGAT / private operator" },
    summary: {
      th: "ติดตั้ง Solar + Battery และระบบตรวจสอบการใช้พลังงานแบบ real-time ในอาคาร IMPACT",
      en: "Installs solar + battery storage with real-time energy monitoring across IMPACT halls."
    },
    nextMilestone: {
      th: "ทดสอบ Peak shaving ในอาคาร Hall 9–12",
      en: "Pilot peak-shaving in Exhibition Halls 9–12."
    },
    updatedAt: seededAt,
    source: seedMeta("EGAT Smart Grid", "https://www.egat.co.th")
  },
  {
    id: "project-mtt-5",
    slug: "mtt-citydata-platform",
    title: { th: "แพลตฟอร์มข้อมูลเมืองนนทบุรี", en: "Nonthaburi City Data Platform" },
    citySlug: "nonthaburi",
    domainSlug: "governance",
    status: "active",
    completionPercent: 68,
    owner: { th: "depa / เทศบาลนนทบุรี", en: "depa / Nonthaburi Municipality" },
    summary: {
      th: "รวมข้อมูลสาธารณะของจังหวัดนนทบุรีในรูป open API บน CityData platform",
      en: "Consolidates Nonthaburi public datasets as open APIs on the national CityData platform."
    },
    nextMilestone: {
      th: "เพิ่มชุดข้อมูลสุขภาพและสิ่งแวดล้อม 15 ชุด",
      en: "Add 15 health and environment dataset packages."
    },
    updatedAt: seededAt,
    source: seedMeta("CityData Thailand", "https://www.citydata.in.th")
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
    id: "gdelt-signals",
    name: "GDELT Signals",
    category: "news",
    url: "https://api.gdeltproject.org/api/v2/doc/doc",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Global media monitoring can add volume, source spread, and tone signals."
  },
  {
    id: "talkwalker-alerts",
    name: "Talkwalker Alerts",
    category: "news",
    url: "https://www.talkwalker.com/alerts",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Optional RSS-based web mention alerts for lightweight social listening."
  },
  {
    id: "bangkok-passages",
    name: "MTT / North Bangkok Detail Map",
    category: "geospatial",
    url: "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.838530327896784%2C100.64165750169461&z=11",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Curated local places around Muang Thong Thani, Pak Kret, Lak Si, and north Bangkok."
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
    id: "youtube-signals",
    name: "YouTube Signals",
    category: "news",
    url: "https://developers.google.com/youtube/v3",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Optional video and livestream monitoring for public-facing proof of activity."
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
    id: "openaq",
    name: "OpenAQ",
    category: "environment",
    url: "https://api.openaq.org",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Optional station-level air-quality network feed when an API key is configured."
  },
  {
    id: "jaxa-earth",
    name: "JAXA Earth API",
    category: "geospatial",
    url: "https://data.earth.jaxa.jp/en/",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Browser-side and Python Earth observation APIs for rainfall, land temperature, and other satellite layers."
  },
  {
    id: "nasa-gibs",
    name: "NASA GIBS WMTS",
    category: "geospatial",
    url: "https://gibs.earthdata.nasa.gov",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Raster overlay tiles for aerosol, precipitation, vegetation, and optical Earth observation."
  },
  {
    id: "mtt-geography",
    name: "MTT Geography Detail",
    category: "geospatial",
    url: "https://www.openstreetmap.org/#map=13/13.9118/100.5512",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Curated local geography for Muang Thong Thani, Chaeng Watthana, Lak Si, and Pak Kret."
  },
  {
    id: "itic-traffic",
    name: "iTIC Traffic / Longdo",
    category: "geospatial",
    url: "https://iticfoundation.org/en/open-data-sharing/",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Thai intelligent traffic open-data archives and developer-contact path for location tables, traffic history, and probe-data access."
  },
  {
    id: "undp-data",
    name: "UNDP Data Hub",
    category: "catalog",
    url: "https://data.undp.org/access-all-data",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Public development datasets, tiles, and dataset API URLs can be mapped into planning layers."
  },
  {
    id: "data-to-policy",
    name: "Data to Policy",
    category: "catalog",
    url: "https://www.datatopolicy.org",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Policy playbooks and use-case templates help turn static map layers into operational workflows."
  },
  {
    id: "esa-eodashboard",
    name: "ESA EO Dashboard Catalog",
    category: "geospatial",
    url: "https://github.com/ESA-eodashboards/eodashboard-catalog/tree/main/collections",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Static EO collections can seed agriculture, land-cover, and atmospheric overlays."
  },
  {
    id: "market-context",
    name: "Market Context",
    category: "finance",
    url: "https://api.coingecko.com",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Free macro context signals for BTC, gold, and USD/THB."
  },
  {
    id: "nasa-eonet",
    name: "NASA EONET",
    category: "geospatial",
    url: "https://eonet.gsfc.nasa.gov/api/v3/events",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Global natural-event monitoring can enrich the resilience layer."
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
    active: false,
    color: "#ff5b57",
    kind: "dataset",
    defaultViews: ["national"],
    sourceId: "citydata",
    legendLabel: "Coverage",
    zIndex: 42
  },
  {
    id: "bangkok-passages",
    label: { th: "MTT / กรุงเทพเหนือ", en: "MTT / North Bangkok" },
    active: true,
    color: "#22c55e",
    kind: "dataset",
    defaultViews: ["bangkok"],
    sourceId: "bangkok-passages",
    legendLabel: "Places",
    zIndex: 40
  },
  {
    id: "geography-detail",
    label: { th: "ภูมิศาสตร์พื้นที่", en: "Local Geography" },
    active: true,
    color: "#1d4ed8",
    kind: "dataset",
    defaultViews: ["bangkok", "national"],
    sourceId: "mtt-geography",
    legendLabel: "Geography",
    zIndex: 39
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
    active: false,
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
    active: false,
    color: "#5d3df7",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "data-go-th",
    legendLabel: "Economy",
    zIndex: 18
  },
  {
    id: "agriculture",
    label: { th: "เกษตร", en: "Agriculture" },
    active: false,
    color: "#7aa61b",
    kind: "dataset",
    defaultViews: ["national"],
    sourceId: "esa-eodashboard",
    legendLabel: "Agriculture",
    zIndex: 17
  },
  {
    id: "itic-traffic",
    label: { th: "รายงานจราจร (iTIC)", en: "Traffic (iTIC)" },
    active: false,
    color: "#ef4444",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "itic-traffic",
    legendLabel: "Traffic",
    zIndex: 45
  },
  {
    id: "water",
    label: { th: "น้ำ", en: "Water" },
    active: false,
    color: "#1479c9",
    kind: "dataset",
    defaultViews: ["national"],
    sourceId: "jaxa-earth",
    legendLabel: "Water",
    zIndex: 19
  },
  {
    id: "land-use",
    label: { th: "การใช้ที่ดิน", en: "Land Use" },
    active: false,
    color: "#6b7280",
    kind: "dataset",
    defaultViews: ["national"],
    sourceId: "undp-data",
    legendLabel: "Land Use",
    zIndex: 15
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
    id: "eo-vegetation",
    label: { th: "พืชพรรณ (NDVI)", en: "Vegetation (NDVI)" },
    active: false,
    color: "#65a30d",
    kind: "external",
    defaultViews: ["bangkok", "national"],
    sourceId: "nasa-gibs",
    legendLabel: "Vegetation",
    zIndex: 23
  },
  {
    id: "eo-precipitation",
    label: { th: "ฝนดาวเทียม", en: "Precipitation" },
    active: false,
    color: "#2563eb",
    kind: "external",
    defaultViews: ["bangkok", "national"],
    sourceId: "nasa-gibs",
    legendLabel: "Precipitation",
    zIndex: 24
  },
  {
    id: "jaxa-rainfall",
    label: { th: "EO Rain", en: "EO Rain" },
    active: false,
    color: "#0f8cff",
    kind: "external",
    defaultViews: ["national"],
    sourceId: "jaxa-earth",
    legendLabel: "JAXA Rainfall",
    zIndex: 14
  },
  {
    id: "pollution",
    label: { th: "AQI / PM2.5", en: "AQI / PM2.5" },
    active: true,
    color: "#c1254a",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "open-meteo-air",
    legendLabel: "Pollution",
    zIndex: 24
  },
  {
    id: "eo-aerosol",
    label: { th: "ละอองลอย", en: "Aerosol" },
    active: false,
    color: "#9333ea",
    kind: "external",
    defaultViews: ["bangkok", "national"],
    sourceId: "nasa-gibs",
    legendLabel: "Aerosol",
    zIndex: 25
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
  "MTT / North Bangkok Detail Map",
  "https://www.openstreetmap.org/#map=13/13.9118/100.5512",
  "live"
);

const mttGeographyMeta = seedMeta(
  "Muang Thong / North Bangkok Geography",
  "https://www.openstreetmap.org/#map=13/13.9118/100.5512",
  "live"
);

const smartCityThailandMeta = seedMeta(
  "CityData Smart City Thailand",
  "https://www.citydata.in.th/en/smart-city-thailand/",
  "live"
);

const undpDataMeta = seedMeta("UNDP Data Hub", "https://data.undp.org/access-all-data");
const dataToPolicyMeta = seedMeta("Data to Policy", "https://www.datatopolicy.org");
const esaEodashboardMeta = seedMeta(
  "ESA EO Dashboard Catalog",
  "https://github.com/ESA-eodashboards/eodashboard-catalog/tree/main/collections"
);
const gdeltSignalsMeta = seedMeta("GDELT Signals", "https://api.gdeltproject.org/api/v2/doc/doc", "live");
const jaxaEarthMeta = seedMeta("JAXA Earth API", "https://data.earth.jaxa.jp/en/");
const gistdaDisasterMeta = seedMeta(
  "GISTDA Disaster API",
  "https://disaster.gistda.or.th/services/open-api"
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
        properties: {
          city: "Bangkok",
          region: "Central",
          population: 10539000,
          smartFocus: "Flood response, mobility, and city-scale digital services."
        },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-mtt",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5512, 13.9118],
        title: "เมืองทองธานี — Muang Thong Thani Smart City",
        description: "MTT flagship smart city zone: IMPACT hub, SLIC innovation, MRT Purple Line corridor, and sensor grid.",
        properties: {
          city: "Muang Thong Thani",
          region: "Nonthaburi",
          population: 80000,
          smartFocus: "IMPACT events hub, SLIC innovation, EV mobility, smart energy, and environmental sensors."
        },
        source: smartCityThailandMeta
      },
      {
        id: "smart-city-th-2",
        layerId: "smart-city-thailand",
        geometryType: "Point",
        coordinates: [100.5144, 13.8591],
        title: "Nonthaburi",
        description: "Greater Bangkok smart service and urban-management footprint — host province of Muang Thong Thani.",
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
    ]
  },
  {
    layerId: "bangkok-passages",
    updatedAt: seededAt,
    bounds: [13.875, 100.495, 13.922, 100.607],
    source: bangkokPlaceMeta,
    features: [
      {
        id: "bangkok-place-1",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5478, 13.9126],
        title: "IMPACT Challenger Hall",
        description: "Primary exhibition and event anchor inside Muang Thong Thani.",
        properties: {
          city: "Muang Thong Thani",
          district: "Pak Kret",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-2",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5554, 13.9146],
        title: "Lakeside / Muang Thong Core",
        description: "Residential and mixed-use center around the internal lake district.",
        properties: {
          city: "Muang Thong Thani",
          district: "Pak Kret",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-3",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5471, 13.9079],
        title: "Cosmo Bazaar / Arena Edge",
        description: "Retail and event spillover zone serving IMPACT footfall.",
        properties: {
          city: "Muang Thong Thani",
          district: "Pak Kret",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-4",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5719, 13.8993],
        title: "Chaeng Watthana Gateway",
        description: "Primary road access and interchange edge for the north-Bangkok corridor.",
        properties: {
          city: "Chaeng Watthana",
          district: "North Bangkok",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-5",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5648, 13.8789],
        title: "Government Complex Interface",
        description: "Administrative cluster linking Chaeng Watthana demand with the MTT corridor.",
        properties: {
          city: "Lak Si",
          district: "North Bangkok",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-6",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5846, 13.8872],
        title: "Lak Si Transit Link",
        description: "North-Bangkok transfer edge for road, rail, and district services.",
        properties: {
          city: "Lak Si",
          district: "North Bangkok",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-7",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.6039, 13.9146],
        title: "Don Mueang Access Gate",
        description: "Airport-facing mobility node connecting Muang Thong Thani to the regional gateway.",
        properties: {
          city: "Don Mueang",
          district: "North Bangkok",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-8",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5006, 13.9111],
        title: "Pak Kret Riverfront Link",
        description: "Chao Phraya-side community and service edge west of the estate.",
        properties: {
          city: "Pak Kret",
          district: "Nonthaburi",
          dataset: "local-curated"
        },
        source: bangkokPlaceMeta
      }
    ]
  },
  {
    layerId: "geography-detail",
    updatedAt: seededAt,
    bounds: [13.872, 100.498, 13.932, 100.611],
    source: mttGeographyMeta,
    features: [
      {
        id: "geo-mtt-estate",
        layerId: "geography-detail",
        geometryType: "Polygon",
        coordinates: [
          [100.532, 13.892],
          [100.577, 13.892],
          [100.577, 13.928],
          [100.532, 13.928]
        ],
        title: "Muang Thong Thani Estate",
        description: "Primary estate footprint used as the local dashboard frame.",
        properties: {
          category: "district",
          area: "Muang Thong Thani"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-impact-campus",
        layerId: "geography-detail",
        geometryType: "Polygon",
        coordinates: [
          [100.542, 13.903],
          [100.558, 13.903],
          [100.559, 13.918],
          [100.543, 13.919]
        ],
        title: "IMPACT Campus",
        description: "Convention, arena, and exhibition campus inside the estate core.",
        properties: {
          category: "campus",
          area: "IMPACT"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-chaeng-watthana-corridor",
        layerId: "geography-detail",
        geometryType: "LineString",
        coordinates: [
          [100.505, 13.905],
          [100.533, 13.904],
          [100.562, 13.902],
          [100.607, 13.898]
        ],
        title: "Chaeng Watthana Corridor",
        description: "Main east-west movement corridor serving MTT, Lak Si, and the government complex.",
        properties: {
          category: "mobility",
          type: "arterial"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-si-rat-approach",
        layerId: "geography-detail",
        geometryType: "LineString",
        coordinates: [
          [100.516, 13.92],
          [100.544, 13.918],
          [100.569, 13.915],
          [100.595, 13.912]
        ],
        title: "Si Rat Expressway Approach",
        description: "Regional expressway access feeding the estate, event halls, and airport edge.",
        properties: {
          category: "mobility",
          type: "expressway"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-khlong-prapa",
        layerId: "geography-detail",
        geometryType: "LineString",
        coordinates: [
          [100.503, 13.879],
          [100.515, 13.891],
          [100.528, 13.903],
          [100.543, 13.922]
        ],
        title: "Khlong Prapa Edge",
        description: "Water infrastructure line relevant to drainage, ecology, and settlement boundaries.",
        properties: {
          category: "water-edge",
          type: "canal"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-slic-hub",
        layerId: "geography-detail",
        geometryType: "Point",
        coordinates: [100.5518, 13.9103],
        title: "SLIC Innovation Hub",
        description: "Innovation, prototyping, and smart-city program anchor inside Muang Thong Thani.",
        properties: {
          category: "innovation",
          type: "hub"
        },
        source: mttGeographyMeta
      },
      {
        id: "geo-pink-line-interface",
        layerId: "geography-detail",
        geometryType: "Point",
        coordinates: [100.5712, 13.9017],
        title: "Pink Line / Sri Rat Interface",
        description: "Transit interchange edge shaping event access and north-Bangkok distribution.",
        properties: {
          category: "transit",
          type: "station-interface"
        },
        source: mttGeographyMeta
      }
    ]
  },
  {
    layerId: "projects",
    updatedAt: seededAt,
    bounds: [7.2, 98.3, 18.9, 103.9],
    source: dataToPolicyMeta,
    features: [
      {
        id: "projects-bkk-service-grid",
        layerId: "projects",
        geometryType: "Polygon",
        coordinates: [
          [100.43, 13.67],
          [100.62, 13.67],
          [100.62, 13.86],
          [100.43, 13.86]
        ],
        title: "Bangkok service digitization grid",
        description: "Dense public-service modernization footprint for integrated city services.",
        properties: {
          city: "Bangkok",
          status: "active",
          priority: "service-delivery"
        },
        source: dataToPolicyMeta
      },
      {
        id: "projects-eec-agrologistics",
        layerId: "projects",
        geometryType: "LineString",
        coordinates: [
          [100.92, 13.22],
          [101.18, 13.08],
          [101.55, 12.89],
          [101.88, 12.74]
        ],
        title: "Eastern agri-logistics modernization corridor",
        description: "Ports, cold-chain nodes, and industrial estates aligned as one delivery corridor.",
        properties: {
          region: "East",
          status: "watch",
          focus: "logistics"
        },
        source: undpDataMeta
      },
      {
        id: "projects-khonkaen-food-hub",
        layerId: "projects",
        geometryType: "Polygon",
        coordinates: [
          [102.63, 16.24],
          [102.97, 16.24],
          [102.97, 16.54],
          [102.63, 16.54]
        ],
        title: "Khon Kaen agri-data service zone",
        description: "Regional food systems and civic logistics pilot footprint.",
        properties: {
          city: "Khon Kaen",
          status: "active",
          focus: "agri-services"
        },
        source: dataToPolicyMeta
      },
    ]
  },
  {
    layerId: "news",
    updatedAt: seededAt,
    bounds: [7.2, 98.3, 18.9, 104.2],
    source: gdeltSignalsMeta,
    features: [
      {
        id: "news-bangkok-cluster",
        layerId: "news",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok media concentration",
        description: "National policy, transport, and flood-management coverage remains concentrated here.",
        properties: {
          city: "Bangkok",
          mentions: 18,
          theme: "governance"
        },
        source: gdeltSignalsMeta
      },
      {
        id: "news-eastern-freight",
        layerId: "news",
        geometryType: "Point",
        coordinates: [101.2816, 12.6814],
        title: "Eastern logistics signal",
        description: "Trade and logistics headlines cluster along the eastern corridor.",
        properties: {
          city: "Rayong",
          mentions: 9,
          theme: "economy"
        },
        source: gdeltSignalsMeta
      },
      {
        id: "news-mekong-border",
        layerId: "news",
        geometryType: "Point",
        coordinates: [104.7786, 17.392],
        title: "Mekong border growth signal",
        description: "Cross-border services and trade modernization references continue to rise.",
        properties: {
          city: "Nakhon Phanom",
          mentions: 6,
          theme: "mobility"
        },
        source: gdeltSignalsMeta
      }
    ]
  },
  {
    layerId: "resilience",
    updatedAt: seededAt,
    bounds: [6.8, 98.0, 19.2, 104.6],
    source: jaxaEarthMeta,
    features: [
      {
        id: "resilience-chao-phraya",
        layerId: "resilience",
        geometryType: "Polygon",
        coordinates: [
          [99.75, 13.35],
          [100.85, 13.35],
          [100.95, 14.75],
          [100.05, 14.95],
          [99.7, 14.1]
        ],
        title: "Lower Chao Phraya flood-response basin",
        description: "Rainfall, drainage, and low-lying settlements intersect in this watch zone.",
        properties: {
          risk: "flood",
          sourceLayer: "rainfall"
        },
        source: jaxaEarthMeta
      },
      {
        id: "resilience-northern-haze",
        layerId: "resilience",
        geometryType: "Polygon",
        coordinates: [
          [98.45, 18.05],
          [99.45, 18.05],
          [99.65, 19.35],
          [98.65, 19.45]
        ],
        title: "Northern haze and watershed watch",
        description: "Dry-season smoke, forests, and mountain watershed pressure overlap here.",
        properties: {
          risk: "air-and-fire",
          sourceLayer: "atmosphere"
        },
        source: esaEodashboardMeta
      },
      {
        id: "resilience-isan-heat-band",
        layerId: "resilience",
        geometryType: "LineString",
        coordinates: [
          [101.7, 17.2],
          [102.6, 16.5],
          [103.7, 15.8],
          [104.6, 15.1]
        ],
        title: "Isan seasonal heat-stress band",
        description: "Dryland agriculture and heat exposure escalate along this regional belt.",
        properties: {
          risk: "drought",
          sourceLayer: "heat"
        },
        source: jaxaEarthMeta
      }
    ]
  },
  {
    layerId: "economy",
    updatedAt: seededAt,
    bounds: [7.0, 98.1, 19.0, 104.7],
    source: undpDataMeta,
    features: [
      {
        id: "economy-central-rice-basin",
        layerId: "economy",
        geometryType: "Polygon",
        coordinates: [
          [99.55, 13.35],
          [100.85, 13.35],
          [100.95, 14.85],
          [99.95, 15.05],
          [99.45, 14.1]
        ],
        title: "Central agricultural production basin",
        description: "Rice, irrigation, and food logistics density make this a high-value planning layer.",
        properties: {
          focus: "agriculture",
          crop: "rice",
          sourceCollection: "development-data"
        },
        source: undpDataMeta
      },
      {
        id: "economy-isan-food-belt",
        layerId: "economy",
        geometryType: "Polygon",
        coordinates: [
          [101.85, 15.35],
          [103.95, 15.35],
          [104.15, 17.15],
          [102.15, 17.45]
        ],
        title: "Isan food and field-crop belt",
        description: "Broad crop belt suited for agriculture and drought-planning overlays.",
        properties: {
          focus: "agriculture",
          crop: "mixed",
          sourceCollection: "rice-planting"
        },
        source: esaEodashboardMeta
      },
      {
        id: "economy-eastern-corridor",
        layerId: "economy",
        geometryType: "LineString",
        coordinates: [
          [100.88, 13.45],
          [101.18, 13.2],
          [101.55, 12.98],
          [101.85, 12.72]
        ],
        title: "Eastern production and export corridor",
        description: "Industrial estates, agro-logistics, and port access create a strong economic spine.",
        properties: {
          focus: "logistics",
          sourceCollection: "corridor"
        },
        source: undpDataMeta
      },
      {
        id: "economy-southern-tourism-food",
        layerId: "economy",
        geometryType: "Polygon",
        coordinates: [
          [98.15, 7.4],
          [99.7, 7.4],
          [100.15, 9.4],
          [98.55, 9.6]
        ],
        title: "Southern tourism and coastal food system zone",
        description: "Tourism services, fisheries, and coastal food logistics overlap across the south.",
        properties: {
          focus: "coastal-economy",
          sourceCollection: "coastal"
        },
        source: undpDataMeta
      }
    ]
  },
  {
    layerId: "agriculture",
    updatedAt: seededAt,
    bounds: [7.1, 98.2, 18.8, 104.5],
    source: esaEodashboardMeta,
    features: [
      {
        id: "agriculture-central-rice-plain",
        layerId: "agriculture",
        geometryType: "Polygon",
        coordinates: [
          [99.6, 13.4],
          [100.9, 13.4],
          [101.0, 14.9],
          [100.0, 15.15],
          [99.5, 14.2]
        ],
        title: "Central rice plain",
        description: "Large irrigated rice area suited for food-security and water-management tracking.",
        properties: {
          crop: "rice",
          intensity: "high",
          sourceCollection: "development-data"
        },
        source: undpDataMeta
      },
      {
        id: "agriculture-isan-planting-zone",
        layerId: "agriculture",
        geometryType: "Polygon",
        coordinates: [
          [101.8, 15.4],
          [104.0, 15.4],
          [104.2, 17.2],
          [102.1, 17.45]
        ],
        title: "Isan rice planting zone",
        description: "Broad seasonal field-crop area inspired by EO rice-planting collections.",
        properties: {
          crop: "rice",
          intensity: "seasonal",
          sourceCollection: "rice-planting"
        },
        source: esaEodashboardMeta
      },
      {
        id: "agriculture-eastern-fruit-belt",
        layerId: "agriculture",
        geometryType: "Polygon",
        coordinates: [
          [101.0, 12.45],
          [102.4, 12.45],
          [102.55, 13.35],
          [101.2, 13.55]
        ],
        title: "Eastern fruit belt",
        description: "Orchard-heavy zone aligned with export packaging and cold-chain operations.",
        properties: {
          crop: "fruit",
          intensity: "export",
          sourceCollection: "horticulture"
        },
        source: undpDataMeta
      },
      {
        id: "agriculture-southern-rubber-belt",
        layerId: "agriculture",
        geometryType: "LineString",
        coordinates: [
          [99.1, 9.4],
          [99.5, 8.8],
          [99.9, 8.1],
          [100.2, 7.4],
          [100.45, 6.9]
        ],
        title: "Southern rubber and palm belt",
        description: "Long production band for plantation monitoring and transport planning.",
        properties: {
          crop: "rubber-and-palm",
          intensity: "regional"
        },
        source: undpDataMeta
      },
    ]
  },
  {
    layerId: "water",
    updatedAt: seededAt,
    bounds: [6.8, 98.0, 20.0, 105.0],
    source: jaxaEarthMeta,
    features: [
      {
        id: "water-chao-phraya-mainstem",
        layerId: "water",
        geometryType: "LineString",
        coordinates: [
          [100.45, 14.55],
          [100.52, 14.1],
          [100.55, 13.75],
          [100.56, 13.45]
        ],
        title: "Chao Phraya mainstem",
        description: "Primary central river spine for runoff, freight, and floodplain monitoring.",
        properties: {
          basin: "Chao Phraya",
          type: "river"
        },
        source: jaxaEarthMeta
      },
      {
        id: "water-mekong-edge",
        layerId: "water",
        geometryType: "LineString",
        coordinates: [
          [104.25, 18.2],
          [104.65, 17.8],
          [104.8, 17.35],
          [105.0, 16.85],
          [105.05, 15.4]
        ],
        title: "Mekong edge",
        description: "Cross-border river edge used for basin and seasonal-flow context.",
        properties: {
          basin: "Mekong",
          type: "river"
        },
        source: jaxaEarthMeta
      },
      {
        id: "water-lower-gulf-estuary",
        layerId: "water",
        geometryType: "Polygon",
        coordinates: [
          [99.9, 13.0],
          [100.9, 13.0],
          [101.15, 13.85],
          [100.15, 14.0]
        ],
        title: "Lower gulf estuary watch",
        description: "Estuary and coastal outflow zone relevant to salinity and stormwater response.",
        properties: {
          basin: "Gulf estuary",
          type: "estuary"
        },
        source: jaxaEarthMeta
      },
      {
        id: "water-bangkok-canal-grid",
        layerId: "water",
        geometryType: "Polygon",
        coordinates: [
          [100.39, 13.67],
          [100.63, 13.67],
          [100.63, 13.87],
          [100.39, 13.87]
        ],
        title: "Bangkok canal grid",
        description: "Urban drainage and canal-management footprint for the capital core.",
        properties: {
          basin: "Bangkok canals",
          type: "urban-drainage"
        },
        source: dataToPolicyMeta
      },
      {
        id: "water-sirikit-reservoir",
        layerId: "water",
        geometryType: "Point",
        coordinates: [100.372, 17.826],
        title: "Upper basin reservoir node",
        description: "Reservoir watchpoint for upstream storage and release coordination.",
        properties: {
          basin: "Nan",
          type: "reservoir"
        },
        source: jaxaEarthMeta
      }
    ]
  },
  {
    layerId: "land-use",
    updatedAt: seededAt,
    bounds: [7.0, 98.1, 19.1, 104.7],
    source: undpDataMeta,
    features: [
      {
        id: "land-use-bangkok-urban-core",
        layerId: "land-use",
        geometryType: "Polygon",
        coordinates: [
          [100.35, 13.6],
          [100.7, 13.6],
          [100.7, 13.95],
          [100.35, 13.95]
        ],
        title: "Bangkok urban core",
        description: "Dense built-up urban fabric for comparing growth against civic-service coverage.",
        properties: {
          classification: "dense-urban",
          changeSignal: "expansion"
        },
        source: undpDataMeta
      },
      {
        id: "land-use-eec-industrial",
        layerId: "land-use",
        geometryType: "Polygon",
        coordinates: [
          [100.95, 12.8],
          [101.8, 12.8],
          [101.95, 13.45],
          [101.1, 13.5]
        ],
        title: "Eastern industrial estates",
        description: "Manufacturing and logistics land-use cluster along the eastern corridor.",
        properties: {
          classification: "industrial",
          changeSignal: "intensifying"
        },
        source: undpDataMeta
      },
      {
        id: "land-use-northern-forest-edge",
        layerId: "land-use",
        geometryType: "Polygon",
        coordinates: [
          [98.35, 18.0],
          [99.7, 18.0],
          [100.0, 19.45],
          [98.65, 19.6]
        ],
        title: "Northern forest edge",
        description: "Watershed, forest, and settlement edge useful for conservation-pressure comparisons.",
        properties: {
          classification: "forest-edge",
          changeSignal: "sensitive"
        },
        source: esaEodashboardMeta
      },
      {
        id: "land-use-khonkaen-civic-core",
        layerId: "land-use",
        geometryType: "Point",
        coordinates: [102.824, 16.432],
        title: "Khon Kaen mixed-use civic core",
        description: "City-center mixed-use node for mobility, university, and service concentration.",
        properties: {
          classification: "mixed-use",
          changeSignal: "active"
        },
        source: dataToPolicyMeta
      }
    ]
  },
  {
    layerId: "weather",
    updatedAt: seededAt,
    bounds: [13.74, 100.49, 14.03, 100.61],
    source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live"),
    features: [
      {
        id: "weather-bangkok-core",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok Core",
        description: "Urban core weather watchpoint",
        properties: { city: "Bangkok Core", temperatureC: 34, humidity: 58, windKph: 11, region: "Bangkok" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-mtt",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5512, 13.9118],
        title: "Muang Thong Thani",
        description: "Estate weather watchpoint",
        properties: { city: "Muang Thong Thani", temperatureC: 33, humidity: 63, windKph: 9, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-impact-core",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5479, 13.9128],
        title: "IMPACT Core",
        description: "Convention campus weather watchpoint",
        properties: { city: "IMPACT Core", temperatureC: 33, humidity: 64, windKph: 8, region: "Muang Thong Thani" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-pak-kret",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.4976, 13.9062],
        title: "Pak Kret",
        description: "District weather watchpoint",
        properties: { city: "Pak Kret", temperatureC: 32, humidity: 65, windKph: 10, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-chaeng-watthana",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5676, 13.8945],
        title: "Chaeng Watthana",
        description: "North-Bangkok corridor weather watchpoint",
        properties: { city: "Chaeng Watthana", temperatureC: 33, humidity: 61, windKph: 9, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-lak-si",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5798, 13.8864],
        title: "Lak Si",
        description: "North-Bangkok district weather watchpoint",
        properties: { city: "Lak Si", temperatureC: 33, humidity: 60, windKph: 12, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-don-mueang",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.6074, 13.9154],
        title: "Don Mueang",
        description: "Airport-edge weather watchpoint",
        properties: { city: "Don Mueang", temperatureC: 34, humidity: 57, windKph: 14, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-nonthaburi-civic",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5148, 13.8606],
        title: "Nonthaburi Civic Center",
        description: "Province administrative weather watchpoint",
        properties: { city: "Nonthaburi Civic Center", temperatureC: 32, humidity: 62, windKph: 9, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-pathumthani",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.525, 14.0208],
        title: "Pathum Thani",
        description: "Northern corridor weather watchpoint",
        properties: { city: "Pathum Thani", temperatureC: 32, humidity: 59, windKph: 10, region: "Central" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      }
    ]
  },
  {
    layerId: "pollution",
    updatedAt: seededAt,
    bounds: [13.74, 100.49, 14.03, 100.61],
    source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live"),
    features: [
      {
        id: "pollution-bangkok-core",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok Core",
        description: "Urban-core AQI watchpoint",
        properties: { city: "Bangkok Core", aqi: 84, pm25: 26, pm10: 33, region: "Bangkok" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-mtt",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5512, 13.9118],
        title: "Muang Thong Thani",
        description: "Estate AQI watchpoint",
        properties: { city: "Muang Thong Thani", aqi: 96, pm25: 31, pm10: 37, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-impact-core",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5479, 13.9128],
        title: "IMPACT Core",
        description: "Convention-campus AQI watchpoint",
        properties: { city: "IMPACT Core", aqi: 92, pm25: 28, pm10: 35, region: "Muang Thong Thani" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-pak-kret",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.4976, 13.9062],
        title: "Pak Kret",
        description: "District AQI watchpoint",
        properties: { city: "Pak Kret", aqi: 88, pm25: 27, pm10: 34, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-chaeng-watthana",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5676, 13.8945],
        title: "Chaeng Watthana",
        description: "North-Bangkok corridor AQI watchpoint",
        properties: { city: "Chaeng Watthana", aqi: 94, pm25: 30, pm10: 36, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-lak-si",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5798, 13.8864],
        title: "Lak Si",
        description: "North-Bangkok district AQI watchpoint",
        properties: { city: "Lak Si", aqi: 91, pm25: 29, pm10: 35, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-don-mueang",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.6074, 13.9154],
        title: "Don Mueang",
        description: "Airport-edge AQI watchpoint",
        properties: { city: "Don Mueang", aqi: 86, pm25: 24, pm10: 31, region: "North Bangkok" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-nonthaburi-civic",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5148, 13.8606],
        title: "Nonthaburi Civic Center",
        description: "Province administrative AQI watchpoint",
        properties: { city: "Nonthaburi Civic Center", aqi: 82, pm25: 23, pm10: 30, region: "Nonthaburi" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-pathumthani",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.525, 14.0208],
        title: "Pathum Thani",
        description: "Northern corridor AQI watchpoint",
        properties: { city: "Pathum Thani", aqi: 73, pm25: 20, pm10: 27, region: "Central" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      }
    ]
  },
  {
    layerId: "disaster",
    updatedAt: seededAt,
    bounds: [6.5, 98.0, 19.1, 104.7],
    source: gistdaDisasterMeta,
    features: [
      {
        id: "disaster-south-flood-watch",
        layerId: "disaster",
        geometryType: "Polygon",
        coordinates: [
          [97.9, 7.1],
          [99.3, 7.1],
          [99.1, 8.8],
          [98.1, 8.9]
        ],
        title: "Southern flash-flood watch zone",
        description: "Heavy-rain, runoff, and transport disruption monitoring zone.",
        properties: {
          hazard: "flood",
          severity: "watch"
        },
        source: gistdaDisasterMeta
      },
      {
        id: "disaster-north-landslide-band",
        layerId: "disaster",
        geometryType: "LineString",
        coordinates: [
          [98.45, 18.2],
          [98.85, 18.7],
          [99.15, 19.2],
          [99.55, 19.6]
        ],
        title: "Northern landslide response band",
        description: "Mountain roads and high-slope settlements under seasonal watch.",
        properties: {
          hazard: "landslide",
          severity: "watch"
        },
        source: gistdaDisasterMeta
      },
      {
        id: "disaster-isan-drought-core",
        layerId: "disaster",
        geometryType: "Polygon",
        coordinates: [
          [102.1, 15.0],
          [104.3, 15.0],
          [104.4, 16.9],
          [102.4, 17.1]
        ],
        title: "Isan drought-pressure zone",
        description: "High-temperature, low-rainfall pressure zone for seasonal response planning.",
        properties: {
          hazard: "drought",
          severity: "alert"
        },
        source: gistdaDisasterMeta
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
    { th: "เมืองทองธานี — ติดตาม PM2.5 และคุณภาพอากาศรายวัน", en: "Muang Thong Thani: monitor PM2.5 and air quality daily." }
  ],
  weatherTemperatureC: 31,
  aqi: 68,
  source: seedMeta("Open-Meteo", "https://open-meteo.com/en/docs", "live")
};

export const briefing: BriefingNote = {
  id: "briefing-1",
  headline: {
    th: "เมืองทองธานี: โครงการ SLIC และ IMPACT Mobility ก้าวหน้าตามแผน คุณภาพอากาศอยู่ในเกณฑ์ดี",
    en: "MTT Update: SLIC hub and IMPACT Mobility on track — air quality within safe range."
  },
  body: {
    th: "โครงการด้านพลังงานและการเดินทางเมืองทองธานีคืบหน้าตามแผน ขณะที่ PM2.5 ยังอยู่ในเกณฑ์ที่ยอมรับได้สำหรับพื้นที่เมืองใหม่",
    en: "Energy microgrid and mobility pilots are advancing, while PM2.5 remains within acceptable range for the new town district."
  },
  updatedAt: seededAt,
  source: seedMeta("depa / SLIC", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
};

export const overviewMetrics = [
  {
    id: "active-projects",
    label: { th: "โครงการเมืองทองธานีที่กำลังเดินหน้า", en: "MTT Active Projects" },
    value: 5,
    displayValue: "5",
    trend: "up" as const,
    deltaText: { th: "+2 จากไตรมาสก่อน", en: "+2 vs last quarter" },
    tone: "positive" as const,
    meta: seedMeta("depa Smart City Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
  },
  {
    id: "sensor-nodes",
    label: { th: "จุดเซนเซอร์สิ่งแวดล้อม", en: "Environment Sensor Nodes" },
    value: 18,
    displayValue: "18",
    trend: "up" as const,
    deltaText: { th: "+8 จากรอบก่อน", en: "+8 new nodes" },
    tone: "positive" as const,
    meta: seedMeta("MTT Sensor Grid", "https://www.depa.or.th", "live")
  },
  {
    id: "resilience-watch",
    label: { th: "สัญญาณเฝ้าระวัง", en: "Watch Signals" },
    value: 1,
    displayValue: "01",
    trend: "down" as const,
    deltaText: { th: "ลดลงจาก 3 จุด", en: "Down from 3 signals" },
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

export const changePulse: ChangePulse = {
  updatedAt: seededAt,
  items: [
    {
      id: "change-new-signals",
      label: { th: "สัญญาณใหม่", en: "New Signals" },
      value: 9,
      tone: "positive",
      detail: {
        th: "ข่าว 5 | แผนที่ 2 | โครงการ 2",
        en: "5 news | 2 map updates | 2 project changes"
      }
    },
    {
      id: "change-live-sources",
      label: { th: "แหล่งข้อมูลพร้อมใช้", en: "Live Sources" },
      value: 9,
      tone: "neutral",
      detail: {
        th: "มี 2 แหล่งข้อมูลยังอยู่โหมด manual",
        en: "2 sources are still manual"
      }
    },
    {
      id: "change-media-mentions",
      label: { th: "การกล่าวถึงภายนอก", en: "External Mentions" },
      value: 17,
      tone: "positive",
      detail: {
        th: "GDELT และข่าวเปิดให้ภาพรวมการกล่าวถึง",
        en: "GDELT and open news feeds drive the mention baseline"
      }
    },
    {
      id: "change-alerts",
      label: { th: "จุดเฝ้าระวัง", en: "Watchpoints" },
      value: 3,
      tone: "warning",
      detail: {
        th: "คุณภาพอากาศและน้ำยังเป็นจุดที่ต้องเฝ้าระวัง",
        en: "Air quality and water response remain active watchpoints"
      }
    }
  ],
  thresholds: [
    {
      id: "threshold-media",
      label: { th: "สัญญาณสื่อ", en: "Media Spike" },
      state: "watch",
      detail: {
        th: "ถ้าการกล่าวถึงเกิน 20 รายการให้ยกระดับการติดตาม",
        en: "Escalate if mentions rise above 20"
      }
    },
    {
      id: "threshold-stale",
      label: { th: "ข้อมูลล่าช้า", en: "Stale Sources" },
      state: "ok",
      detail: {
        th: "ไม่มี feed สดค้างเกินรอบซิงก์",
        en: "No live feed is stale past the sync window"
      }
    },
    {
      id: "threshold-air",
      label: { th: "คุณภาพอากาศ", en: "Air Quality" },
      state: "watch",
      detail: {
        th: "AQI เกิน 60 ให้คงการสื่อสารรายวัน",
        en: "Keep daily messaging when AQI exceeds 60"
      }
    }
  ]
};

export const activityLog: ActivityLogItem[] = [
  {
    id: "activity-1",
    timestamp: seededAt,
    sourceId: "google-news-rss",
    label: "Google News RSS",
    detail: "Imported 10 external headlines.",
    status: "live"
  },
  {
    id: "activity-2",
    timestamp: seededAt,
    sourceId: "citydata",
    label: "CityData Thailand",
    detail: "Refreshed the Smart City Thailand coverage footprint.",
    status: "live"
  },
  {
    id: "activity-3",
    timestamp: seededAt,
    sourceId: "open-meteo-air",
    label: "Open-Meteo Air Quality",
    detail: "Air-quality feed refreshed for Bangkok and northern watch zones.",
    status: "live"
  },
  {
    id: "activity-4",
    timestamp: seededAt,
    sourceId: "nasa-eonet",
    label: "NASA EONET",
    detail: "Regional natural-event watch refreshed for the resilience layer.",
    status: "live"
  }
];

export const socialListening: SocialListeningSnapshot = {
  updatedAt: seededAt,
  mentionCount: 17,
  sentimentScore: 18,
  sourceCount: 6,
  positiveShare: 0.59,
  dominantSource: "GDELT Signals",
  topTerms: ["smart city", "thailand", "mobility", "resilience", "depa"],
  source: seedMeta("GDELT Signals", "https://api.gdeltproject.org/api/v2/doc/doc", "live")
};

export const officialImpact: OfficialImpactSnapshot = {
  updatedAt: seededAt,
  officialUpdates: 4,
  liveSources: 9,
  trackedCities: 50,
  publicSignals: 23,
  latestHeadline: briefing.headline,
  source: seedMeta("Smart City Thailand Office", "https://www.depa.or.th/th/smart-city-plan/smart-city-office")
};

export const marketSnapshot: MarketSnapshot = {
  updatedAt: seededAt,
  items: [
    {
      id: "usd-thb",
      label: { th: "ดอลลาร์ / บาท", en: "USD / THB" },
      value: "35.6",
      changeText: { th: "เงินดอลลาร์ทรงตัว", en: "FX baseline" },
      tone: "neutral"
    },
    {
      id: "btc-usd",
      label: { th: "บิตคอยน์", en: "Bitcoin" },
      value: "$63.4k",
      changeText: { th: "ตัวชี้วัดความเสี่ยง", en: "Risk appetite proxy" },
      tone: "positive"
    },
    {
      id: "gold-usd",
      label: { th: "ทองคำ / ออนซ์", en: "Gold / oz" },
      value: "$2,020",
      changeText: { th: "สินทรัพย์ป้องกันความเสี่ยง", en: "Defensive signal" },
      tone: "warning"
    }
  ],
  source: seedMeta("Market Context", "https://api.coingecko.com", "live")
};

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
