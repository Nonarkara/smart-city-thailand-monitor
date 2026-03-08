import { localize } from "@smart-city/shared";
import type { DashboardView, GeoFeatureRecord, Locale, MapFeatureCollection, NewsItem, ProjectRecord } from "@smart-city/shared";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getEoTileConfigs, type EoLayerId } from "./eoTiles";

const JAXA_SCRIPT_URL = "https://data.earth.jaxa.jp/api/javascript/v1.2.3/jaxa.earth.umd.js";
const JAXA_GSMAP_DAILY_COLLECTION =
  "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_GSMaP_standard.Gauge.00Z-23Z.v6_daily/collection.json";

interface JaxaLeafletLayerParams {
  L: typeof L;
  collection: string;
  date?: Date;
  opacity?: number;
  projection?: string;
}

interface JaxaEarthGlobal {
  leaflet?: {
    createLayer: (params: JaxaLeafletLayerParams) => L.Layer | Promise<L.Layer>;
  };
}

declare global {
  interface Window {
    je?: JaxaEarthGlobal;
    __jaxaEarthLoader?: Promise<JaxaEarthGlobal | null>;
  }
}

type LayerId =
  | "smart-city-thailand"
  | "bangkok-passages"
  | "geography-detail"
  | "projects"
  | "news"
  | "resilience"
  | "economy"
  | "agriculture"
  | "water"
  | "land-use"
  | "weather"
  | "pollution"
  | "eo-aerosol"
  | "eo-precipitation"
  | "eo-vegetation"
  | "jaxa-rainfall"
  | "satellite-imagery"
  | "disaster"
  | "itic-traffic";

type EoRainState = "off" | "loading" | "live" | "fallback";

const greaterBangkokBounds = L.latLngBounds([13.45, 100.30], [14.20, 100.86]);
// Tight north-Bangkok / Nonthaburi operating frame for the MTT dashboard
const northBangkokBounds = L.latLngBounds([13.84, 100.49], [13.95, 100.62]);
// Tight MTT district bounds (zoom ≈ 14 fills screen with the estate)
const mttBounds = L.latLngBounds([13.880, 100.525], [13.945, 100.580]);
const localViewportBounds = greaterBangkokBounds.pad(0.03);
const macroRegionalLayers = new Set<LayerId>(["resilience", "economy", "agriculture", "water", "land-use", "disaster"]);

const cityCenters: Record<
  string,
  {
    label: { th: string; en: string };
    lat: number;
    lon: number;
  }
> = {
  "muang-thong-thani": {
    label: { th: "เมืองทองธานี", en: "Muang Thong Thani" },
    lat: 13.9118,
    lon: 100.5512
  },
  nonthaburi: {
    label: { th: "จังหวัดนนทบุรี", en: "Nonthaburi" },
    lat: 13.8591,
    lon: 100.5144
  },
  "pak-kret": {
    label: { th: "ปากเกร็ด", en: "Pak Kret" },
    lat: 13.9261,
    lon: 100.5224
  },
  "impact-core": {
    label: { th: "อิมแพ็ค", en: "IMPACT Core" },
    lat: 13.9128,
    lon: 100.5479
  },
  "chaeng-watthana": {
    label: { th: "แจ้งวัฒนะ", en: "Chaeng Watthana" },
    lat: 13.8945,
    lon: 100.5676
  },
  "lak-si": {
    label: { th: "หลักสี่", en: "Lak Si" },
    lat: 13.8864,
    lon: 100.5798
  },
  "don-mueang": {
    label: { th: "ดอนเมือง", en: "Don Mueang" },
    lat: 13.9154,
    lon: 100.6074
  },
  "nonthaburi-civic": {
    label: { th: "ศูนย์ราชการนนทบุรี", en: "Nonthaburi Civic Center" },
    lat: 13.8606,
    lon: 100.5148
  },
  bangkok: {
    label: { th: "กรุงเทพมหานคร", en: "Bangkok" },
    lat: 13.7563,
    lon: 100.5018
  },
  pathumthani: {
    label: { th: "ปทุมธานี", en: "Pathumthani" },
    lat: 14.0208,
    lon: 100.5250
  }
};

