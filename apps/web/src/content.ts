import type { Locale } from "@smart-city/shared";

type Localized = {
  th: string;
  en: string;
};

export interface TrendWatchItem {
  id: string;
  term: Localized;
  query: string;
  category: Localized;
  values: number[];
  note: Localized;
}

export interface ResearchInsight {
  id: string;
  title: Localized;
  summary: Localized;
  href: string;
  sourceLabel: string;
}

export interface GlobalReferenceCity {
  id: string;
  name: string;
  country: string;
  approxPopulation: string;
  eiuRank2025: string;
  modelLens: Localized;
  strengths: string[];
  innovationIdeas: Localized[];
  href: string;
}

export interface ToolkitLink {
  id: string;
  name: string;
  href: string;
  kind: string;
  description: Localized;
}

export const trendWatchItems: TrendWatchItem[] = [
  {
    id: "smart-city",
    term: { th: "Smart City", en: "Smart City" },
    query: "smart city",
    category: { th: "คำหลักหลัก", en: "Core term" },
    values: [24, 32, 39, 48, 54, 61, 67, 64],
    note: {
      th: "ใช้เป็นคำหลักอ้างอิงสำหรับวัดความสนใจสาธารณะ",
      en: "Baseline public-interest reference term."
    }
  },
  {
    id: "city-data-platform",
    term: { th: "City Data Platform", en: "City Data Platform" },
    query: "city data platform",
    category: { th: "โครงสร้างข้อมูล", en: "Data infrastructure" },
    values: [10, 12, 18, 28, 35, 44, 53, 58],
    note: {
      th: "สะท้อนแนวคิด CDP และ data governance ที่เพิ่มขึ้น",
      en: "Tracks growing attention to CDP and data-governance thinking."
    }
  },
  {
    id: "smart-environment",
    term: { th: "Smart Environment", en: "Smart Environment" },
    query: "smart environment",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [18, 24, 30, 37, 42, 46, 55, 61],
    note: {
      th: "มักเชื่อมกับอากาศ น้ำ และความยืดหยุ่น",
      en: "Often tied to air, water, and resilience questions."
    }
  },
  {
    id: "smart-economy",
    term: { th: "Smart Economy", en: "Smart Economy" },
    query: "smart economy",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [15, 19, 23, 29, 34, 38, 42, 47],
    note: {
      th: "ใช้จับการลงทุน นวัตกรรม และแรงงาน",
      en: "Used to frame investment, innovation, and workforce shifts."
    }
  },
  {
    id: "smart-mobility",
    term: { th: "Smart Mobility", en: "Smart Mobility" },
    query: "smart mobility",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [29, 34, 40, 47, 54, 58, 61, 65],
    note: {
      th: "โดยมากสัมพันธ์กับ EV การขนส่ง และ last-mile",
      en: "Usually linked to EVs, transit, and last-mile service."
    }
  },
  {
    id: "smart-energy",
    term: { th: "Smart Energy", en: "Smart Energy" },
    query: "smart energy",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [20, 27, 31, 36, 43, 49, 54, 59],
    note: {
      th: "ผูกกับประสิทธิภาพพลังงานและทางเลือกสะอาด",
      en: "Tracks interest in efficiency and cleaner alternatives."
    }
  },
  {
    id: "smart-people",
    term: { th: "Smart People", en: "Smart People" },
    query: "smart people",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [12, 15, 18, 20, 24, 27, 29, 33],
    note: {
      th: "สะท้อนกำลังคน ทักษะ และ civic participation",
      en: "Reflects talent, skills, and civic-participation themes."
    }
  },
  {
    id: "smart-living",
    term: { th: "Smart Living", en: "Smart Living" },
    query: "smart living",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [30, 33, 39, 43, 49, 55, 61, 66],
    note: {
      th: "มีแนวโน้มเชื่อมกับคุณภาพชีวิตและบริการเมือง",
      en: "Often maps to livability and service quality."
    }
  },
  {
    id: "smart-governance",
    term: { th: "Smart Governance", en: "Smart Governance" },
    query: "smart governance",
    category: { th: "7 Smarts", en: "7 Smarts" },
    values: [11, 15, 19, 24, 31, 38, 44, 50],
    note: {
      th: "โยงกับ open data ความโปร่งใส และบริการภาครัฐ",
      en: "Connected to open data, transparency, and service design."
    }
  },
  {
    id: "smart-city-thailand-office",
    term: { th: "Smart City Thailand Office", en: "Smart City Thailand Office" },
    query: "\"Smart City Thailand Office\"",
    category: { th: "องค์กร", en: "Organization" },
    values: [6, 8, 11, 14, 18, 22, 26, 30],
    note: {
      th: "เฝ้าดูการรับรู้ต่อหน่วยงานเฉพาะในไทย",
      en: "Tracks awareness of the Thailand-specific office."
    }
  },
  {
    id: "digital-economy-promotion-agency",
    term: { th: "Digital Economy Promotion Agency", en: "Digital Economy Promotion Agency" },
    query: "\"Digital Economy Promotion Agency\"",
    category: { th: "องค์กร", en: "Organization" },
    values: [16, 18, 21, 24, 28, 33, 37, 41],
    note: {
      th: "สะท้อนความสนใจต่อ depa ในฐานะผู้ขับเคลื่อน",
      en: "Captures attention to depa as an implementation actor."
    }
  }
];

