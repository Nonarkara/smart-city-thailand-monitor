import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config.js";
import { fetchTextOrNull } from "../adapters/common.js";

export interface SlicThailandCity {
  id: string;
  rank: number;
  nameEn: string;
  nameTh: string;
  region: string;
  provinceType: string;
  overall: number;
  avgMonthlyIncome: number;
  pm25Annual: number;
  greenCoverage: number;
  tagline: string;
  highlights: string[];
  status: string;
}

export interface SlicThailandSnapshot {
  updatedAt: string;
  source: {
    name: string;
    url: string;
    freshnessStatus: "live" | "stale" | "manual";
  };
  topCities: SlicThailandCity[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const execFileAsync = promisify(execFile);
const FALLBACK_TOP_CITIES: SlicThailandCity[] = [
  {
    rank: 1,
    id: "bangkok",
    nameEn: "Bangkok",
    nameTh: "กรุงเทพฯ",
    region: "Central",
    provinceType: "primary",
    overall: 78,
    avgMonthlyIncome: 40200,
    pm25Annual: 32.4,
    greenCoverage: 11,
    tagline: "Economic powerhouse with world-class healthcare held back by congestion and air quality.",
    highlights: [
      "Highest concentration of tertiary hospitals and specialist care in the country",
      "Largest urban transit network with BTS, MRT, and Airport Rail Link",
      "Unmatched density of cultural venues, markets, and culinary diversity"
    ],
    status: "ranked"
  },
  {
    rank: 2,
    id: "phuket",
    nameEn: "Phuket",
    nameTh: "ภูเก็ต",
    region: "South",
    provinceType: "primary",
    overall: 73,
    avgMonthlyIncome: 34600,
    pm25Annual: 14.8,
    greenCoverage: 42,
    tagline: "Tourism-driven island economy with strong private healthcare and clean air, but uneven local services.",
    highlights: [
      "Highest per-capita tourism revenue of any Thai province, driving a strong service economy",
      "International-standard private hospitals attract medical tourists from across Southeast Asia",
      "Clean coastal air quality year-round, among the best in Thailand"
    ],
    status: "ranked"
  },
  {
    rank: 3,
    id: "chiang-mai",
    nameEn: "Chiang Mai",
    nameTh: "เชียงใหม่",
    region: "North",
    provinceType: "primary",
    overall: 72,
    avgMonthlyIncome: 24800,
    pm25Annual: 46.1,
    greenCoverage: 68,
    tagline: "Cultural heart of the north with growing creative economy, constrained by seasonal burning haze.",
    highlights: [
      "Recognized as Thailand's creative and digital-nomad capital with a strong cafe and coworking scene",
      "Rich Lanna heritage with over 300 Buddhist temples and annual festivals like Yi Peng",
      "Proximity to national parks and highland communities outside the smoky season"
    ],
    status: "ranked"
  },
  {
    rank: 4,
    id: "nonthaburi",
    nameEn: "Nonthaburi",
    nameTh: "นนทบุรี",
    region: "Central",
    provinceType: "secondary",
    overall: 71,
    avgMonthlyIncome: 34800,
    pm25Annual: 30.8,
    greenCoverage: 14,
    tagline: "Bangkok's most connected satellite with strong transit access, sharing the capital's pollution burden.",
    highlights: [
      "MRT Purple Line integration gives strong connectivity to central Bangkok",
      "Major government ministry offices relocated here, boosting service-sector employment",
      "Durian orchards along the Chao Phraya River maintain an agricultural identity amid urbanization"
    ],
    status: "ranked"
  },
  {
    rank: 5,
    id: "chonburi-pattaya",
    nameEn: "Chonburi / Pattaya",
    nameTh: "ชลบุรี/พัทยา",
    region: "East",
    provinceType: "primary",
    overall: 70,
    avgMonthlyIncome: 30200,
    pm25Annual: 24.1,
    greenCoverage: 22,
    tagline: "Industrial and tourism powerhouse on the eastern seaboard with high output but urban management challenges.",
    highlights: [
      "Part of the Eastern Economic Corridor (EEC), Thailand's flagship industrial zone",
      "Laem Chabang port is the country's largest and busiest container port",
      "Pattaya's tourism economy is diversifying into conferences, sports, and family segments"
    ],
    status: "ranked"
  },
  {
    rank: 6,
    id: "pathum-thani",
    nameEn: "Pathum Thani",
    nameTh: "ปทุมธานี",
    region: "Central",
    provinceType: "secondary",
    overall: 68,
    avgMonthlyIncome: 32200,
    pm25Annual: 31.2,
    greenCoverage: 16,
    tagline: "Knowledge and logistics corridor north of Bangkok with strong education anchors but rapid sprawl.",
    highlights: [
      "Thailand Science Park and Thammasat University Rangsit campus form a research corridor",
      "Major logistics and distribution hub with proximity to Don Mueang Airport",
      "Rapidly urbanizing with large-scale housing estates serving Bangkok commuters"
    ],
    status: "ranked"
  },
  {
    rank: 7,
    id: "samut-prakan",
    nameEn: "Samut Prakan",
    nameTh: "สมุทรปราการ",
    region: "Central",
    provinceType: "secondary",
    overall: 67,
    avgMonthlyIncome: 30600,
    pm25Annual: 33.6,
    greenCoverage: 12,
    tagline: "Industrial and aviation hub at Bangkok's southern edge, economically strong but environmentally strained.",
    highlights: [
      "Home to Suvarnabhumi International Airport, Thailand's primary international gateway",
      "Dense manufacturing base including automotive assembly and electronics production",
      "Bang Pu coastal wetlands serve as a migratory bird sanctuary despite industrial surroundings"
    ],
    status: "ranked"
  },
  {
    rank: 8,
    id: "rayong",
    nameEn: "Rayong",
    nameTh: "ระยอง",
    region: "East",
    provinceType: "secondary",
    overall: 66,
    avgMonthlyIncome: 28400,
    pm25Annual: 22.4,
    greenCoverage: 26,
    tagline: "Petrochemical wealth leader with major industrial output offset by environmental and health concerns.",
    highlights: [
      "Highest GPP per capita in Thailand thanks to Map Ta Phut petrochemical complex",
      "Part of the Eastern Economic Corridor with heavy investment in automation and robotics",
      "Koh Samet and coastal areas provide natural recreation despite industrial surroundings"
    ],
    status: "ranked"
  }
];

let cachedSnapshot: SlicThailandSnapshot | null = null;
let cachedAt = 0;

async function fetchTextWithCurl(url: string) {
  try {
    const { stdout } = await execFileAsync("curl", ["-L", "-s", url], {
      maxBuffer: 4 * 1024 * 1024
    });
    return stdout || null;
  } catch {
    return null;
  }
}

function decodeJsString(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

function extractBundleUrl(html: string) {
  const match = html.match(/<script type="module" crossorigin src="([^"]+)"/);
  if (!match) {
    return null;
  }

  return new URL(match[1], config.slicThailandUrl).toString();
}

function parseHighlights(block: string) {
  return Array.from(block.matchAll(/"((?:\\.|[^"\\])*)"/g), (match) => decodeJsString(match[1])).slice(0, 3);
}

function parseCitiesFromBundle(bundle: string): SlicThailandCity[] {
  const provinceSection = bundle.match(/Po=\[(?<records>[\s\S]*?)\],\$g=\[/);
  if (!provinceSection?.groups?.records) {
    return [];
  }

  const provincePattern =
    /{id:"(?<id>[^"]+)",nameEn:"(?<nameEn>[^"]+)",nameTh:"(?<nameTh>(?:\\.|[^"\\])*)",region:"(?<region>[^"]+)",population:[\de.+-]+,provinceType:"(?<provinceType>[^"]+)",scores:{overall:(?<overall>\d+),safety:\d+,economy:\d+,health:\d+,education:\d+,environment:\d+,infrastructure:\d+,culture:\d+},metrics:{gppPerCapita:[\de.+-]+,avgMonthlyIncome:(?<avgMonthlyIncome>\d+),pm25Annual:(?<pm25Annual>[\d.]+),hospitalBeds:\d+,crimeRate:\d+,greenCoverage:(?<greenCoverage>\d+)},highlights:\[(?<highlights>[\s\S]*?)\],tagline:"(?<tagline>(?:\\.|[^"\\])*)",status:"(?<status>[^"]+)"}/g;

  const matches = Array.from(provinceSection.groups.records.matchAll(provincePattern));
  const parsed = matches.map((match, index) => {
    const groups = match.groups;
    if (!groups) {
      return null;
    }

    return {
      id: groups.id,
      rank: index + 1,
      nameEn: decodeJsString(groups.nameEn),
      nameTh: decodeJsString(groups.nameTh),
      region: decodeJsString(groups.region),
      provinceType: groups.provinceType,
      overall: Number.parseInt(groups.overall, 10),
      avgMonthlyIncome: Number.parseInt(groups.avgMonthlyIncome, 10),
      pm25Annual: Number.parseFloat(groups.pm25Annual),
      greenCoverage: Number.parseInt(groups.greenCoverage, 10),
      tagline: decodeJsString(groups.tagline),
      highlights: parseHighlights(groups.highlights),
      status: groups.status
    } satisfies SlicThailandCity;
  });

  const cities = parsed.filter((item): item is SlicThailandCity => Boolean(item));
  const rankedCities = cities.filter((item) => item.status === "ranked");

  return (rankedCities.length > 0 ? rankedCities : cities)
    .sort((left, right) => right.overall - left.overall || right.avgMonthlyIncome - left.avgMonthlyIncome)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

function buildSnapshot(topCities: SlicThailandCity[], freshnessStatus: "live" | "stale" | "manual"): SlicThailandSnapshot {
  return {
    updatedAt: new Date().toISOString(),
    source: {
      name: "SLIC Thailand",
      url: config.slicThailandUrl,
      freshnessStatus
    },
    topCities: topCities.slice(0, 8)
  };
}

export async function getSlicThailandSnapshot() {
  if (cachedSnapshot && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const html = (await fetchTextOrNull(config.slicThailandUrl)) ?? (await fetchTextWithCurl(config.slicThailandUrl));
  const bundleUrl = html ? extractBundleUrl(html) : null;
  const bundle = bundleUrl ? (await fetchTextOrNull(bundleUrl)) ?? (await fetchTextWithCurl(bundleUrl)) : null;
  const topCities = bundle ? parseCitiesFromBundle(bundle) : [];

  if (topCities.length > 0) {
    cachedSnapshot = buildSnapshot(topCities, "live");
    cachedAt = Date.now();
    return cachedSnapshot;
  }

  if (cachedSnapshot) {
    return {
      ...cachedSnapshot,
      updatedAt: new Date().toISOString(),
      source: {
        ...cachedSnapshot.source,
        freshnessStatus: "stale"
      }
    };
  }

  return buildSnapshot(FALLBACK_TOP_CITIES, "manual");
}