const layerColors: Record<LayerId, string> = {
  "smart-city-thailand": "#ff5b57",
  "bangkok-passages": "#22c55e",
  "geography-detail": "#1d4ed8",
  projects: "#0057ff",
  news: "#0c9b63",
  resilience: "#f59a00",
  economy: "#6246ea",
  agriculture: "#7aa61b",
  water: "#1479c9",
  "land-use": "#6b7280",
  weather: "#119fb8",
  pollution: "#c0264f",
  "eo-aerosol": "#9333ea",
  "eo-precipitation": "#2563eb",
  "eo-vegetation": "#65a30d",
  "jaxa-rainfall": "#0f8cff",
  "satellite-imagery": "#e2e8f0",
  disaster: "#cf5c00",
  "itic-traffic": "#ef4444"
};

const coverageDomainKeywords: Record<string, string[]> = {
  environment: ["environment", "resilience", "water", "coastal", "green", "climate", "canal", "flood"],
  economy: ["economy", "industrial", "trade", "tourism", "innovation", "growth", "logistics"],
  mobility: ["mobility", "transport", "transit", "corridor", "gateway", "connectivity", "traffic"],
  energy: ["energy", "power", "utility", "grid"],
  people: ["people", "community", "education", "campus", "university", "civic"],
  living: ["living", "livability", "health", "safety", "public-space", "tourism", "services"],
  governance: ["governance", "administration", "service", "management", "municipal", "public", "policy"]
};

function addCitySignal(
  target: L.LayerGroup,
  citySlug: string,
  color: string,
  radius: number,
  label: string,
  options?: {
    fillOpacity?: number;
    offsetLat?: number;
    offsetLon?: number;
    strokeWidth?: number;
  }
) {
  const city = cityCenters[citySlug];
  if (!city) {
    return;
  }

  const marker = L.circleMarker(
    [city.lat + (options?.offsetLat ?? 0), city.lon + (options?.offsetLon ?? 0)],
    {
      radius,
      color,
      weight: options?.strokeWidth ?? 2,
      fillColor: color,
      fillOpacity: options?.fillOpacity ?? 0.28
    }
  );

  marker.bindTooltip(label, {
    direction: "top"
  });
  marker.addTo(target);
}

function renderProjects(target: L.LayerGroup, locale: Locale, projects: ProjectRecord[]) {
  const projectCounts = Object.keys(cityCenters).map((citySlug) => ({
    citySlug,
    count: projects.filter((project) => project.citySlug === citySlug).length
  }));

  projectCounts.forEach(({ citySlug, count }) => {
    if (count === 0) return;
    const label = `${localize(locale, cityCenters[citySlug].label)}: ${count} project${count > 1 ? "s" : ""}`;
    addCitySignal(target, citySlug, layerColors.projects, 7 + count * 2, label, {
      fillOpacity: 0.2
    });
  });
}

function renderNews(target: L.LayerGroup, locale: Locale, news: NewsItem[]) {
  Object.keys(cityCenters).forEach((citySlug, index) => {
    const count = news.filter((item) => item.citySlug === citySlug || (!item.citySlug && index === 0)).length;
    if (count === 0) return;
    const label = `${localize(locale, cityCenters[citySlug].label)}: ${count} news signal${count > 1 ? "s" : ""}`;
    addCitySignal(target, citySlug, layerColors.news, 4 + Math.min(count, 3), label, {
      offsetLat: 0.1,
      offsetLon: 0.08,
      fillOpacity: 0.22
    });
  });
}

function renderResilience(target: L.LayerGroup, locale: Locale) {
  [
    { citySlug: "muang-thong-thani", radius: 1900, label: { th: "เฝ้าระวังคุณภาพอากาศ", en: "Air-quality watch" } },
    { citySlug: "chaeng-watthana", radius: 2600, label: { th: "เฝ้าระวังการเดินทาง", en: "Mobility pressure watch" } },
    { citySlug: "nonthaburi-civic", radius: 3200, label: { th: "เฝ้าระวังน้ำและคลอง", en: "Canal and flood watch" } }
  ].forEach((item) => {
    const city = cityCenters[item.citySlug];
    if (!city) {
      return;
    }
    const circle = L.circle([city.lat, city.lon], {
      radius: item.radius,
      color: layerColors.resilience,
      weight: 1.5,
      fillColor: layerColors.resilience,
      fillOpacity: 0.035,
      dashArray: "8 6"
    });
    circle.bindTooltip(`${localize(locale, city.label)}: ${localize(locale, item.label)}`);
    circle.addTo(target);
  });
}