export const researchInsights: ResearchInsight[] = [
  {
    id: "operating-room",
    title: {
      th: "แดชบอร์ดเมืองถูกใช้เป็นห้องควบคุมการตัดสินใจ",
      en: "Smart city dashboards are used as decision-support operating rooms."
    },
    summary: {
      th: "ทีมเมืองใช้แดชบอร์ดเพื่อรวมข้อมูลจากหลายหน่วยงานให้เห็นสถานการณ์เดียวกันก่อนตัดสินใจ",
      en: "Teams use them to combine signals from multiple agencies into one shared operating picture before acting."
    },
    href: "https://www.cities.google/",
    sourceLabel: "Google for Cities"
  },
  {
    id: "city-as-platform",
    title: {
      th: "แนวโน้มสำคัญคือคิดแบบ city as a platform",
      en: "A major trend is treating the city as a platform."
    },
    summary: {
      th: "เมืองจำนวนมากมองแดชบอร์ดไม่ใช่แค่รายงาน แต่เป็นชั้นเชื่อมข้อมูล บริการ และการตอบสนอง",
      en: "Cities increasingly treat dashboards not as reports, but as a layer connecting data, services, and response."
    },
    href: "https://www.city-platform.com/",
    sourceLabel: "City as a Platform"
  },
  {
    id: "livability",
    title: {
      th: "สิ่งที่ผู้ใช้คาดหวังคือผลลัพธ์ด้านคุณภาพชีวิต ไม่ใช่แค่เทคโนโลยี",
      en: "Users increasingly care about livability outcomes, not technology for its own sake."
    },
    summary: {
      th: "การเล่าเรื่องที่ดีที่สุดผูกข้อมูลเข้ากับคุณภาพชีวิต ความยืดหยุ่น และการบริการที่ดีขึ้น",
      en: "The strongest dashboards tie data to livability, resilience, and better service delivery."
    },
    href: "https://www.mckinsey.com/industries/public-sector/our-insights/smart-cities-digital-solutions-for-a-more-livable-future",
    sourceLabel: "McKinsey"
  }
];

