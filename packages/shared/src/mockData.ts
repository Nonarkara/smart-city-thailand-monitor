import type {
  ActivityLogItem,
  AuditEventRecord,
  BriefingNote,
  CameraEventSample,
  CityProfile,
  ChangePulse,
  CommandCenterSnapshot,
  CommandConnector,
  CommandCenterMetric,
  DashboardView,
  DecisionQueueItem,
  DistrictProfile,
  DomainScorecard,
  ExpansionTrack,
  FusionQueueItem,
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
  ReporterCaseSample,
  ResilienceSnapshot,
  SensorFeedSample,
  SocialListeningSnapshot,
  SourceMeta,
  SourceRecord,
  TimeRange,
  TimeSnapshot,
  WorkflowBoardStatus,
  PublicCctvCamera
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

export const districts: DistrictProfile[] = [
  {
    id: "district-bangkok-phra-nakhon",
    slug: "phra-nakhon",
    citySlug: "bangkok",
    name: { th: "พระนคร", en: "Phra Nakhon" },
    population: 53000,
    focus: {
      th: "แกนเมืองเก่า การเดินเท้า และการจัดการนักท่องเที่ยว",
      en: "Historic core, walkability, and visitor-flow management."
    },
    priority: {
      th: "ควบคุมการเดินเท้าและคุณภาพอากาศรอบแหล่งท่องเที่ยว",
      en: "Keep pedestrian movement and air quality stable around heritage sites."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [100.4992, 13.7568],
    bounds: [13.744, 100.488, 13.768, 100.511],
    watchpoints: [
      { th: "ฝุ่นช่วงเช้าในแนวการท่องเที่ยว", en: "Morning haze along the visitor corridor." },
      { th: "แรงกดดันการสัญจรข้ามแม่น้ำ", en: "Cross-river traffic pressure." }
    ],
    recommendedLayers: ["pollution", "news", "bangkok-passages"],
    source: seedMeta("Bangkok Operations Desk", "https://www.bangkok.go.th")
  },
  {
    id: "district-bangkok-pathum-wan",
    slug: "pathum-wan",
    citySlug: "bangkok",
    name: { th: "ปทุมวัน", en: "Pathum Wan" },
    population: 47000,
    focus: {
      th: "โหนดคมนาคม ศูนย์การค้า และความร้อนเมือง",
      en: "Transit interchange, retail footfall, and urban heat."
    },
    priority: {
      th: "ลดความร้อนและคงความไหลลื่นของการเดินทางในช่วงบ่าย",
      en: "Reduce daytime heat exposure while keeping interchange movement fluid."
    },
    riskLevel: "high",
    updatedAt: seededAt,
    center: [100.5287, 13.7444],
    bounds: [13.731, 100.515, 13.757, 100.54],
    watchpoints: [
      { th: "จุดร้อนคนหนาแน่นใกล้แนวรถไฟฟ้า", en: "Heat-stress pockets near interchange stations." },
      { th: "คอขวดทางเท้าในช่วงกิจกรรม", en: "Pedestrian bottlenecks during event peaks." }
    ],
    recommendedLayers: ["weather", "projects", "itic-traffic"],
    source: seedMeta("Bangkok Operations Desk", "https://www.bangkok.go.th")
  },
  {
    id: "district-bangkok-bang-na",
    slug: "bang-na",
    citySlug: "bangkok",
    name: { th: "บางนา", en: "Bang Na" },
    population: 99000,
    focus: {
      th: "ทางด่วน โลจิสติกส์ และการเชื่อมสนามบิน",
      en: "Expressways, freight logistics, and airport-linked flows."
    },
    priority: {
      th: "จับตาความหนาแน่นรถบรรทุกและจุดน้ำขังริมโครงข่ายหลัก",
      en: "Watch freight pressure and drainage chokepoints along the main corridor."
    },
    riskLevel: "high",
    updatedAt: seededAt,
    center: [100.6121, 13.6678],
    bounds: [13.645, 100.58, 13.7, 100.63],
    watchpoints: [
      { th: "เส้นทางขนส่งมีโอกาสติดขัดต่อเนื่อง", en: "Freight corridors can stay congested for long windows." },
      { th: "พื้นที่ลุ่มต่ำใกล้แนวถนนหลัก", en: "Low-lying roadside drainage pockets." }
    ],
    recommendedLayers: ["itic-traffic", "water", "projects"],
    source: seedMeta("Bangkok Operations Desk", "https://www.bangkok.go.th")
  },
  {
    id: "district-bangkok-thon-buri",
    slug: "thon-buri",
    citySlug: "bangkok",
    name: { th: "ธนบุรี", en: "Thon Buri" },
    population: 73000,
    focus: {
      th: "คลอง การเข้าถึงบริการ และความเชื่อมโยงข้ามแม่น้ำ",
      en: "Canal management, service access, and cross-river movement."
    },
    priority: {
      th: "เร่งบริหารน้ำริมคลองและเส้นทางเชื่อมโรงพยาบาล",
      en: "Keep canal response and hospital access routes stable."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [100.4845, 13.7246],
    bounds: [13.708, 100.47, 13.744, 100.503],
    watchpoints: [
      { th: "จุดระบายน้ำริมคลอง", en: "Canal-edge drainage watchpoints." },
      { th: "คอขวดสะพานช่วงพีค", en: "Bridge bottlenecks during commute peaks." }
    ],
    recommendedLayers: ["water", "bangkok-passages", "itic-traffic"],
    source: seedMeta("Bangkok Operations Desk", "https://www.bangkok.go.th")
  },
  {
    id: "district-phuket-mueang-phuket",
    slug: "mueang-phuket",
    citySlug: "phuket",
    name: { th: "เมืองภูเก็ต", en: "Mueang Phuket" },
    population: 79000,
    focus: {
      th: "ศูนย์ราชการ เมืองเก่า และการระบายน้ำ",
      en: "Administrative core, old town, and drainage readiness."
    },
    priority: {
      th: "คงการเข้าถึงเมืองเก่าและบริหารฝนกระทบการท่องเที่ยว",
      en: "Keep old-town access open during rain-affected visitor periods."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [98.3923, 7.8804],
    bounds: [7.79, 98.28, 8.05, 98.45],
    watchpoints: [
      { th: "น้ำท่วมขังจุดต่ำในเขตเมืองเก่า", en: "Surface flooding in low-lying old-town streets." },
      { th: "แรงกดดันการจอดรถและรถรับส่ง", en: "Parking and shuttle pressure." }
    ],
    recommendedLayers: ["weather", "news", "projects"],
    source: seedMeta("Phuket Smart City", "https://www.citydata.in.th")
  },
  {
    id: "district-phuket-kathu",
    slug: "kathu",
    citySlug: "phuket",
    name: { th: "กะทู้", en: "Kathu" },
    population: 54000,
    focus: {
      th: "โซนท่องเที่ยวหนาแน่นและเส้นทางขึ้นเขา",
      en: "High-traffic tourism zone and hill corridor access."
    },
    priority: {
      th: "เฝ้าระวังฝนหนัก การจราจร และความปลอดภัยนักท่องเที่ยว",
      en: "Watch rain, traffic, and tourist safety at peak periods."
    },
    riskLevel: "high",
    updatedAt: seededAt,
    center: [98.3381, 7.9155],
    bounds: [7.86, 98.3, 7.97, 98.37],
    watchpoints: [
      { th: "แรงกดดันรถรับส่งในย่านชายหาด", en: "Beach shuttle congestion." },
      { th: "เสถียรภาพทางลาดชันช่วงฝน", en: "Slope stability during heavy rain." }
    ],
    recommendedLayers: ["weather", "itic-traffic", "news"],
    source: seedMeta("Phuket Smart City", "https://www.citydata.in.th")
  },
  {
    id: "district-phuket-thalang",
    slug: "thalang",
    citySlug: "phuket",
    name: { th: "ถลาง", en: "Thalang" },
    population: 61000,
    focus: {
      th: "สนามบิน โลจิสติกส์ และชุมชนชายฝั่ง",
      en: "Airport access, logistics, and coastal communities."
    },
    priority: {
      th: "รักษาเสถียรภาพเส้นทางสนามบินและโครงสร้างพื้นฐานชายฝั่ง",
      en: "Protect airport corridors and coastal infrastructure continuity."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [98.3344, 8.0315],
    bounds: [7.98, 98.27, 8.16, 98.43],
    watchpoints: [
      { th: "ปริมาณรถเชื่อมสนามบิน", en: "Airport corridor volume." },
      { th: "ความเสี่ยงลมแรงชายฝั่ง", en: "Coastal wind exposure." }
    ],
    recommendedLayers: ["weather", "water", "projects"],
    source: seedMeta("Phuket Smart City", "https://www.citydata.in.th")
  },
  {
    id: "district-chiang-mai-mueang",
    slug: "mueang-chiang-mai",
    citySlug: "chiang-mai",
    name: { th: "เมืองเชียงใหม่", en: "Mueang Chiang Mai" },
    population: 240000,
    focus: {
      th: "ศูนย์กลางเมือง การท่องเที่ยว และ PM2.5",
      en: "Urban core, tourism, and PM2.5 exposure."
    },
    priority: {
      th: "รักษาการสื่อสารคุณภาพอากาศและเส้นทางบริการสำคัญ",
      en: "Maintain daily AQI messaging and priority service routes."
    },
    riskLevel: "high",
    updatedAt: seededAt,
    center: [98.9853, 18.7883],
    bounds: [18.73, 98.94, 18.84, 99.04],
    watchpoints: [
      { th: "ฝุ่นสะสมช่วงเช้า", en: "Morning PM2.5 accumulation." },
      { th: "แรงกดดันนักท่องเที่ยวในคูเมือง", en: "Old-city visitor pressure." }
    ],
    recommendedLayers: ["pollution", "news", "weather"],
    source: seedMeta("Chiang Mai Civic Data", "https://www.citydata.in.th")
  },
  {
    id: "district-chiang-mai-hang-dong",
    slug: "hang-dong",
    citySlug: "chiang-mai",
    name: { th: "หางดง", en: "Hang Dong" },
    population: 93000,
    focus: {
      th: "ชานเมืองเติบโตเร็วและการเข้าถึงบริการ",
      en: "Fast-growing peri-urban services and access."
    },
    priority: {
      th: "รองรับการขยายตัวที่อยู่อาศัยและการเดินทางเชื่อมเมือง",
      en: "Manage growth pressure and city-bound mobility."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [98.919, 18.687],
    bounds: [18.62, 98.87, 18.75, 98.98],
    watchpoints: [
      { th: "แรงกดดันเส้นทางเข้าเมือง", en: "Inbound commute pressure." },
      { th: "พื้นที่เสี่ยงน้ำขังท้องถิ่น", en: "Localized standing-water pockets." }
    ],
    recommendedLayers: ["projects", "weather", "water"],
    source: seedMeta("Chiang Mai Civic Data", "https://www.citydata.in.th")
  },
  {
    id: "district-chiang-mai-mae-rim",
    slug: "mae-rim",
    citySlug: "chiang-mai",
    name: { th: "แม่ริม", en: "Mae Rim" },
    population: 87000,
    focus: {
      th: "เชิงเขา พื้นที่สีเขียว และการท่องเที่ยวธรรมชาติ",
      en: "Foothills, green cover, and nature-based tourism."
    },
    priority: {
      th: "เฝ้าระวังไฟป่าและควันในแนวขอบเมือง",
      en: "Watch wildfire smoke and urban-edge haze."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [98.961, 18.915],
    bounds: [18.84, 98.89, 19.0, 99.03],
    watchpoints: [
      { th: "ควันและจุดความร้อนใกล้เชิงเขา", en: "Foothill smoke and hotspot risk." },
      { th: "แรงกดดันเส้นทางท่องเที่ยวธรรมชาติ", en: "Nature-tourism route pressure." }
    ],
    recommendedLayers: ["eo-aerosol", "eo-vegetation", "pollution"],
    source: seedMeta("Chiang Mai Civic Data", "https://www.citydata.in.th")
  },
  {
    id: "district-khon-kaen-mueang",
    slug: "mueang-khon-kaen",
    citySlug: "khon-kaen",
    name: { th: "เมืองขอนแก่น", en: "Mueang Khon Kaen" },
    population: 180000,
    focus: {
      th: "ศูนย์บริการเมือง การศึกษา และการเดินทางหลัก",
      en: "Civic services, education clusters, and main mobility corridors."
    },
    priority: {
      th: "เร่งดูเส้นทางโรงพยาบาล-มหาวิทยาลัยและความร้อนช่วงบ่าย",
      en: "Protect hospital-university corridors and afternoon heat comfort."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [102.8236, 16.4322],
    bounds: [16.37, 102.76, 16.5, 102.9],
    watchpoints: [
      { th: "ความร้อนในแกนมหาวิทยาลัย", en: "Heat exposure around university corridors." },
      { th: "แรงกดดันการเดินทางในเมือง", en: "Inner-city mobility pressure." }
    ],
    recommendedLayers: ["weather", "projects", "pollution"],
    source: seedMeta("Khon Kaen Smart City", "https://www.citydata.in.th")
  },
  {
    id: "district-khon-kaen-nam-phong",
    slug: "nam-phong",
    citySlug: "khon-kaen",
    name: { th: "น้ำพอง", en: "Nam Phong" },
    population: 54000,
    focus: {
      th: "โครงสร้างพื้นฐานพลังงานและพื้นที่ชานเมือง",
      en: "Energy infrastructure and peri-urban growth."
    },
    priority: {
      th: "ติดตามโครงข่ายสาธารณูปโภคและคุณภาพอากาศจากกิจกรรมอุตสาหกรรม",
      en: "Track utility continuity and industry-linked air quality."
    },
    riskLevel: "watch",
    updatedAt: seededAt,
    center: [102.865, 16.705],
    bounds: [16.62, 102.8, 16.79, 102.93],
    watchpoints: [
      { th: "โหลดโครงข่ายพลังงานและสาธารณูปโภค", en: "Utility network load." },
      { th: "ฝุ่นจากกิจกรรมอุตสาหกรรม", en: "Industrial dust exposure." }
    ],
    recommendedLayers: ["pollution", "projects", "economy"],
    source: seedMeta("Khon Kaen Smart City", "https://www.citydata.in.th")
  },
  {
    id: "district-khon-kaen-ban-haet",
    slug: "ban-haet",
    citySlug: "khon-kaen",
    name: { th: "บ้านแฮด", en: "Ban Haet" },
    population: 42000,
    focus: {
      th: "เกษตร ดิจิทัลบริการ และการเชื่อมโลจิสติกส์",
      en: "Agri-services, logistics links, and service access."
    },
    priority: {
      th: "คงเสถียรภาพเส้นทางขนส่งสินค้าเกษตรและการเข้าถึงบริการ",
      en: "Stabilize agri-logistics routes and service coverage."
    },
    riskLevel: "low",
    updatedAt: seededAt,
    center: [102.78, 16.22],
    bounds: [16.15, 102.72, 16.29, 102.84],
    watchpoints: [
      { th: "เส้นทางขนส่งสินค้าเกษตร", en: "Agri-logistics corridor continuity." },
      { th: "จุดบริการดิจิทัลชุมชน", en: "Community digital-service coverage." }
    ],
    recommendedLayers: ["projects", "economy", "agriculture"],
    source: seedMeta("Khon Kaen Smart City", "https://www.citydata.in.th")
  }
];

export const projects: ProjectRecord[] = [
  {
    id: "project-1",
    slug: "bangkok-flood-command",
    title: { th: "ศูนย์สั่งการน้ำท่วมกรุงเทพ", en: "Bangkok Flood Command Grid" },
    citySlug: "bangkok",
    districtSlug: "thon-buri",
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
    districtSlug: "kathu",
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
    districtSlug: "mueang-khon-kaen",
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
    districtSlug: "mueang-chiang-mai",
    domainSlug: "environment",
    publishedAt: seededAt,
    source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
  }
];

export const decisionQueue: DecisionQueueItem[] = [
  {
    id: "decision-bangkok-bang-na-drainage",
    citySlug: "bangkok",
    districtSlug: "bang-na",
    domainSlug: "environment",
    title: {
      th: "ยืนยันทีมล้างท่อและปั๊มน้ำแนวบางนา",
      en: "Confirm pump and drain crews for the Bang Na corridor"
    },
    summary: {
      th: "พื้นที่แนวโลจิสติกส์มีความเสี่ยงน้ำขังและกระทบการเดินทางสินค้าในรอบบ่าย",
      en: "Freight-facing drainage pockets could slow corridor movement through the afternoon."
    },
    severity: "urgent",
    status: "new",
    confidence: 0.84,
    owner: { th: "สำนักการระบายน้ำ", en: "Drainage Operations" },
    recommendedAction: {
      th: "ยืนยันกำลังคน เครื่องสูบ และข้อความแจ้งเตือนเส้นทางสำรองภายใน 2 ชั่วโมง",
      en: "Confirm crews, mobile pumps, and alternate-route messaging within 2 hours."
    },
    dueAt: "2026-03-12T09:00:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-weather", "itic-traffic"],
    layerIds: ["water", "itic-traffic", "projects"]
  },
  {
    id: "decision-bangkok-pathumwan-heat",
    citySlug: "bangkok",
    districtSlug: "pathum-wan",
    domainSlug: "living",
    title: {
      th: "เปิดจุดพักร้อนในแกนปทุมวันช่วงบ่าย",
      en: "Stage heat-relief support in Pathum Wan this afternoon"
    },
    summary: {
      th: "จุดร้อนเมืองและปริมาณคนสูงทำให้โหนดเดินเท้าเสี่ยงต่อความไม่สบายและคอขวด",
      en: "Urban heat plus heavy footfall raises comfort and crowding risk around interchange nodes."
    },
    severity: "watch",
    status: "ready",
    confidence: 0.78,
    owner: { th: "สำนักอนามัยและเทศกิจ", en: "Health and field operations" },
    recommendedAction: {
      th: "จัดน้ำดื่ม จุดพัก และเจ้าหน้าที่ภาคสนามในแนวสถานีหลัก",
      en: "Deploy water, shade, and field staff near the main stations."
    },
    dueAt: "2026-03-12T10:30:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-weather", "citydata"],
    layerIds: ["weather", "projects", "bangkok-passages"]
  },
  {
    id: "decision-bangkok-thonburi-bridge",
    citySlug: "bangkok",
    districtSlug: "thon-buri",
    domainSlug: "mobility",
    title: {
      th: "จัดการคอขวดสะพานฝั่งธนบุรีช่วงชั่วโมงเร่งด่วน",
      en: "Manage Thon Buri bridge bottlenecks before peak hour"
    },
    summary: {
      th: "จุดตรวจการจราจรข้ามแม่น้ำเริ่มตึงและกระทบเส้นทางโรงพยาบาล",
      en: "Cross-river bridge pressure is building and can affect hospital access."
    },
    severity: "watch",
    status: "in-progress",
    confidence: 0.81,
    owner: { th: "จราจรและเทศกิจ", en: "Traffic and field control" },
    recommendedAction: {
      th: "จัดคนหน้างานและข้อความนำทางก่อนช่วงพีค",
      en: "Position field officers and publish route guidance before the evening peak."
    },
    dueAt: "2026-03-12T11:15:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["itic-traffic"],
    layerIds: ["itic-traffic", "water"]
  },
  {
    id: "decision-chiangmai-aqi-schools",
    citySlug: "chiang-mai",
    districtSlug: "mueang-chiang-mai",
    domainSlug: "environment",
    title: {
      th: "คงประกาศ PM2.5 รายวันและแนวทางโรงเรียนในเมืองเชียงใหม่",
      en: "Maintain daily PM2.5 school guidance in Mueang Chiang Mai"
    },
    summary: {
      th: "AQI ยังอยู่ในระดับต้องสื่อสารต่อเนื่องสำหรับเด็กและผู้เปราะบาง",
      en: "AQI remains elevated enough to justify continued school-facing messaging."
    },
    severity: "urgent",
    status: "ready",
    confidence: 0.91,
    owner: { th: "สาธารณสุขจังหวัด", en: "Provincial public health" },
    recommendedAction: {
      th: "ยืนยันข้อความรายวัน หน้ากาก และกิจกรรมกลางแจ้งตามช่วงเวลา",
      en: "Confirm daily messaging, masks, and time-based outdoor activity guidance."
    },
    dueAt: "2026-03-12T08:30:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-air", "google-news-rss"],
    layerIds: ["pollution", "news", "eo-aerosol"]
  },
  {
    id: "decision-chiangmai-maerim-smoke",
    citySlug: "chiang-mai",
    districtSlug: "mae-rim",
    domainSlug: "environment",
    title: {
      th: "ติดตามจุดควันเชิงเขาแม่ริมแบบครึ่งวัน",
      en: "Track Mae Rim foothill smoke twice today"
    },
    summary: {
      th: "พื้นที่ขอบเมืองยังต้องเฝ้าระวังควันและจุดความร้อนที่อาจไหลเข้าพื้นที่ชุมชน",
      en: "Urban-edge smoke can still shift toward populated zones from foothill hotspots."
    },
    severity: "watch",
    status: "new",
    confidence: 0.73,
    owner: { th: "สิ่งแวดล้อมและป้องกันภัย", en: "Environment and emergency watch" },
    recommendedAction: {
      th: "จัดรอบตรวจภาคสนามและเทียบ EO aerosol กับรายงานท้องถิ่น",
      en: "Run a midday field check and compare EO aerosol with local reports."
    },
    dueAt: "2026-03-12T12:00:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-air", "nasa-gibs"],
    layerIds: ["eo-aerosol", "eo-vegetation", "pollution"]
  },
  {
    id: "decision-phuket-kathu-storm",
    citySlug: "phuket",
    districtSlug: "kathu",
    domainSlug: "living",
    title: {
      th: "เตรียมแผนฝนหนักและ crowd control ในกะทู้",
      en: "Prepare heavy-rain and crowd control response in Kathu"
    },
    summary: {
      th: "พื้นที่ท่องเที่ยวหนาแน่นต้องพร้อมทั้งการจราจรและความปลอดภัยเมื่อฝนแรง",
      en: "The tourism core needs coordinated traffic and safety response during heavy rain."
    },
    severity: "urgent",
    status: "in-progress",
    confidence: 0.79,
    owner: { th: "เทศบาลและท่องเที่ยว", en: "Municipal and tourism operations" },
    recommendedAction: {
      th: "ยืนยันหน้างานจราจร แจ้งเตือนผู้ประกอบการ และเช็กเส้นทางรับส่ง",
      en: "Confirm traffic crews, brief operators, and verify shuttle routing."
    },
    dueAt: "2026-03-12T09:45:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-weather", "google-news-rss"],
    layerIds: ["weather", "news", "itic-traffic"]
  },
  {
    id: "decision-phuket-thalang-airport",
    citySlug: "phuket",
    districtSlug: "thalang",
    domainSlug: "mobility",
    title: {
      th: "คงช่องทางสนามบินและจุดต้อนรับในถลาง",
      en: "Keep Thalang airport approaches and reception points stable"
    },
    summary: {
      th: "ปริมาณเดินทางเข้าเมืองและสนามบินควรมีแผนรองรับแบบต่อเนื่อง",
      en: "Airport-linked arrival flow needs steady corridor management."
    },
    severity: "monitor",
    status: "ready",
    confidence: 0.69,
    owner: { th: "ขนส่งและเทศกิจ", en: "Transport and field operations" },
    recommendedAction: {
      th: "ประสานรถรับส่งและสื่อสารเส้นทางสำรองหากเกิดฝนแรง",
      en: "Coordinate shuttle staging and alternate routing if rain intensifies."
    },
    dueAt: "2026-03-12T13:00:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-weather"],
    layerIds: ["weather", "projects"]
  },
  {
    id: "decision-khonkaen-core-heat",
    citySlug: "khon-kaen",
    districtSlug: "mueang-khon-kaen",
    domainSlug: "living",
    title: {
      th: "จัดจุดพักร้อนบนแกนโรงพยาบาล-มหาวิทยาลัย",
      en: "Stage heat relief on the hospital-university corridor"
    },
    summary: {
      th: "อุณหภูมิและการเดินทางในแกนบริการหลักเริ่มกดดันผู้ใช้บริการ",
      en: "Heat and movement pressure are rising along the main service corridor."
    },
    severity: "watch",
    status: "new",
    confidence: 0.74,
    owner: { th: "สาธารณสุขเมือง", en: "City public health" },
    recommendedAction: {
      th: "เพิ่มน้ำดื่ม ร่มเงา และการสื่อสารกับสถานพยาบาล",
      en: "Add water, shade, and hospital-facing advisories."
    },
    dueAt: "2026-03-12T10:00:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["open-meteo-weather"],
    layerIds: ["weather", "projects"]
  },
  {
    id: "decision-khonkaen-banhaet-logistics",
    citySlug: "khon-kaen",
    districtSlug: "ban-haet",
    domainSlug: "economy",
    title: {
      th: "เช็กเส้นทางโลจิสติกส์เกษตรบ้านแฮดก่อนรอบขนส่งเย็น",
      en: "Check Ban Haet agri-logistics routes before evening dispatch"
    },
    summary: {
      th: "สินค้าการเกษตรควรมีเส้นทางสำรองและจุดบริการดิจิทัลพร้อมใช้งาน",
      en: "Agri shipments need backup routing and reliable digital-service points."
    },
    severity: "monitor",
    status: "ready",
    confidence: 0.67,
    owner: { th: "เกษตรและพาณิชย์จังหวัด", en: "Provincial agriculture and commerce" },
    recommendedAction: {
      th: "ยืนยันผู้ประสานงานขนส่งและแจ้งจุดบริการที่เปิดใช้งาน",
      en: "Confirm route coordinators and active service points."
    },
    dueAt: "2026-03-12T14:00:00.000Z",
    updatedAt: seededAt,
    sourceIds: ["data-go-th"],
    layerIds: ["agriculture", "economy", "projects"]
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
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Earth observation layers are online for rainfall, vegetation, aerosol, and night-light context."
  },
  {
    id: "itic-traffic",
    name: "iTIC / Longdo Traffic",
    category: "geospatial",
    url: "https://traffic.longdo.com",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Bangkok traffic events and camera-linked signals are ready for operational map overlays."
  },
  {
    id: "public-cctv",
    name: "Public CCTV Cameras",
    category: "geospatial",
    url: "https://camera.longdo.com/feed/?command=json",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Pak Kret municipal cameras and iTIC / Longdo public traffic cameras are available for the live map layer."
  },
  {
    id: "nasa-gibs",
    name: "NASA GIBS WMTS",
    category: "geospatial",
    url: "https://gibs.earthdata.nasa.gov",
    freshnessStatus: "live",
    lastCheckedAt: seededAt,
    message: "Global Imagery Browse Services provides satellite tile overlays for aerosol, precipitation, and vegetation context."
  },
  {
    id: "sentinel-hub-process",
    name: "Sentinel Hub Process API",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Credential-ready raster API for Thailand true-color, NDVI, NDWI, flood, and haze composites over arbitrary AOIs."
  },
  {
    id: "sentinel-hub-statistics",
    name: "Sentinel Hub Statistical API",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Statistical.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Credential-ready stats API for Thai provinces, basins, and city polygons without downloading full scenes."
  },
  {
    id: "sentinel-hub-ogc",
    name: "Sentinel Hub OGC / WMTS",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/OGC.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Credential-ready WMS/WMTS access for GIS and web-map overlays when a configured instance is available."
  },
  {
    id: "copernicus-stac",
    name: "Copernicus Data Space STAC",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/newSTACcatalogue.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Primary catalogue for finding Thailand scenes by bbox, datetime, and collection. Prefer this over deprecated OpenSearch."
  },
  {
    id: "copernicus-odata",
    name: "Copernicus Data Space OData",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/OData.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Direct product-search and download API for raw Copernicus scenes, subscriptions, and catalogue automation."
  },
  {
    id: "copernicus-openeo",
    name: "Copernicus Data Space openEO",
    category: "geospatial",
    url: "https://documentation.dataspace.copernicus.eu/APIs/openEO/openEO.html",
    freshnessStatus: "manual",
    lastCheckedAt: seededAt,
    message: "Server-side EO processing for Thailand-scale datacubes, time-series analytics, and batch exports."
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
    active: true,
    color: "#ef4444",
    kind: "signal",
    defaultViews: ["bangkok", "national"],
    sourceId: "itic-traffic",
    legendLabel: "Traffic",
    zIndex: 45
  },
  {
    id: "cctv-cameras",
    label: { th: "กล้อง CCTV สาธารณะ", en: "Public CCTV" },
    active: false,
    color: "#34d399",
    kind: "signal",
    defaultViews: ["bangkok"],
    sourceId: "public-cctv",
    legendLabel: "CCTV",
    zIndex: 50
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
  "Bangkok Shared Places Map",
  "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.838530327896784%2C100.64165750169461&z=11",
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
const iticTrafficMeta = seedMeta("iTIC / Longdo Traffic", "https://traffic.longdo.com", "live");

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
        properties: {
          city: "Chiang Mai",
          region: "North",
          population: 1270000,
          smartFocus: "Air quality, livability, and cultural innovation."
        },
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
        properties: {
          city: "Khon Kaen",
          region: "Northeast",
          population: 412000,
          smartFocus: "Regional mobility, public services, and civic innovation."
        },
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
        properties: {
          city: "Phuket",
          region: "South",
          population: 417000,
          smartFocus: "Tourism, mobility, and resilient island infrastructure."
        },
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
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
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
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
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
          district: "Bang Na",
          districtSlug: "bang-na",
          dataset: "fallback"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-4",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.4931, 13.7526],
        title: "Rattanakosin Civic Loop",
        description: "Historic-core walking and public-space waypoint.",
        properties: {
          city: "Bangkok",
          district: "Phra Nakhon",
          districtSlug: "phra-nakhon",
          dataset: "curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-5",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5134, 13.7367],
        title: "Chao Phraya Riverfront",
        description: "River-edge mobility and public-realm highlight.",
        properties: {
          city: "Bangkok",
          district: "Thon Buri",
          districtSlug: "thon-buri",
          dataset: "curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-6",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5383, 13.7658],
        title: "Phaya Thai Civic Spine",
        description: "Transit-linked civic services cluster.",
        properties: {
          city: "Bangkok",
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
          dataset: "curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-7",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.5814, 13.7219],
        title: "Bang Na Learning Edge",
        description: "Eastern Bangkok learning and innovation waypoint.",
        properties: {
          city: "Bangkok",
          district: "Bang Na",
          districtSlug: "bang-na",
          dataset: "curated"
        },
        source: bangkokPlaceMeta
      },
      {
        id: "bangkok-place-8",
        layerId: "bangkok-passages",
        geometryType: "Point",
        coordinates: [100.4662, 13.7421],
        title: "Thonburi Canal Watch",
        description: "Canal-side community signal and local access node.",
        properties: {
          city: "Bangkok",
          district: "Thon Buri",
          districtSlug: "thon-buri",
          dataset: "curated"
        },
        source: bangkokPlaceMeta
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
          district: "Thon Buri",
          districtSlug: "thon-buri",
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
          district: "Mueang Khon Kaen",
          districtSlug: "mueang-khon-kaen",
          status: "active",
          focus: "agri-services"
        },
        source: dataToPolicyMeta
      },
      {
        id: "projects-chiangmai-campus",
        layerId: "projects",
        geometryType: "Point",
        coordinates: [98.9515, 18.8054],
        title: "Northern civic innovation campus",
        description: "University and city sandbox for livability and climate response pilots.",
        properties: {
          city: "Chiang Mai",
          district: "Mueang Chiang Mai",
          districtSlug: "mueang-chiang-mai",
          status: "watch",
          focus: "living-lab"
        },
        source: dataToPolicyMeta
      }
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
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
          mentions: 18,
          theme: "governance"
        },
        source: gdeltSignalsMeta
      },
      {
        id: "news-chiangmai-air",
        layerId: "news",
        geometryType: "Point",
        coordinates: [98.9853, 18.7883],
        title: "Chiang Mai air-quality watch",
        description: "Recurring environmental coverage spike around haze and livability.",
        properties: {
          city: "Chiang Mai",
          district: "Mueang Chiang Mai",
          districtSlug: "mueang-chiang-mai",
          mentions: 11,
          theme: "environment"
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
        id: "news-phuket-tourism",
        layerId: "news",
        geometryType: "Point",
        coordinates: [98.3923, 7.8804],
        title: "Phuket tourism operations watch",
        description: "Service-quality and visitor-flow stories remain active.",
        properties: {
          city: "Phuket",
          district: "Kathu",
          districtSlug: "kathu",
          mentions: 7,
          theme: "living"
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
      {
        id: "agriculture-chiangmai-highland",
        layerId: "agriculture",
        geometryType: "Point",
        coordinates: [98.935, 18.86],
        title: "Northern highland farming node",
        description: "Highland horticulture and watershed-dependent farming cluster.",
        properties: {
          crop: "highland-mixed",
          intensity: "cluster"
        },
        source: esaEodashboardMeta
      }
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
        id: "land-use-phuket-tourism-strip",
        layerId: "land-use",
        geometryType: "LineString",
        coordinates: [
          [98.24, 8.05],
          [98.32, 7.96],
          [98.37, 7.88],
          [98.42, 7.79]
        ],
        title: "Phuket tourism strip",
        description: "Coastal service corridor where tourism intensity shapes land use.",
        properties: {
          classification: "tourism-coast",
          changeSignal: "seasonal"
        },
        source: undpDataMeta
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
    layerId: "itic-traffic",
    updatedAt: seededAt,
    bounds: [13.66, 100.44, 13.85, 100.67],
    source: iticTrafficMeta,
    features: [
      {
        id: "itic-rama9-congestion",
        layerId: "itic-traffic",
        geometryType: "Point",
        coordinates: [100.5712, 13.7562],
        title: "Rama IX inbound congestion watch",
        description: "Live probe-traffic watchpoint covering the Rama IX eastbound approach.",
        properties: {
          city: "Bangkok",
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
          kind: "traffic",
          severity: "watch",
          speedKph: 18
        },
        source: iticTrafficMeta
      },
      {
        id: "itic-dindaeng-junction",
        layerId: "itic-traffic",
        geometryType: "Point",
        coordinates: [100.5478, 13.7709],
        title: "Din Daeng junction traffic event",
        description: "Traffic incident cluster affecting interchange access and peak-hour delays.",
        properties: {
          city: "Bangkok",
          district: "Pathum Wan",
          districtSlug: "pathum-wan",
          kind: "incident",
          severity: "high",
          speedKph: 12
        },
        source: iticTrafficMeta
      },
      {
        id: "itic-chaopraya-bridge",
        layerId: "itic-traffic",
        geometryType: "Point",
        coordinates: [100.5034, 13.7241],
        title: "Chao Phraya bridge flow check",
        description: "Bridge approach watchpoint used to track cross-river travel pressure.",
        properties: {
          city: "Bangkok",
          district: "Thon Buri",
          districtSlug: "thon-buri",
          kind: "traffic",
          severity: "watch",
          speedKph: 21
        },
        source: iticTrafficMeta
      },
      {
        id: "itic-bangna-corridor",
        layerId: "itic-traffic",
        geometryType: "Point",
        coordinates: [100.6121, 13.6678],
        title: "Bang Na logistics corridor",
        description: "Freight and airport-linked corridor watchpoint for outbound cargo movement.",
        properties: {
          city: "Bangkok",
          district: "Bang Na",
          districtSlug: "bang-na",
          kind: "freight",
          severity: "moderate",
          speedKph: 27
        },
        source: iticTrafficMeta
      }
    ]
  },
  {
    layerId: "weather",
    updatedAt: seededAt,
    bounds: [7.0, 98.2, 18.9, 102.9],
    source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live"),
    features: [
      {
        id: "weather-bangkok",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok",
        description: "City weather watchpoint",
        properties: { city: "Bangkok", temperatureC: 32, humidity: 60, windKph: 10, region: "Central" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-chiang-mai",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [98.9853, 18.7883],
        title: "Chiang Mai",
        description: "City weather watchpoint",
        properties: { city: "Chiang Mai", temperatureC: 29, humidity: 52, windKph: 8, region: "North" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-khon-kaen",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [102.8236, 16.4322],
        title: "Khon Kaen",
        description: "City weather watchpoint",
        properties: { city: "Khon Kaen", temperatureC: 31, humidity: 48, windKph: 12, region: "Northeast" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-phuket",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [98.3923, 7.8804],
        title: "Phuket",
        description: "City weather watchpoint",
        properties: { city: "Phuket", temperatureC: 30, humidity: 74, windKph: 15, region: "South" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-chon-buri",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.9847, 13.3611],
        title: "Chon Buri",
        description: "Industrial-coast weather watchpoint",
        properties: { city: "Chon Buri", temperatureC: 33, humidity: 68, windKph: 14, region: "East" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-hat-yai",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [100.4747, 7.0084],
        title: "Hat Yai",
        description: "Southern urban weather watchpoint",
        properties: { city: "Hat Yai", temperatureC: 31, humidity: 79, windKph: 11, region: "South" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-korat",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [102.0978, 14.9799],
        title: "Nakhon Ratchasima",
        description: "Plateau weather watchpoint",
        properties: { city: "Nakhon Ratchasima", temperatureC: 34, humidity: 43, windKph: 16, region: "Northeast" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      },
      {
        id: "weather-lampang",
        layerId: "weather",
        geometryType: "Point",
        coordinates: [99.4908, 18.2888],
        title: "Lampang",
        description: "Northern inland weather watchpoint",
        properties: { city: "Lampang", temperatureC: 33, humidity: 46, windKph: 9, region: "North" },
        source: seedMeta("Open-Meteo Forecast", "https://open-meteo.com/en/docs", "live")
      }
    ]
  },
  {
    layerId: "pollution",
    updatedAt: seededAt,
    bounds: [7.0, 98.2, 18.9, 102.9],
    source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live"),
    features: [
      {
        id: "pollution-bangkok",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.5018, 13.7563],
        title: "Bangkok",
        description: "City AQI watchpoint",
        properties: { city: "Bangkok", aqi: 57, pm25: 11, pm10: 12, region: "Central" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-chiang-mai",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [98.9853, 18.7883],
        title: "Chiang Mai",
        description: "City AQI watchpoint",
        properties: { city: "Chiang Mai", aqi: 88, pm25: 29, pm10: 40, region: "North" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-khon-kaen",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [102.8236, 16.4322],
        title: "Khon Kaen",
        description: "City AQI watchpoint",
        properties: { city: "Khon Kaen", aqi: 49, pm25: 9, pm10: 14, region: "Northeast" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-phuket",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [98.3923, 7.8804],
        title: "Phuket",
        description: "City AQI watchpoint",
        properties: { city: "Phuket", aqi: 34, pm25: 6, pm10: 9, region: "South" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-chon-buri",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.9847, 13.3611],
        title: "Chon Buri",
        description: "Industrial-coast AQI watchpoint",
        properties: { city: "Chon Buri", aqi: 63, pm25: 18, pm10: 27, region: "East" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-hat-yai",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [100.4747, 7.0084],
        title: "Hat Yai",
        description: "Southern AQI watchpoint",
        properties: { city: "Hat Yai", aqi: 42, pm25: 8, pm10: 13, region: "South" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-korat",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [102.0978, 14.9799],
        title: "Nakhon Ratchasima",
        description: "Plateau AQI watchpoint",
        properties: { city: "Nakhon Ratchasima", aqi: 69, pm25: 22, pm10: 32, region: "Northeast" },
        source: seedMeta("Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api", "live")
      },
      {
        id: "pollution-lampang",
        layerId: "pollution",
        geometryType: "Point",
        coordinates: [99.4908, 18.2888],
        title: "Lampang",
        description: "Northern AQI watchpoint",
        properties: { city: "Lampang", aqi: 78, pm25: 25, pm10: 35, region: "North" },
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

export const auditTrail: AuditEventRecord[] = [
  {
    id: "audit-1",
    timestamp: seededAt,
    actor: "ops.console",
    action: "publish",
    entityType: "briefing",
    entityId: "briefing-1",
    detail: "Published the morning operating brief.",
    status: "manual"
  },
  {
    id: "audit-2",
    timestamp: seededAt,
    actor: "sync.scheduler",
    action: "sync",
    entityType: "source-sync",
    entityId: "google-news-rss",
    detail: "Completed news and signal sync without fallback.",
    status: "success"
  },
  {
    id: "audit-3",
    timestamp: seededAt,
    actor: "sync.scheduler",
    action: "sync",
    entityType: "source-sync",
    entityId: "open-meteo-air",
    detail: "Refreshed air-quality watch feeds for tracked cities.",
    status: "success"
  },
  {
    id: "audit-4",
    timestamp: seededAt,
    actor: "ops.editor",
    action: "update",
    entityType: "project",
    entityId: "bangkok-flood-command",
    detail: "Adjusted project milestone language for district rollout.",
    status: "manual"
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

export const commandCenterMetrics: CommandCenterMetric[] = [
  {
    id: "ops-live",
    label: { th: "พื้นผิวปฏิบัติการสด", en: "Live Ops Surfaces" },
    value: "18",
    detail: {
      th: "รวมแผนที่หลัก กล้อง เซนเซอร์ บอร์ด และชั้น EO ที่พร้อมใช้งานหรือพร้อมต่อ",
      en: "Map layers, camera lanes, sensor rails, boards, and EO surfaces ready now or staged for connection."
    },
    tone: "positive"
  },
  {
    id: "connectors",
    label: { th: "ตัวเชื่อม API", en: "API Connectors" },
    value: "10",
    detail: {
      th: "ดึงแนวคิดและ endpoint จาก Smart City, Phuket, Geopolitics, และ Tech Monitor",
      en: "Pulls endpoint ideas from the Smart City, Phuket, Geopolitics, and Tech Monitor projects."
    },
    tone: "positive"
  },
  {
    id: "field-signals",
    label: { th: "สัญญาณภาคสนาม", en: "Field Signals" },
    value: "9",
    detail: {
      th: "กล้อง จราจร คนเดิน และ drainage watch ถูกจัดเป็น schema เดียวกัน",
      en: "Camera, traffic, pedestrian, and drainage watch signals share one operational schema."
    },
    tone: "warning"
  },
  {
    id: "reporting-loop",
    label: { th: "วงรอบรายงาน", en: "Reporting Loop" },
    value: "4",
    detail: {
      th: "เปิดทางให้ citizen reporting, dispatch, analytics, และ executive reporting เชื่อมต่อในสายเดียว",
      en: "Leaves room for citizen reporting, dispatch, analytics, and executive reporting in the same loop."
    },
    tone: "neutral"
  }
];

export const commandConnectors: CommandConnector[] = [
  {
    id: "smart-city-overview",
    title: "Overview snapshot",
    project: "Muang Thong Thani Monitor",
    category: "platform",
    status: "live",
    route: "/api/overview",
    cadence: "5 min",
    auth: "internal",
    detail: {
      th: "แกนสรุปภาพรวมของหน้าจอหลัก ใช้สำหรับ pulse, city focus, และ command narration",
      en: "Core summary surface for pulse, city focus, and command narration."
    },
    systems: ["map", "briefing", "command"]
  },
  {
    id: "smart-city-satellite",
    title: "Satellite digest",
    project: "Muang Thong Thani Monitor",
    category: "earth-observation",
    status: "live",
    route: "/api/satellite/digest",
    cadence: "5 min",
    auth: "oauth-ready",
    detail: {
      th: "ใช้เป็นฐาน EO สำหรับฝน ความร้อน พืชพรรณ และ scene freshness",
      en: "EO backbone for rainfall, heat, vegetation, and scene freshness."
    },
    systems: ["eo", "weather", "resilience"]
  },
  {
    id: "smart-city-media",
    title: "Media feeds",
    project: "Muang Thong Thani Monitor",
    category: "media",
    status: "live",
    route: "/api/media/feeds",
    cadence: "5 min",
    auth: "internal",
    detail: {
      th: "ช่องทางถ่ายทอดและ feed ภายนอกสำหรับอ่านผลกระทบด้าน narrative",
      en: "Broadcast and external feed surface for narrative pressure and public attention."
    },
    systems: ["media", "signal wall"]
  },
  {
    id: "phuket-convergence",
    title: "Convergence engine",
    project: "Phuket Dashboard",
    category: "analytics",
    status: "ready",
    route: "/api/intelligence/convergence",
    cadence: "2 min",
    auth: "server-side",
    detail: {
      th: "logic รวม incident, weather, movement, และ markets แบบ corridor-aware พร้อมย้ายมาปรับใช้",
      en: "Corridor-aware intelligence logic that fuses incidents, weather, movement, and markets."
    },
    systems: ["fusion", "alerts"]
  },
  {
    id: "phuket-flights",
    title: "Flight paths",
    project: "Phuket Dashboard",
    category: "mobility",
    status: "ready",
    route: "/api/flights",
    cadence: "30 s",
    auth: "server-side",
    detail: {
      th: "pattern การดึงข้อมูล OpenSky พร้อมใช้กับ traffic and event ingress ของพื้นที่จัดงาน",
      en: "OpenSky-driven traffic ingress logic ready to adapt for event and venue access."
    },
    systems: ["mobility", "arrival watch"]
  },
  {
    id: "phuket-movements",
    title: "Movement traces",
    project: "Phuket Dashboard",
    category: "mobility",
    status: "ready",
    route: "/api/movements",
    cadence: "2 min",
    auth: "server-side",
    detail: {
      th: "movement heatline สำหรับ hub-to-hub flows และ crowd redistribution",
      en: "Movement trace surface for hub-to-hub flows and crowd redistribution."
    },
    systems: ["crowd", "routing"]
  },
  {
    id: "geopolitics-live-tv",
    title: "Live TV bridge",
    project: "Geopolitics Dashboard",
    category: "media",
    status: "pilot",
    route: "/api/live-tv",
    cadence: "on demand",
    auth: "server-side",
    detail: {
      th: "โมเดลสำหรับดึงช่องถ่ายทอดสดเข้ามาเป็น media wall ใน command center",
      en: "Bridge pattern for turning live channels into a media wall inside the command center."
    },
    systems: ["media wall", "executive brief"]
  },
  {
    id: "geopolitics-data-catalog",
    title: "Data catalog browser",
    project: "Geopolitics Dashboard",
    category: "platform",
    status: "pilot",
    route: "/api/data/catalog",
    cadence: "manual",
    auth: "internal",
    detail: {
      th: "ฐาน browse-able catalog สำหรับเปิด table และ export data ภายหลัง",
      en: "Browseable data catalog pattern for opening tables and exports later."
    },
    systems: ["catalog", "reporting"]
  },
  {
    id: "tech-copernicus-preview",
    title: "Copernicus preview",
    project: "Tech Monitor",
    category: "earth-observation",
    status: "ready",
    route: "/api/copernicus/preview",
    cadence: "on demand",
    auth: "server-side",
    detail: {
      th: "preview pipeline สำหรับ live EO thumbnails และ source switching",
      en: "Preview pipeline for live EO thumbnails and runtime source switching."
    },
    systems: ["eo", "thumbnail rail"]
  },
  {
    id: "city-reporter-bridge",
    title: "Reporter bridge",
    project: "City Reporter Bot",
    category: "reporting",
    status: "planned",
    cadence: "event driven",
    auth: "token bridge",
    detail: {
      th: "สงวนช่องทางไว้ให้เชื่อม ticket intake, assignment, SLA, และ field closure ในภายหลัง",
      en: "Reserved for ticket intake, assignment, SLA, and field closure when the reporter bridge is wired in."
    },
    systems: ["tickets", "dispatch", "reporting"]
  }
];

export const cameraEvents: CameraEventSample[] = [
  {
    id: "camera-impact-dropoff",
    cameraId: "MTT-CAM-01",
    zone: { th: "Impact Challenger drop-off", en: "Impact Challenger drop-off" },
    detection: { th: "จอดแช่ผิดกฎหมาย", en: "Illegal Parking" },
    detail: {
      th: "รถจอดค้างในช่องรับส่งเกินเวลาที่กำหนดและเริ่มกีดขวางรถรับส่ง",
      en: "Vehicle dwell time passed the curb limit and is blocking the shuttle loop."
    },
    severity: "alert",
    status: { th: "ส่งต่อทีมจราจร", en: "Escalate to traffic team" },
    model: "Parking Vision v0.8",
    minutesAgo: 2,
    confidence: 0.97,
    targetLayers: ["itic-traffic", "projects"]
  },
  {
    id: "camera-beehive-incident",
    cameraId: "MTT-CAM-02",
    zone: { th: "Beehive connector", en: "Beehive connector" },
    detection: { th: "เหตุเฉี่ยวชนเล็กน้อย", en: "Minor Incident" },
    detail: {
      th: "พบการหยุดรถผิดปกติหลังฝนและ crowd movement เริ่มสะสม",
      en: "Short stop and spillback pattern suggest a minor roadside incident after rain."
    },
    severity: "watch",
    status: { th: "รอตรวจภาพย้อนหลัง", en: "Review clip" },
    model: "Incident Sense v0.5",
    minutesAgo: 6,
    confidence: 0.88,
    targetLayers: ["itic-traffic", "weather"]
  },
  {
    id: "camera-cosmo-sidewalk",
    cameraId: "MTT-CAM-03",
    zone: { th: "Cosmo Bazaar frontage", en: "Cosmo Bazaar frontage" },
    detection: { th: "คนล้นทางเท้า", en: "Pedestrian Spillover" },
    detail: {
      th: "พื้นที่ขายของล้นลงมาที่ทางเท้าและ crowd lane เริ่มเบียดแนวจอดรถ",
      en: "Pedestrian spillover is compressing the walkway and pushing movement into the curb lane."
    },
    severity: "watch",
    status: { th: "เตรียมผูกกับ reporter", en: "Match with reporter feed" },
    model: "Crowd Flow v0.4",
    minutesAgo: 11,
    confidence: 0.9,
    targetLayers: ["bangkok-passages", "itic-traffic"]
  },
  {
    id: "camera-p2-wrong-way",
    cameraId: "MTT-CAM-04",
    zone: { th: "P2 feeder road", en: "P2 feeder road" },
    detection: { th: "รถย้อนศร", en: "Wrong-way Vehicle" },
    detail: {
      th: "รถจักรยานยนต์เข้าผิดทิศในช่วงสัญญาณจราจรชะลอตัว",
      en: "Motorbike entered the feeder road against flow during a congestion wave."
    },
    severity: "alert",
    status: { th: "ส่งเข้าบอร์ดเหตุการณ์", en: "Send to incident board" },
    model: "Road Behavior v0.6",
    minutesAgo: 18,
    confidence: 0.95,
    targetLayers: ["itic-traffic", "weather", "disaster"]
  },
  {
    id: "camera-lakefront-smoke",
    cameraId: "MTT-CAM-05",
    zone: { th: "Lakefront gate", en: "Lakefront gate" },
    detection: { th: "ควัน / ความร้อนผิดปกติ", en: "Smoke / Thermal Alert" },
    detail: {
      th: "กลุ่มควันบางและแหล่งความร้อนเล็กถูกตั้งเป็น watch sample สำหรับเชื่อมระบบ EO ภายหลัง",
      en: "Light smoke and a small heat signature are staged as a future EO-linked watch sample."
    },
    severity: "stable",
    status: { th: "ตัวอย่างสำหรับต่อ EO", en: "EO-ready sample" },
    model: "Thermal Watch v0.3",
    minutesAgo: 27,
    confidence: 0.81,
    targetLayers: ["weather", "resilience", "disaster"]
  }
];

export const sensorFeeds: SensorFeedSample[] = [
  {
    id: "sensor-traffic-loop",
    label: { th: "ทางเข้า Challenger", en: "Challenger ingress" },
    zone: { th: "วงวนหน้า Challenger", en: "Challenger loop" },
    category: "traffic",
    status: "live",
    value: "84% load",
    detail: {
      th: "ใช้เป็นต้นแบบ traffic occupancy rail สำหรับรถรับส่งและ event ingress",
      en: "Prototype traffic occupancy rail for shuttle circulation and event ingress."
    },
    cadence: "30 s",
    sourceLabel: "ITIC / route watch",
    targetLayers: ["itic-traffic"]
  },
  {
    id: "sensor-parking-p2",
    label: { th: "P2 parking stack", en: "P2 parking stack" },
    zone: { th: "P2 feeder + queue", en: "P2 feeder + queue" },
    category: "parking",
    status: "ready",
    value: "61% full",
    detail: {
      th: "สงวน slot สำหรับนับ occupancy และรถค้างในลานจอด",
      en: "Reserved slot for occupancy counts and dwell detection in the parking field."
    },
    cadence: "60 s",
    sourceLabel: "ANPR / parking bus",
    targetLayers: ["itic-traffic", "projects"]
  },
  {
    id: "sensor-crowd-cosmo",
    label: { th: "Cosmo footfall", en: "Cosmo footfall" },
    zone: { th: "ทางเท้า Cosmo", en: "Cosmo frontage" },
    category: "crowd",
    status: "pilot",
    value: "1.4x baseline",
    detail: {
      th: "ใช้เป็นจุดวาง logic สำหรับ crowd density และ spillover alerts",
      en: "Staging point for crowd density and spillover alerts."
    },
    cadence: "45 s",
    sourceLabel: "Vision counter",
    targetLayers: ["bangkok-passages", "itic-traffic"]
  },
  {
    id: "sensor-rain-drain",
    label: { th: "Drainage watch", en: "Drainage watch" },
    zone: { th: "แนวถนนรับน้ำ", en: "Primary drainage corridor" },
    category: "water",
    status: "ready",
    value: "12 mm / hr",
    detail: {
      th: "เตรียมรับ sensor น้ำ ฝน และ low-point alarms ให้อ่านคู่กับ EO ฝน",
      en: "Prepared for rainfall, water-level, and low-point alarms alongside EO rain context."
    },
    cadence: "5 min",
    sourceLabel: "Drain / weather bus",
    targetLayers: ["weather", "water", "jaxa-rainfall"]
  },
  {
    id: "sensor-air-lakefront",
    label: { th: "Lakefront air watch", en: "Lakefront air watch" },
    zone: { th: "Lakefront gate", en: "Lakefront gate" },
    category: "air",
    status: "planned",
    value: "AQI slot",
    detail: {
      th: "ช่องว่างสำหรับ air node ระดับพื้นที่และ thermal correlation",
      en: "Reserved slot for local air nodes and thermal correlation."
    },
    cadence: "5 min",
    sourceLabel: "Air node / thermal bus",
    targetLayers: ["weather", "resilience", "eo-aerosol"]
  }
];

export const reporterCases: ReporterCaseSample[] = [
  {
    id: "report-road",
    ticketNumber: "SCTH-4921",
    problemType: { th: "ถนน", en: "Road" },
    description: {
      th: "หลุมถนนตรงแนวรถรับส่งหน้า Challenger Hall ทำให้รถเบี่ยงหลบกะทันหัน",
      en: "Road surface damage near the Challenger shuttle lane is causing sudden swerves."
    },
    locationText: "Impact Challenger service lane",
    urgency: "high",
    status: "assigned",
    teamName: "Road Ops",
    staffName: "Field Team A",
    aiSummary: {
      th: "AI summary: พื้นผิวเสียหายและมีความเสี่ยงต่อรถที่ชะลอรับส่ง",
      en: "AI summary: damaged pavement with elevated risk for drop-off traffic."
    },
    minutesAgo: 14,
    targetLayers: ["itic-traffic", "projects"]
  },
  {
    id: "report-flood",
    ticketNumber: "SCTH-4927",
    problemType: { th: "น้ำท่วมขัง", en: "Standing Water" },
    description: {
      th: "น้ำเริ่มขังตรงแนวทางเดินระหว่าง Hall กับ Beehive หลังฝนช่วงเย็น",
      en: "Water is beginning to pool along the walkway between the hall and Beehive after the evening rain."
    },
    locationText: "Beehive pedestrian connector",
    urgency: "high",
    status: "received",
    teamName: "Drainage Ops",
    staffName: "Pending assignment",
    aiSummary: {
      th: "AI summary: เสี่ยงต่อการลื่นล้มและ slow-moving crowd lane",
      en: "AI summary: slip risk and slowing pedestrian flow."
    },
    minutesAgo: 9,
    targetLayers: ["weather", "water", "jaxa-rainfall"]
  },
  {
    id: "report-sidewalk",
    ticketNumber: "SCTH-4932",
    problemType: { th: "ทางเท้า", en: "Sidewalk" },
    description: {
      th: "แผงค้าชั่วคราวเบียดทางเดินและทำให้คนลงมาใช้ไหล่ทาง",
      en: "Temporary vending is reducing sidewalk width and forcing pedestrians into the curb lane."
    },
    locationText: "Cosmo Bazaar frontage",
    urgency: "medium",
    status: "in_progress",
    teamName: "Public Space Ops",
    staffName: "Field Team C",
    aiSummary: {
      th: "AI summary: ควรจับคู่กับ crowd detection และ curbside loading",
      en: "AI summary: should be matched with crowd detection and curbside loading."
    },
    matchedCameraId: "MTT-CAM-03",
    minutesAgo: 22,
    targetLayers: ["bangkok-passages", "itic-traffic"]
  },
  {
    id: "report-lighting",
    ticketNumber: "SCTH-4939",
    problemType: { th: "แสงสว่าง", en: "Lighting" },
    description: {
      th: "ไฟส่องสว่างแนวทางเดินด้านทะเลสาบดับเป็นช่วง",
      en: "Walkway lighting along the lakefront is intermittently out."
    },
    locationText: "Lakefront gate",
    urgency: "low",
    status: "completed",
    teamName: "Facilities",
    staffName: "Night Team",
    aiSummary: {
      th: "AI summary: ปิดงานแล้วแต่ควรเก็บเป็น baseline สำหรับ safety audit",
      en: "AI summary: closed, but useful as baseline for future safety audits."
    },
    minutesAgo: 38,
    targetLayers: ["projects", "resilience"]
  }
];

export const workflowBoards: WorkflowBoardStatus[] = [
  {
    id: "vision-board",
    title: { th: "Vision inference board", en: "Vision Inference Board" },
    status: "live",
    metric: "5 lanes",
    detail: {
      th: "illegal parking, wrong-way, crowd spillover, และ thermal watch พร้อมต่อ inference service",
      en: "Illegal parking, wrong-way, crowd spillover, and thermal watch lanes are ready for inference-service wiring."
    }
  },
  {
    id: "reporter-board",
    title: { th: "City reporter intake", en: "City Reporter Intake" },
    status: "watch",
    metric: "4 tickets",
    detail: {
      th: "ยึด status model เดียวกับ city-reporter workflow: received, assigned, in_progress, completed",
      en: "Uses the same status model as the city-reporter workflow: received, assigned, in_progress, completed."
    }
  },
  {
    id: "merge-board",
    title: { th: "Cross-system match board", en: "Cross-System Match Board" },
    status: "pilot",
    metric: "1 match",
    detail: {
      th: "เตรียมรวม camera events, sensors, และ citizen reports เป็นเคสเดียว",
      en: "Prepared to merge camera events, sensors, and citizen reports into one operational case."
    }
  },
  {
    id: "dispatch-board",
    title: { th: "Command dispatch board", en: "Command Dispatch Board" },
    status: "stable",
    metric: "handoff",
    detail: {
      th: "ปลายทางสำหรับส่ง action queue ไปทีม field ops และ reporting layer",
      en: "Destination handoff for action queues into field ops and reporting."
    }
  }
];

export const fusionQueue: FusionQueueItem[] = [
  {
    id: "fusion-crowd",
    title: { th: "Crowd obstruction + reporter ticket", en: "Crowd obstruction + reporter ticket" },
    detail: {
      th: "SCTH-4932 จับคู่กับ MTT-CAM-03 เพื่อทำเคสทางเท้าเดียวกัน",
      en: "SCTH-4932 is matched with MTT-CAM-03 as one sidewalk case."
    },
    confidence: 0.94
  },
  {
    id: "fusion-water",
    title: { th: "Drainage alert + citizen flood report", en: "Drainage alert + citizen flood report" },
    detail: {
      th: "ช่องทางเดิน Beehive ถูกรวมเข้า event bundle เดียวกับ rain watch",
      en: "The Beehive walkway report is bundled with the same rain watch event."
    },
    confidence: 0.88
  },
  {
    id: "fusion-thermal",
    title: { th: "Thermal watch + safety audit", en: "Thermal watch + safety audit" },
    detail: {
      th: "ใช้ smoke / thermal sample เป็น baseline ก่อนต่อระบบ EO และ field audit",
      en: "Uses the smoke and thermal sample as a baseline ahead of EO and field-audit integration."
    },
    confidence: 0.83
  }
];

export const expansionTracks: ExpansionTrack[] = [
  {
    id: "track-ingest",
    title: { th: "Ingest backbone", en: "Ingest Backbone" },
    stage: "base",
    detail: {
      th: "ฐานกลางสำหรับกล้อง เซนเซอร์ map overlays และ API connectors ที่มี schema เดียวกัน",
      en: "Shared backbone for cameras, sensor buses, map overlays, and API connectors using one schema."
    },
    systems: ["camera bus", "sensor bus", "source registry"]
  },
  {
    id: "track-reporting",
    title: { th: "Reporting + dispatch", en: "Reporting + Dispatch" },
    stage: "next",
    detail: {
      th: "ต่อ ticket bridge, assignment queue, และ SLA reporting ให้ใช้ data fabric เดียวกับ command screen",
      en: "Wire the ticket bridge, assignment queue, and SLA reporting to the same command-screen data fabric."
    },
    systems: ["reporter bridge", "dispatch", "sla board"]
  },
  {
    id: "track-analytics",
    title: { th: "Analytics + executive room", en: "Analytics + Executive Room" },
    stage: "future",
    detail: {
      th: "ขยายไปสู่ automated reporting, boardroom summaries, และ cross-city benchmarking",
      en: "Expand into automated reporting, boardroom summaries, and cross-city benchmarking."
    },
    systems: ["report generator", "executive brief", "cross-city compare"]
  }
];

export function createCommandCenterSnapshot(): CommandCenterSnapshot {
  return {
    updatedAt: new Date().toISOString(),
    zoneLabel: { th: "เมืองทองธานี", en: "Muang Thong Thani" },
    mission: {
      th: "Command center สำหรับพื้นที่จัดงาน เมือง และระบบภาคสนามที่ต้องต่อขยายได้",
      en: "A command center for venue-scale city operations with room to grow into field-system integration."
    },
    screenMode: {
      th: "ออกแบบให้ข้อมูลแน่น อ่านจากระยะไกล และขยายต่อไปยังกล้อง เซนเซอร์ และระบบรายงานได้",
      en: "Designed for dense long-distance readability with space for cameras, sensors, and future reporting systems."
    },
    metrics: cloneSeed(commandCenterMetrics),
    connectors: cloneSeed(commandConnectors),
    cameraEvents: cloneSeed(cameraEvents),
    sensorFeeds: cloneSeed(sensorFeeds),
    reporterCases: cloneSeed(reporterCases),
    workflowBoards: cloneSeed(workflowBoards),
    fusionQueue: cloneSeed(fusionQueue),
    expansionTracks: cloneSeed(expansionTracks)
  };
}

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

export const publicCctvCameras: PublicCctvCamera[] = [
  { id: "pk-001", cameraId: "CAMPK001", label: { th: "แจ้งวัฒนะ - จัสมินบิลด์ 1", en: "Chaeng Watthana - Jasmine Bldg 1" }, source: "Pak Kret Municipality", lat: 13.905518, lon: 100.521136, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK001_thumb.jpg", status: "live", zone: "chaeng-watthana" },
  { id: "pk-002", cameraId: "CAMPK002", label: { th: "แจ้งวัฒนะ - จัสมินบิลด์ 2", en: "Chaeng Watthana - Jasmine Bldg 2" }, source: "Pak Kret Municipality", lat: 13.905687, lon: 100.521404, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK002_thumb.jpg", status: "live", zone: "chaeng-watthana" },
  { id: "pk-003", cameraId: "CAMPK003", label: { th: "สี่แยกปากเกร็ด 1", en: "Pak Kret 5-Way Intersection 1" }, source: "Pak Kret Municipality", lat: 13.907712, lon: 100.503948, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK003_thumb.jpg", status: "live", zone: "pak-kret-junction" },
  { id: "pk-004", cameraId: "CAMPK004", label: { th: "สี่แยกปากเกร็ด 2", en: "Pak Kret 5-Way Intersection 2" }, source: "Pak Kret Municipality", lat: 13.907757, lon: 100.504076, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK004_thumb.jpg", status: "live", zone: "pak-kret-junction" },
  { id: "pk-005", cameraId: "CAMPK005", label: { th: "สะพานพระราม 4", en: "Rama IV Bridge" }, source: "Pak Kret Municipality", lat: 13.912293, lon: 100.497643, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK005_thumb.jpg", status: "live", zone: "riverside" },
  { id: "pk-006", cameraId: "CAMPK006", label: { th: "แจ้งวัฒนะ - เทศบาลปากเกร็ด", en: "Chaeng Watthana - Pak Kret Municipality" }, source: "Pak Kret Municipality", lat: 13.912173, lon: 100.497877, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK006_thumb.jpg", status: "live", zone: "pak-kret-office" },
  { id: "pk-007", cameraId: "CAMPK007", label: { th: "ศูนย์ CCTV ตลาด", en: "Market Area CCTV Center" }, source: "Pak Kret Municipality", lat: 13.912308, lon: 100.497447, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK007_thumb.jpg", status: "live", zone: "market" },
  { id: "pk-008", cameraId: "CAMPK008", label: { th: "ป้อม ตร. สวนสมเด็จ 1", en: "Suan Somdet Police Booth 1" }, source: "Pak Kret Municipality", lat: 13.939757, lon: 100.541733, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK008_thumb.jpg", status: "live", zone: "suan-somdet" },
  { id: "pk-009", cameraId: "CAMPK009", label: { th: "ป้อม ตร. สวนสมเด็จ 2", en: "Suan Somdet Police Booth 2" }, source: "Pak Kret Municipality", lat: 13.939959, lon: 100.542080, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK009_thumb.jpg", status: "live", zone: "suan-somdet" },
  { id: "pk-010", cameraId: "CAMPK010", label: { th: "ป้อม ตร. สวนสมเด็จ 3", en: "Suan Somdet Police Booth 3" }, source: "Pak Kret Municipality", lat: 13.940246, lon: 100.542535, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK010_thumb.jpg", status: "live", zone: "suan-somdet" },
  { id: "pk-011", cameraId: "CAMPK011", label: { th: "แยกคลองประปา 1", en: "Khlong Prapa Intersection 1" }, source: "Pak Kret Municipality", lat: 13.895543, lon: 100.554028, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK011_thumb.jpg", status: "live", zone: "khlong-prapa" },
  { id: "pk-012", cameraId: "CAMPK012", label: { th: "แยกคลองประปา 2", en: "Khlong Prapa Intersection 2" }, source: "Pak Kret Municipality", lat: 13.895543, lon: 100.554135, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK012_thumb.jpg", status: "live", zone: "khlong-prapa" },
  { id: "pk-013", cameraId: "CAMPK013", label: { th: "แยกคลองประปา 3", en: "Khlong Prapa Intersection 3" }, source: "Pak Kret Municipality", lat: 13.895544, lon: 100.554242, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK013_thumb.jpg", status: "live", zone: "khlong-prapa" },
  { id: "pk-014", cameraId: "CAMPK014", label: { th: "ศูนย์รีไซเคิลชุมชน 1", en: "Community Recycling Center 1" }, source: "Pak Kret Municipality", lat: 13.889616, lon: 100.517738, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK014_thumb.jpg", status: "live", zone: "community" },
  { id: "pk-015", cameraId: "CAMPK015", label: { th: "ศูนย์รีไซเคิลชุมชน 2", en: "Community Recycling Center 2" }, source: "Pak Kret Municipality", lat: 13.889700, lon: 100.517800, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK015_thumb.jpg", status: "live", zone: "community" },
  { id: "pk-016", cameraId: "CAMPK016", label: { th: "ถ.ภูมิเวท โรงเรียน 1", en: "Phumivet Road School 1" }, source: "Pak Kret Municipality", lat: 13.904638, lon: 100.492249, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK016_thumb.jpg", status: "live", zone: "school" },
  { id: "pk-017", cameraId: "CAMPK017", label: { th: "ถ.ภูมิเวท โรงเรียน 2", en: "Phumivet Road School 2" }, source: "Pak Kret Municipality", lat: 13.904761, lon: 100.492255, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK017_thumb.jpg", status: "live", zone: "school" },
  { id: "pk-018", cameraId: "CAMPK018", label: { th: "สะพานเมืองทองธานี 1", en: "Muang Thong Thani Bridge 1" }, source: "Pak Kret Municipality", lat: 13.900662, lon: 100.537181, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK018_thumb.jpg", status: "live", zone: "mtt-bridge" },
  { id: "pk-019", cameraId: "CAMPK019", label: { th: "สะพานเมืองทองธานี 2", en: "Muang Thong Thani Bridge 2" }, source: "Pak Kret Municipality", lat: 13.900991, lon: 100.537920, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK019_thumb.jpg", status: "live", zone: "mtt-bridge" },
  { id: "pk-020", cameraId: "CAMPK020", label: { th: "สะพานเมืองทองธานี 3", en: "Muang Thong Thani Bridge 3" }, source: "Pak Kret Municipality", lat: 13.901321, lon: 100.538659, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK020_thumb.jpg", status: "live", zone: "mtt-bridge" },
  { id: "pk-021", cameraId: "CAMPK021", label: { th: "ถ.ศรีสมาน 1", en: "Srisaman Road 1" }, source: "Pak Kret Municipality", lat: 13.934229, lon: 100.563837, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK021_thumb.jpg", status: "live", zone: "srisaman" },
  { id: "pk-022", cameraId: "CAMPK022", label: { th: "ถ.ศรีสมาน 2", en: "Srisaman Road 2" }, source: "Pak Kret Municipality", lat: 13.934531, lon: 100.563139, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK022_thumb.jpg", status: "live", zone: "srisaman" },
  { id: "pk-023", cameraId: "CAMPK023", label: { th: "ศูนย์เรียนรู้สิ่งแวดล้อม", en: "Environmental Learning Center" }, source: "Pak Kret Municipality", lat: 13.918865, lon: 100.501040, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK023_thumb.jpg", status: "live", zone: "environment" },
  { id: "pk-024", cameraId: "CAMPK024", label: { th: "วัดสนามเหนือ ท่าเรือ", en: "Wat Sanam Nua Pier" }, source: "Pak Kret Municipality", lat: 13.921400, lon: 100.498200, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK024_thumb.jpg", status: "live", zone: "riverside" },
  { id: "pk-025", cameraId: "CAMPK025", label: { th: "ถ.แจ้งวัฒนะ ปากซอย 14", en: "Chaeng Watthana Soi 14" }, source: "Pak Kret Municipality", lat: 13.903200, lon: 100.518900, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK025_thumb.jpg", status: "live", zone: "chaeng-watthana" },
  { id: "pk-026", cameraId: "CAMPK026", label: { th: "ถ.ติวานนท์ แยกปากเกร็ด", en: "Tiwanon Rd - Pak Kret Junction" }, source: "Pak Kret Municipality", lat: 13.910500, lon: 100.510300, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK026_thumb.jpg", status: "live", zone: "tiwanon" },
  { id: "pk-027", cameraId: "CAMPK027", label: { th: "ถ.ป๊อปปูล่า เมืองทอง", en: "Popular Rd - MTT" }, source: "Pak Kret Municipality", lat: 13.908300, lon: 100.537500, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK027_thumb.jpg", status: "live", zone: "mtt-popular" },
  { id: "pk-028", cameraId: "CAMPK028", label: { th: "IMPACT Arena ด้านหน้า", en: "IMPACT Arena Front" }, source: "Pak Kret Municipality", lat: 13.913400, lon: 100.553000, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK028_thumb.jpg", status: "live", zone: "impact" },
  { id: "pk-029", cameraId: "CAMPK029", label: { th: "ถ.แจ้งวัฒนะ แยกเมืองทอง", en: "Chaeng Watthana - MTT Junction" }, source: "Pak Kret Municipality", lat: 13.906100, lon: 100.530200, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK029_thumb.jpg", status: "live", zone: "mtt-junction" },
  { id: "pk-030", cameraId: "CAMPK030", label: { th: "ทางเข้าเมืองทอง ถ.แจ้งวัฒนะ", en: "MTT Entrance - Chaeng Watthana" }, source: "Pak Kret Municipality", lat: 13.905800, lon: 100.540100, imageUrl: "https://www.thaiclouderp.com/CCTV_MONITOR/src/img.php?name=CAMPK030_thumb.jpg", status: "live", zone: "mtt-entrance" }
];

export function localize(locale: Locale, value: { th: string; en: string }): string {
  return value[locale];
}

export function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