function renderEconomy(target: L.LayerGroup, locale: Locale) {
  [
    { citySlug: "bangkok", value: 80 },
    { citySlug: "muang-thong-thani", value: 82 },
    { citySlug: "nonthaburi", value: 76 },
    { citySlug: "pathumthani", value: 74 }
  ].forEach((item) => {
    if (!cityCenters[item.citySlug]) {
      return;
    }
    const label = `${localize(locale, cityCenters[item.citySlug].label)}: ${item.value}`;
    addCitySignal(target, item.citySlug, layerColors.economy, 6 + Math.round(item.value / 20), label, {
      fillOpacity: 0.18,
      strokeWidth: 2
    });
  });
}

function renderDisaster(target: L.LayerGroup, locale: Locale) {
  const polygon = L.polygon(
    [
      [8.7, 98.0],
      [8.1, 99.1],
      [7.3, 98.8],
      [7.7, 97.9]
    ],
    {
      color: layerColors.disaster,
      weight: 2,
      fillColor: layerColors.disaster,
      fillOpacity: 0.08
    }
  );

  polygon.bindTooltip(locale === "th" ? "โซนเฝ้าระวังภัยพิบัติ" : "Disaster monitoring zone");
  polygon.addTo(target);
}

function matchesCoverageDomain(feature: GeoFeatureRecord, domainSlug?: string) {
  if (!domainSlug) {
    return true;
  }

  const keywords = coverageDomainKeywords[domainSlug];
  if (!keywords) {
    return true;
  }

  const haystack = [
    feature.title,
    feature.description ?? "",
    ...Object.values(feature.properties).map((value) => String(value ?? ""))
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword));
}

function humanizePropertyKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatPropertyValue(key: string, value: string | number | boolean | null) {
  if (typeof value === "number" && key.toLowerCase().includes("population")) {
    return value.toLocaleString("en-US");
  }

  return String(value ?? "");
}

function normalizeCoordinatePair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const lon = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return [lon, lat];
}

function collectCoordinatePairs(value: unknown): Array<[number, number]> {
  const point = normalizeCoordinatePair(value);
  if (point) {
    return [point];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => collectCoordinatePairs(entry));
}

function toLeafletLatLngs(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<[number, number]>;
  }

  return value
    .map((entry) => normalizeCoordinatePair(entry))
    .filter((entry): entry is [number, number] => Boolean(entry))
    .map(([lon, lat]) => [lat, lon] as [number, number]);
}

function getFeatureBounds(feature: GeoFeatureRecord) {
  const points = collectCoordinatePairs(feature.coordinates).map(([lon, lat]) => L.latLng(lat, lon));
  if (points.length === 0) {
    return null;
  }

  return L.latLngBounds(points);
}

function shouldRenderFeature(collectionId: string, feature: GeoFeatureRecord, focusBounds: L.LatLngBounds) {
  const bounds = getFeatureBounds(feature);
  if (!bounds) {
    return false;
  }

  if (feature.geometryType === "Point") {
    return focusBounds.contains(bounds.getCenter());
  }

  if (!focusBounds.intersects(bounds)) {
    return false;
  }

  if (macroRegionalLayers.has(collectionId as LayerId)) {
    const latSpan = Math.abs(bounds.getNorth() - bounds.getSouth());
    const lonSpan = Math.abs(bounds.getEast() - bounds.getWest());

    if (latSpan > 0.24 || lonSpan > 0.24) {
      return false;
    }
  }

  return true;
}