export const globalReferenceCities: GlobalReferenceCity[] = [
  {
    id: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    approxPopulation: "~1.4M metro",
    eiuRank2025: "#1",
    modelLens: {
      th: "เหมาะเป็นต้นแบบสำหรับเมืองที่ต้องการสมดุลด้านการเดินทาง คุณภาพชีวิต และโครงสร้างพื้นฐาน",
      en: "Best fit for cities that need a balanced model of mobility, livability, and infrastructure."
    },
    strengths: ["stability", "education", "infrastructure"],
    innovationIdeas: [
      {
        th: "ออกแบบถนนและพื้นที่สาธารณะให้เดิน-จักรยานได้จริง ไม่ใช่แค่เส้นสัญลักษณ์",
        en: "Design streets and public space for real walking and cycling, not symbolic lanes."
      },
      {
        th: "วางระบบข้อมูลเมืองให้เชื่อมกับ climate adaptation และการระบายน้ำ",
        en: "Tie city data systems directly to climate adaptation and water management."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  },
  {
    id: "vienna",
    name: "Vienna",
    country: "Austria",
    approxPopulation: "~2.0M metro",
    eiuRank2025: "#2 (tie)",
    modelLens: {
      th: "เหมาะสำหรับเมืองที่ต้องการยกระดับ livability การบริการสาธารณะ และวัฒนธรรมเมือง",
      en: "Strong model for cities improving livability, public service quality, and civic culture."
    },
    strengths: ["healthcare", "education", "infrastructure"],
    innovationIdeas: [
      {
        th: "ใช้ที่อยู่อาศัยและระบบขนส่งเป็นแกนของคุณภาพชีวิต ไม่ใช่แยกกันทำ",
        en: "Treat housing and transport as one livability system, not separate projects."
      },
      {
        th: "ยกระดับบริการเมืองให้เชื่อถือได้และเข้าถึงง่ายทุกย่าน",
        en: "Make city services reliable and accessible across every district."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  },
  {
    id: "zurich",
    name: "Zurich",
    country: "Switzerland",
    approxPopulation: "~1.6M metro",
    eiuRank2025: "#2 (tie)",
    modelLens: {
      th: "เหมาะกับเมืองที่ต้องการมาตรฐานสูงด้าน governance สุขภาพ และความแม่นยำของโครงสร้างพื้นฐาน",
      en: "Useful for cities targeting high-trust governance, healthcare, and precision infrastructure."
    },
    strengths: ["healthcare", "education", "stability"],
    innovationIdeas: [
      {
        th: "ใช้ข้อมูลเพื่อบริหารคุณภาพบริการ ไม่ใช่แค่รายงานผล",
        en: "Use data to manage service quality, not just to report outcomes."
      },
      {
        th: "เน้นความน่าเชื่อถือของระบบสาธารณูปโภคและเวลาเดินทาง",
        en: "Prioritize utility reliability and travel-time predictability."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  },
  {
    id: "melbourne",
    name: "Melbourne",
    country: "Australia",
    approxPopulation: "~5.3M metro",
    eiuRank2025: "#4",
    modelLens: {
      th: "เหมาะกับเมืองที่ต้องการสมดุลระหว่างเศรษฐกิจสร้างสรรค์ พื้นที่สาธารณะ และบริการเมืองขนาดใหญ่",
      en: "Good model for balancing creative economy, public realm, and large-scale city services."
    },
    strengths: ["education", "culture", "infrastructure"],
    innovationIdeas: [
      {
        th: "ออกแบบเมืองให้รองรับทั้งกิจกรรมเศรษฐกิจและพื้นที่ใช้ชีวิตในระดับย่าน",
        en: "Design for both economic activity and neighborhood-scale livability."
      },
      {
        th: "ทำ district dashboards ให้รองรับการตัดสินใจรายพื้นที่",
        en: "Use district-level dashboards for area-by-area management."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  },
  {
    id: "osaka",
    name: "Osaka",
    country: "Japan",
    approxPopulation: "~19M metro",
    eiuRank2025: "#7 (tie)",
    modelLens: {
      th: "เหมาะกับเมืองไทยที่กำลังโตและต้องการต้นแบบการขนส่ง การบริหารความหนาแน่น และบริการเมือง",
      en: "Strong reference for growing Thai cities managing transit, density, and reliable services."
    },
    strengths: ["stability", "infrastructure", "healthcare"],
    innovationIdeas: [
      {
        th: "ยกระดับระบบเดินทางและป้ายข้อมูลให้เชื่อมต่อกันอย่างเป็นระบบ",
        en: "Upgrade mobility and wayfinding as one coherent network."
      },
      {
        th: "บริหารเมืองหนาแน่นด้วยระบบบริการที่ตรงเวลาและคาดการณ์ได้",
        en: "Manage density through service systems that are punctual and predictable."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  },
  {
    id: "vancouver",
    name: "Vancouver",
    country: "Canada",
    approxPopulation: "~2.7M metro",
    eiuRank2025: "#10",
    modelLens: {
      th: "เหมาะกับเมืองที่ต้องการต้นแบบด้านธรรมชาติ เมืองน่าอยู่ และโครงสร้างพื้นฐานที่เชื่อมคุณภาพชีวิต",
      en: "A useful model for nature-linked livability and infrastructure tied to quality of life."
    },
    strengths: ["healthcare", "culture", "environment"],
    innovationIdeas: [
      {
        th: "เชื่อมพื้นที่สีเขียว น้ำ และคุณภาพชีวิตเข้ากับการวางผังเมือง",
        en: "Integrate green-blue systems directly into urban planning."
      },
      {
        th: "ใช้ resilience เป็นส่วนหนึ่งของเศรษฐกิจเมือง ไม่ใช่เฉพาะด้านภัยพิบัติ",
        en: "Treat resilience as part of economic strategy, not only disaster planning."
      }
    ],
    href: "https://www.cnbc.com/2025/06/19/economist-intelligence-unit-2025-most-livable-cities-in-the-world.html"
  }
];

export const toolkitLinks: ToolkitLink[] = [
  {
    id: "tool-citydata",
    name: "CityData Thailand",
    href: "https://www.citydata.in.th",
    kind: "Directory",
    description: {
      th: "ศูนย์รวมแดชบอร์ดและข้อมูลเมืองของไทย",
      en: "Thailand city dashboard and dataset directory."
    }
  },
  {
    id: "tool-citydata-catalog",
    name: "CityData Catalog",
    href: "https://catalog.citydata.in.th/en",
    kind: "Catalog",
    description: {
      th: "ดูชุดข้อมูลและเมทาดาทา",
      en: "Browse datasets and metadata."
    }
  },
  {
    id: "tool-data-go-th",
    name: "data.go.th",
    href: "https://data.go.th",
    kind: "Catalog",
    description: {
      th: "พอร์ทัลข้อมูลเปิดภาครัฐ",
      en: "Thailand’s open government data portal."
    }
  },
  {
    id: "tool-open-data-api",
    name: "Open Government Data API",
    href: "https://opend.data.go.th/en",
    kind: "API",
    description: {
      th: "เอกสารและการเข้าถึง API ข้อมูลเปิด",
      en: "API documentation and access for government data."
    }
  },
  {
    id: "tool-urbanis",
    name: "The Urbanis Urban Data",
    href: "https://urbandata.theurbanis.com",
    kind: "Reference",
    description: {
      th: "ชุดข้อมูลเมืองเพื่อใช้เป็นแหล่งเสริม",
      en: "Urban data enrichment source."
    }
  },
  {
    id: "tool-gistda",
    name: "GISTDA Disaster Open API",
    href: "https://disaster.gistda.or.th/services/open-api",
    kind: "API",
    description: {
      th: "ข้อมูลเหตุภัยพิบัติและแผนที่ความเสี่ยง",
      en: "Disaster and hazard data for map overlays."
    }
  },
  {
    id: "tool-open-meteo",
    name: "Open-Meteo Weather + Air",
    href: "https://open-meteo.com/en/docs",
    kind: "API",
    description: {
      th: "ข้อมูลอากาศและคุณภาพอากาศสำหรับ v1",
      en: "Weather and air-quality feeds for v1."
    }
  },
  {
    id: "tool-newsapi",
    name: "Google News RSS + Alerts",
    href: "https://news.google.com",
    kind: "API",
    description: {
      th: "ฟีดข่าวฟรีจาก Google และสามารถเสริมด้วย Google Alerts RSS",
      en: "Free Google news feeds with optional Google Alerts RSS input."
    }
  },
  {
    id: "tool-gdelt",
    name: "GDELT DOC API",
    href: "https://api.gdeltproject.org/api/v2/doc/doc",
    kind: "API",
    description: {
      th: "สัญญาณข่าวโลก ปริมาณข่าว และโทนการกล่าวถึง",
      en: "Global media volume, source spread, and tone monitoring."
    }
  },
  {
    id: "tool-talkwalker",
    name: "Talkwalker Alerts",
    href: "https://www.talkwalker.com/alerts",
    kind: "RSS",
    description: {
      th: "ระบบ social listening แบบเบาๆ ผ่าน RSS alerts",
      en: "Lightweight social listening through configurable alert feeds."
    }
  },
  {
    id: "tool-youtube",
    name: "YouTube Signals",
    href: "https://developers.google.com/youtube/v3",
    kind: "API",
    description: {
      th: "วิดีโอและไลฟ์สตรีมเพื่อแสดงหลักฐานเชิงสาธารณะ",
      en: "Video and livestream monitoring for public-facing proof."
    }
  },
  {
    id: "tool-eonet",
    name: "NASA EONET",
    href: "https://eonet.gsfc.nasa.gov/api/v3/events",
    kind: "API",
    description: {
      th: "เหตุการณ์ธรรมชาติแบบใกล้เวลาจริงสำหรับชั้นความยืดหยุ่น",
      en: "Near-real-time natural event monitoring for resilience layers."
    }
  },
  {
    id: "tool-openaq",
    name: "OpenAQ",
    href: "https://api.openaq.org",
    kind: "API",
    description: {
      th: "สถานีคุณภาพอากาศระดับจุดเมื่อตั้งค่า key แล้ว",
      en: "Station-level air-quality network when an API key is configured."
    }
  },
  {
    id: "tool-coingecko",
    name: "CoinGecko Simple Price",
    href: "https://www.coingecko.com/en/api/documentation",
    kind: "API",
    description: {
      th: "ราคา Bitcoin และสินทรัพย์คริปโตแบบไม่ต้องใช้ key",
      en: "Free crypto price snapshots such as Bitcoin."
    }
  },
  {
    id: "tool-frankfurter",
    name: "Frankfurter FX API",
    href: "https://www.frankfurter.app/docs/",
    kind: "API",
    description: {
      th: "อัตราแลกเปลี่ยนสำหรับบริบทค่าเงิน เช่น USD/THB",
      en: "Foreign-exchange context such as USD/THB."
    }
  }
];

export function createGoogleTrendsUrl(query: string) {
  const params = new URLSearchParams({
    date: "today 5-y",
    geo: "TH",
    q: query
  });

  return `https://trends.google.com/trends/explore?${params.toString()}`;
}

export function createDashboardSkeletonExport() {
  return {
    app: {
      name: "Smart City Thailand Monitor",
      mode: "public-dashboard",
      locales: ["th", "en"],
      layout: {
        desktopColumns: 5,
        tabletColumns: 3,
        mobileColumns: 1,
        topBar: true,
        leftRail: true,
        bottomBar: true
      }
    },
    routes: [
      "/",
      "/admin"
    ],
    widgets: [
      "pulse_hero",
      "map_layers",
      "briefing_note",
      "project_progress",
      "official_news",
      "external_news",
      "resilience_strip",
      "city_compare",
      "source_health",
      "time_zones",
      "what_changed",
      "social_listening",
      "official_impact",
      "market_context",
      "activity_log",
      "trend_watch",
      "api_directory"
    ],
    apiEndpoints: [
      "/api/overview",
      "/api/pulse",
      "/api/projects",
      "/api/news",
      "/api/map/layers",
      "/api/resilience",
      "/api/changes",
      "/api/activity",
      "/api/social-listening",
      "/api/impact",
      "/api/markets",
      "/api/sources",
      "/api/briefings/latest",
      "/api/time"
    ],
    adminEndpoints: [
      "/api/admin/news",
      "/api/admin/projects",
      "/api/admin/briefings",
      "/api/admin/sources/sync",
      "/api/admin/sources/health"
    ],
    sourceDirectory: toolkitLinks.map((tool) => ({
      name: tool.name,
      kind: tool.kind,
      href: tool.href
    })),
    trendWatchlist: trendWatchItems.map((item) => ({
      term: item.query,
      geo: "TH",
      source: "Google Trends"
    }))
  };
}

export function pickLocalized(locale: Locale, value: Localized) {
  return value[locale];
}