function buildPopupContent(feature: GeoFeatureRecord) {
  const propertyRows = Object.entries(feature.properties)
    .filter(([, value]) => value !== null && value !== "")
    .slice(0, 5)
    .map(
      ([key, value]) =>
        `<small><strong>${humanizePropertyKey(key)}:</strong> ${formatPropertyValue(key, value)}</small>`
    )
    .join("");

  return `
    <div style="display:grid;gap:4px;min-width:180px;">
      <strong>${feature.title}</strong>
      ${feature.description ? `<span>${feature.description}</span>` : ""}
      ${propertyRows}
      <small>${feature.source.sourceName}</small>
    </div>
  `;
}

function getPollutionSeverityColor(aqi: number) {
  if (aqi >= 100) return "#b91c1c";
  if (aqi >= 70) return "#dc2626";
  if (aqi >= 50) return "#f59e0b";
  return "#16a34a";
}

function getLatestJaxaRainDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function loadJaxaEarthLibrary(): Promise<JaxaEarthGlobal | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.je?.leaflet?.createLayer) {
    return Promise.resolve(window.je);
  }

  if (window.__jaxaEarthLoader) {
    return window.__jaxaEarthLoader;
  }

  window.__jaxaEarthLoader = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-jaxa-earth="true"]');

    if (existing) {
      existing.addEventListener("load", () => resolve(window.je ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = JAXA_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.jaxaEarth = "true";
    script.onload = () => resolve(window.je ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return window.__jaxaEarthLoader;
}

function renderEoRainFallback(target: L.LayerGroup, locale: Locale, featureCollections: MapFeatureCollection[]) {
  target.clearLayers();

  const weatherCollection = featureCollections.find((collection) => collection.layerId === "weather");
  const weatherPoints = weatherCollection?.features.filter(
    (feature) => feature.geometryType === "Point" && Array.isArray(feature.coordinates) && feature.coordinates.length >= 2
  );

  if (!weatherPoints || weatherPoints.length === 0) {
    L.rectangle(
      [
        [6.2, 98.2],
        [19.8, 104.6]
      ],
      {
        color: layerColors["jaxa-rainfall"],
        weight: 1,
        fillColor: layerColors["jaxa-rainfall"],
        fillOpacity: 0.05
      }
    ).addTo(target);
    return;
  }

  weatherPoints.forEach((feature) => {
    const [lon, lat] = feature.coordinates as [number, number];
    const humidity = Number(feature.properties.humidity ?? 0);
    const wind = Number(feature.properties.windKph ?? 0);

    const circle = L.circle([lat, lon], {
      radius: 48000 + humidity * 520 + wind * 260,
      color: layerColors["jaxa-rainfall"],
      weight: 1,
      fillColor: layerColors["jaxa-rainfall"],
      fillOpacity: Math.min(0.18, 0.045 + humidity / 760)
    });

    circle.bindTooltip(
      locale === "th"
        ? `${feature.title}: โหมดสำรองจากบริบทอากาศ`
        : `${feature.title}: fallback rain watch from local weather context`
    );

    circle.addTo(target);
  });
}

function renderFeatureCollections(
  target: L.LayerGroup,
  activeLayers: Set<LayerId>,
  featureCollections: MapFeatureCollection[],
  focusBounds: L.LatLngBounds,
  domainSlug?: string
) {
  featureCollections.forEach((collection) => {
    if (!activeLayers.has(collection.layerId as LayerId)) {
      return;
    }

    collection.features.forEach((feature) => {
      if (collection.layerId === "smart-city-thailand" && !matchesCoverageDomain(feature, domainSlug)) {
        return;
      }

      if (!shouldRenderFeature(collection.layerId, feature, focusBounds)) {
        return;
      }

      const isBangkokPlaces = collection.layerId === "bangkok-passages";
      const isNationalFootprint = collection.layerId === "smart-city-thailand";
      const isPollutionLayer = collection.layerId === "pollution";
      const intensity =
        isPollutionLayer
          ? Number(feature.properties.aqi ?? 0)
          : collection.layerId === "weather"
            ? Number(feature.properties.temperatureC ?? 0)
            : 0;
      const pointColor = isPollutionLayer
        ? getPollutionSeverityColor(intensity)
        : layerColors[collection.layerId as LayerId] ?? "#22c55e";
      const popupContent = buildPopupContent(feature);

      if (feature.geometryType === "Point") {
        const point = normalizeCoordinatePair(feature.coordinates);
        if (!point) {
          return;
        }

        const [lon, lat] = point;
        const marker = L.circleMarker([lat, lon], {
          radius: isNationalFootprint
            ? 5
            : isBangkokPlaces
              ? 6
              : isPollutionLayer
                ? Math.max(4, Math.min(8, 3 + intensity / 35))
                : collection.layerId === "weather"
                  ? 5
                  : collection.layerId === "agriculture" || collection.layerId === "water" || collection.layerId === "land-use"
                    ? 5
                  : 4,
          color: pointColor,
          fillColor: pointColor,
          fillOpacity: isNationalFootprint ? 0.2 : isPollutionLayer ? 0.22 : 0.3,
          weight: 2
        });

        if (isPollutionLayer && intensity >= 70) {
          const glow = L.circle([lat, lon], {
            radius: 900 + intensity * 18,
            color: pointColor,
            weight: 1,
            fillColor: pointColor,
            fillOpacity: intensity >= 85 ? 0.05 : 0.03
          });
          glow.addTo(target);
        }

        marker.bindPopup(popupContent);
        marker.addTo(target);
        return;
      }

      if (feature.geometryType === "LineString") {
        const latLngs = toLeafletLatLngs(feature.coordinates);
        if (latLngs.length < 2) {
          return;
        }

        const line = L.polyline(latLngs, {
          color: pointColor,
          weight:
            collection.layerId === "economy" || collection.layerId === "water"
              ? 4
              : collection.layerId === "agriculture"
                ? 4
                : 3.25,
          opacity: 0.68,
          dashArray: collection.layerId === "disaster" ? "10 6" : undefined
        });

        line.bindPopup(popupContent);
        line.addTo(target);
        return;
      }

      if (feature.geometryType === "Polygon") {
        const latLngs = toLeafletLatLngs(feature.coordinates);
        if (latLngs.length < 3) {
          return;
        }

        const polygon = L.polygon(latLngs, {
          color: pointColor,
          weight: collection.layerId === "smart-city-thailand" ? 1.5 : 1.25,
          fillColor: pointColor,
          fillOpacity:
            collection.layerId === "economy"
              ? 0.04
              : collection.layerId === "agriculture"
                ? 0.05
                : collection.layerId === "water"
                  ? 0.04
                  : collection.layerId === "land-use"
                    ? 0.04
                    : collection.layerId === "resilience"
                      ? 0.035
                : collection.layerId === "projects"
                  ? 0.05
                  : collection.layerId === "disaster"
                    ? 0.045
                    : 0.05
        });

        polygon.bindPopup(popupContent);
        polygon.addTo(target);
      }
    });
  });
}

interface InteractiveMapProps {
  locale: Locale;
  view: DashboardView;
  citySlug: string;
  domainSlug?: string;
  layers: string[];
  projects: ProjectRecord[];
  news: NewsItem[];
  featureCollections: MapFeatureCollection[];
  recenterSignal: number;
}

export default function InteractiveMap({
  locale,
  view,
  citySlug,
  domainSlug,
  layers,
  projects,
  news,
  featureCollections,
  recenterSignal
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const eoTileLayersRef = useRef<Partial<Record<EoLayerId, L.TileLayer>>>({});
  const jaxaLayerRef = useRef<L.Layer | null>(null);
  const jaxaFallbackRef = useRef<L.LayerGroup | null>(null);
  const lastViewportKeyRef = useRef<string>("");
  const [eoRainState, setEoRainState] = useState<EoRainState>("off");

  const layerKey = layers.join(",");
  const bangkokFeatureBounds =
    featureCollections.find((collection) => collection.layerId === "bangkok-passages")?.bounds ?? null;
  const nationalCoverageBounds =
    featureCollections.find((collection) => collection.layerId === "smart-city-thailand")?.bounds ?? null;
  const bangkokBoundsKey = bangkokFeatureBounds ? bangkokFeatureBounds.join(":") : "default";
  const nationalBoundsKey = nationalCoverageBounds ? nationalCoverageBounds.join(":") : "default";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      maxBounds: localViewportBounds,
      maxBoundsViscosity: 1,
      minZoom: 10,
      zoomSnap: 0.5
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    map.createPane("eo-overlay-pane");
    const eoPane = map.getPane("eo-overlay-pane");
    if (eoPane) {
      eoPane.style.zIndex = "320";
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    overlayRef.current = L.layerGroup().addTo(map);
    jaxaFallbackRef.current = L.layerGroup();
    
    // Add Satellite Imagery layer but keep it hidden by default until selected
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    });
    
    (map as any).satelliteLayer = satelliteLayer;
    
    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recenterSignal > 0) {
      lastViewportKeyRef.current = "";
    }
  }, [recenterSignal]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const hasNationalCoverageLayer = layers.includes("smart-city-thailand");
    const nextViewportKey =
      view === "national"
        ? `national:${hasNationalCoverageLayer}:${nationalBoundsKey}`
        : citySlug === "bangkok"
          ? `city:${citySlug}:${bangkokBoundsKey}`
          : `city:${citySlug}`;

    if (lastViewportKeyRef.current === nextViewportKey) {
      return;
    }

    lastViewportKeyRef.current = nextViewportKey;

    if (view === "national") {
      // MTT dashboard: "national" means Greater Bangkok coverage, not all-Thailand
      map.fitBounds(greaterBangkokBounds, {
        padding: [18, 18]
      });
      return;
    }

    if (citySlug === "bangkok" && bangkokFeatureBounds) {
      map.fitBounds(
        [
          [bangkokFeatureBounds[0], bangkokFeatureBounds[1]],
          [bangkokFeatureBounds[2], bangkokFeatureBounds[3]]
        ],
        {
          padding: [18, 18]
        }
      );
      return;
    }

    // MTT: fit tight estate bounds for detail, or Greater Bangkok for context
    if (citySlug === "muang-thong-thani") {
      if (view === "city") {
        map.fitBounds(mttBounds, { padding: [24, 24] });
      } else {
        map.fitBounds(northBangkokBounds, { padding: [18, 18] });
      }
      return;
    }

    if (citySlug === "bangkok" || citySlug === "nonthaburi") {
      map.fitBounds(greaterBangkokBounds, {
        padding: [18, 18]
      });
      return;
    }

    const city = cityCenters[citySlug] ?? cityCenters["muang-thong-thani"];
    // All local cities are in Greater Bangkok — use tighter zoom
    const zoom = view === "city" ? 13 : 11;
    map.setView([city.lat, city.lon], zoom);
  }, [view, citySlug, layers, bangkokBoundsKey, nationalBoundsKey]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    overlay.clearLayers();
    const activeLayers = new Set(layers as LayerId[]);
    const focusBounds =
      view === "city" && citySlug === "muang-thong-thani"
        ? northBangkokBounds.pad(0.02)
        : view === "city"
          ? greaterBangkokBounds
          : view === "domain"
            ? northBangkokBounds.pad(0.04)
            : localViewportBounds;

    renderFeatureCollections(overlay, activeLayers, featureCollections, focusBounds, domainSlug);

    if (activeLayers.has("projects")) {
      renderProjects(overlay, locale, projects);
    }
    if (activeLayers.has("news")) {
      renderNews(overlay, locale, news);
    }
    if (activeLayers.has("resilience")) {
      renderResilience(overlay, locale);
    }
    if (activeLayers.has("economy")) {
      renderEconomy(overlay, locale);
    }
    if (activeLayers.has("disaster")) {
      renderDisaster(overlay, locale);
    }
    
    const map = mapRef.current;
    if (map) {
      const satelliteLayer = (map as any).satelliteLayer;
      if (activeLayers.has("satellite-imagery")) {
        if (!map.hasLayer(satelliteLayer)) {
          satelliteLayer.addTo(map);
        }
      } else {
        if (map.hasLayer(satelliteLayer)) {
          map.removeLayer(satelliteLayer);
        }
      }
    }
  }, [citySlug, domainSlug, featureCollections, layerKey, locale, news, projects, view]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const configs = getEoTileConfigs();

    (Object.keys(configs) as EoLayerId[]).forEach((id) => {
      const existingLayer = eoTileLayersRef.current[id];

      if (!layers.includes(id)) {
        if (existingLayer && map.hasLayer(existingLayer)) {
          map.removeLayer(existingLayer);
        }
        return;
      }

      if (existingLayer) {
        if (!map.hasLayer(existingLayer)) {
          existingLayer.addTo(map);
        }
        return;
      }

      const config = configs[id];
      const nextLayer = L.tileLayer(config.url, {
        opacity: config.opacity,
        maxNativeZoom: config.maxNativeZoom,
        maxZoom: 18,
        pane: "eo-overlay-pane",
        attribution: config.attribution
      });

      eoTileLayersRef.current[id] = nextLayer;
      nextLayer.addTo(map);
    });
  }, [layerKey, layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const clearEoRainVisuals = () => {
      try {
        if (jaxaLayerRef.current && map.hasLayer(jaxaLayerRef.current)) {
          map.removeLayer(jaxaLayerRef.current);
        }
      } catch {
        // JAXA library modifies Leaflet DOM directly; removeChild may fail
      }
      jaxaLayerRef.current = null;

      try {
        if (jaxaFallbackRef.current) {
          jaxaFallbackRef.current.clearLayers();
          if (map.hasLayer(jaxaFallbackRef.current)) {
            map.removeLayer(jaxaFallbackRef.current);
          }
        }
      } catch {
        // Same DOM conflict safety
      }
    };

    const showFallback = () => {
      clearEoRainVisuals();

      if (!jaxaFallbackRef.current) {
        setEoRainState("fallback");
        return;
      }

      renderEoRainFallback(jaxaFallbackRef.current, locale, featureCollections);

      if (!map.hasLayer(jaxaFallbackRef.current)) {
        jaxaFallbackRef.current.addTo(map);
      }

      setEoRainState("fallback");
    };

    const shouldShowJaxaRain = layers.includes("jaxa-rainfall");

    if (!shouldShowJaxaRain) {
      clearEoRainVisuals();
      setEoRainState("off");
      return;
    }

    let cancelled = false;
    setEoRainState("loading");

    void (async () => {
      const jaxa = await loadJaxaEarthLibrary();
      const createLayer = jaxa?.leaflet?.createLayer;

      if (!createLayer || cancelled) {
        if (!cancelled) {
          showFallback();
        }
        return;
      }

      try {
        clearEoRainVisuals();
        const nextLayer = await Promise.resolve(
          createLayer({
            L,
            collection: JAXA_GSMAP_DAILY_COLLECTION,
            date: getLatestJaxaRainDate(),
            opacity: 0.42,
            projection: "EPSG:3857"
          })
        );

        if (cancelled) {
          try {
            if (nextLayer && map.hasLayer(nextLayer)) {
              map.removeLayer(nextLayer);
            }
          } catch { /* DOM conflict safety */ }
          return;
        }

        try {
          if (jaxaFallbackRef.current) {
            jaxaFallbackRef.current.clearLayers();
            if (map.hasLayer(jaxaFallbackRef.current)) {
              map.removeLayer(jaxaFallbackRef.current);
            }
          }
        } catch { /* DOM conflict safety */ }

        nextLayer.addTo(map);
        jaxaLayerRef.current = nextLayer;
        setEoRainState("live");
      } catch {
        if (!cancelled) {
          showFallback();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [featureCollections, layerKey, layers, locale]);

  const eoRainStatusLabel =
    eoRainState === "loading"
      ? locale === "th"
        ? "กำลังโหลด EO rain"
        : "EO rain loading"
      : eoRainState === "live"
        ? locale === "th"
          ? "EO rain: JAXA สด"
          : "EO rain: JAXA live"
        : eoRainState === "fallback"
          ? locale === "th"
            ? "EO rain: โหมดสำรอง"
            : "EO rain: fallback preview"
          : "";

  return (
    <div className="leaflet-map-shell">
      <div ref={containerRef} className="leaflet-map" aria-label="Interactive Thailand signal map" />
      {eoRainState !== "off" ? <div className={`map-layer-status ${eoRainState}`}>{eoRainStatusLabel}</div> : null}
    </div>
  );
}
