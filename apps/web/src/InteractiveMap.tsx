import { localize } from "@smart-city/shared";
import type {
  DashboardView,
  DistrictProfile,
  GeoFeatureRecord,
  Locale,
  MapFeatureCollection,
  NewsItem,
  ProjectRecord,
  PublicCctvCamera
} from "@smart-city/shared";
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
  | "eo-soil-moisture"
  | "eo-cloud-phase"
  | "eo-snow-cover"
  | "eo-fire-thermal"
  | "eo-chlorophyll"
  | "jaxa-rainfall"
  | "satellite-imagery"
  | "satellite-vegetation"
  | "satellite-aerosol"
  | "satellite-surface-temp"
  | "satellite-thermal"
  | "satellite-water-vapor"
  | "satellite-sea-surface-temp"
  | "satellite-night-lights"
  | "disaster"
  | "itic-traffic"
  | "cctv-cameras"
  | "mtt-grid";

type EoRainState = "off" | "loading" | "live" | "fallback";
type SatelliteLayerId =
  | "satellite-imagery"
  | "satellite-vegetation"
  | "satellite-aerosol"
  | "satellite-surface-temp"
  | "satellite-thermal"
  | "satellite-water-vapor"
  | "satellite-sea-surface-temp"
  | "satellite-night-lights";

const thailandBounds = L.latLngBounds([5.6, 97.2], [20.6, 105.9]);
const bangkokBounds = L.latLngBounds([13.45, 100.35], [13.95, 100.85]);

const cityCenters: Record<
  string,
  {
    label: { th: string; en: string };
    lat: number;
    lon: number;
  }
> = {
  bangkok: {
    label: { th: "กรุงเทพมหานคร", en: "Bangkok" },
    lat: 13.7563,
    lon: 100.5018
  },
  phuket: {
    label: { th: "ภูเก็ต", en: "Phuket" },
    lat: 7.8804,
    lon: 98.3923
  },
  "khon-kaen": {
    label: { th: "ขอนแก่น", en: "Khon Kaen" },
    lat: 16.4322,
    lon: 102.8236
  },
  "chiang-mai": {
    label: { th: "เชียงใหม่", en: "Chiang Mai" },
    lat: 18.7883,
    lon: 98.9853
  },
  "chon-buri": {
    label: { th: "ชลบุรี", en: "Chon Buri" },
    lat: 13.3611,
    lon: 100.9847
  },
  "hat-yai": {
    label: { th: "หาดใหญ่", en: "Hat Yai" },
    lat: 7.0084,
    lon: 100.4747
  },
  phrae: {
    label: { th: "แพร่", en: "Phrae" },
    lat: 18.1459,
    lon: 100.1408
  },
  lampang: {
    label: { th: "ลำปาง", en: "Lampang" },
    lat: 18.2888,
    lon: 99.4908
  },
  "nakhon-ratchasima": {
    label: { th: "นครราชสีมา", en: "Nakhon Ratchasima" },
    lat: 14.9799,
    lon: 102.0978
  },
  "muang-thong-thani": {
    label: { th: "เมืองทองธานี", en: "Muang Thong Thani" },
    lat: 13.9118,
    lon: 100.5512
  }
};

const layerColors: Record<LayerId, string> = {
  "smart-city-thailand": "#ff5b57",
  "bangkok-passages": "#22c55e",
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
  "eo-soil-moisture": "#b45309",
  "eo-cloud-phase": "#94a3b8",
  "eo-snow-cover": "#e0f2fe",
  "eo-fire-thermal": "#ef4444",
  "eo-chlorophyll": "#059669",
  "jaxa-rainfall": "#0f8cff",
  "satellite-imagery": "#e2e8f0",
  "satellite-vegetation": "#4ade80",
  "satellite-aerosol": "#f59e0b",
  "satellite-surface-temp": "#fb7185",
  "satellite-thermal": "#f97316",
  "satellite-water-vapor": "#38bdf8",
  "satellite-sea-surface-temp": "#14b8a6",
  "satellite-night-lights": "#8b5cf6",
  disaster: "#cf5c00",
  "itic-traffic": "#ef4444",
  "cctv-cameras": "#34d399",
  "mtt-grid": "#94a3b8"
};

const EO_LAYER_IDS: readonly EoLayerId[] = [
  "eo-aerosol",
  "eo-precipitation",
  "eo-vegetation",
  "eo-soil-moisture",
  "eo-cloud-phase",
  "eo-snow-cover",
  "eo-fire-thermal",
  "eo-chlorophyll"
];
const satelliteLayerDefinitions: Record<
  SatelliteLayerId,
  {
    url: string;
    opacity: number;
    maxZoom: number;
    attribution?: string;
  }
> = {
  "satellite-imagery": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    opacity: 0.92,
    maxZoom: 9
  },
  "satellite-vegetation": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
    opacity: 0.58,
    maxZoom: 9
  },
  "satellite-aerosol": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/all/OMPS_NOAA20_NadirMapper_AerosolIndex_360_v2_NRT/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png",
    opacity: 0.52,
    maxZoom: 6
  },
  "satellite-surface-temp": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Land_Surface_Temp_Day/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
    opacity: 0.58,
    maxZoom: 7
  },
  "satellite-thermal": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Brightness_Temp_Band31_Day/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
    opacity: 0.62,
    maxZoom: 7
  },
  "satellite-water-vapor": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Water_Vapor_5km_Day/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png",
    opacity: 0.46,
    maxZoom: 6
  },
  "satellite-sea-surface-temp": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
    opacity: 0.54,
    maxZoom: 7
  },
  "satellite-night-lights": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/all/VIIRS_Black_Marble/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
    opacity: 0.5,
    maxZoom: 8
  }
};

const satelliteAttribution = 'Imagery courtesy of <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs">NASA GIBS</a>';

function applyTileLayerVisuals(
  layer: L.TileLayer,
  visuals: {
    opacity: number;
    blendMode: "normal" | "multiply" | "screen" | "overlay";
    order: number;
  }
) {
  layer.setOpacity(visuals.opacity);
  layer.setZIndex(220 + visuals.order);

  const container = layer.getContainer();
  if (container) {
    container.style.mixBlendMode = visuals.blendMode;
  }
}

function applyGenericLayerVisuals(
  layer: L.Layer | null,
  visuals: {
    opacity: number;
    blendMode: "normal" | "multiply" | "screen" | "overlay";
    order: number;
  }
) {
  if (!layer) {
    return;
  }

  const withOpacity = layer as L.Layer & { setOpacity?: (value: number) => void };
  const withZIndex = layer as L.Layer & { setZIndex?: (value: number) => void };
  const withContainer = layer as L.Layer & { getContainer?: () => HTMLElement | null };

  if (typeof withOpacity.setOpacity === "function") {
    withOpacity.setOpacity(visuals.opacity);
  }

  if (typeof withZIndex.setZIndex === "function") {
    withZIndex.setZIndex(220 + visuals.order);
  }

  if (typeof withContainer.getContainer === "function") {
    const container = withContainer.getContainer();
    if (container) {
      container.style.mixBlendMode = visuals.blendMode;
      container.style.opacity = String(visuals.opacity);
    }
  }
}

/* International base map tile sources for terminal ops-center mode */
const basemapSources = {
  /* Dark vector tiles - primary for terminal mode */
  darkMatter: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20
  },
  /* Standard OSM fallback */
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  },
  /* Esri satellite imagery */
  esriSatellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 18
  },
  /* Esri dark gray canvas - minimal labels */
  esriDarkGray: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 16
  },
  /* OpenTopoMap - elevation/terrain context */
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17
  }
} as const;

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
    { citySlug: "bangkok", radius: 22000, label: { th: "เฝ้าระวังน้ำ", en: "Flood watch" } },
    { citySlug: "chiang-mai", radius: 18000, label: { th: "เฝ้าระวังอากาศ", en: "Air-quality watch" } }
  ].forEach((item) => {
    const city = cityCenters[item.citySlug];
    const circle = L.circle([city.lat, city.lon], {
      radius: item.radius,
      color: layerColors.resilience,
      weight: 2,
      fillColor: layerColors.resilience,
      fillOpacity: 0.08
    });
    circle.bindTooltip(`${localize(locale, city.label)}: ${localize(locale, item.label)}`);
    circle.addTo(target);
  });
}

function renderEconomy(target: L.LayerGroup, locale: Locale) {
  [
    { citySlug: "bangkok", value: 82 },
    { citySlug: "phuket", value: 76 },
    { citySlug: "khon-kaen", value: 71 },
    { citySlug: "chiang-mai", value: 74 }
  ].forEach((item) => {
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

const cctvSourceClass: Record<string, string> = {
  "Pak Kret Municipality": "source-pak-kret",
  "BMA Traffic": "source-bma",
  "Dept of Highways": "source-doh",
  "Nonthaburi Province": "source-nonthaburi",
  "EXAT": "source-exat"
};

function renderCctvCameras(target: L.LayerGroup, locale: Locale, cameras: PublicCctvCamera[]) {
  cameras.forEach((cam) => {
    const srcClass = cctvSourceClass[cam.source] ?? "";
    const icon = L.divIcon({
      className: `cctv-marker-dot ${srcClass}`.trim(),
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([cam.lat, cam.lon], { icon });

    const label = localize(locale, cam.label);
    const previewImageUrl = cam.previewUrl || cam.imageUrl;
    const fallbackImageUrl =
      cam.cameraId.startsWith("CAMPK") && previewImageUrl.includes("thaiclouderp.com/CCTV_MONITOR/src/img.php")
        ? `https://camera1.iticfoundation.org/jpeg2.php?camid=${encodeURIComponent(cam.cameraId)}`
        : "";
    const statusText =
      cam.status === "live"
        ? locale === "th"
          ? "สด"
          : "Live"
        : cam.status === "offline"
          ? locale === "th"
            ? "สัญญาณขัดข้อง"
            : "Signal down"
          : locale === "th"
            ? "ไม่ทราบ"
            : "Unknown";
    const statusDetail = cam.statusDetail ? localize(locale, cam.statusDetail) : statusText;
    const checkedAtText = cam.lastCheckedAt
      ? new Date(cam.lastCheckedAt).toLocaleString(locale === "th" ? "th-TH" : "en-US", {
          dateStyle: "short",
          timeStyle: "short"
        })
      : "";
    marker.bindTooltip(label, { direction: "top", offset: [0, -10] });

    const mediaHtml =
      cam.status === "offline"
        ? `
        <div style="display:grid;place-items:center;min-height:124px;border-radius:2px;background:#111827;color:#fca5a5;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">
          ${statusText}
        </div>
      `
        : `
        <img
          src="${previewImageUrl}"
          data-fallback-src="${fallbackImageUrl}"
          alt="${label}"
          style="width:100%;border-radius:2px;aspect-ratio:16/9;object-fit:cover;background:#111;"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="if (this.dataset.fallbackSrc && this.src !== this.dataset.fallbackSrc) { this.src = this.dataset.fallbackSrc; return; } const down=this.nextElementSibling; if (down) { down.style.display='grid'; } this.style.display='none'"
        />
        <div style="display:none;place-items:center;min-height:124px;border-radius:2px;background:#111827;color:#fca5a5;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">
          ${locale === "th" ? "สัญญาณขัดข้อง" : "Signal down"}
        </div>
      `;

    const popupHtml = `
      <div style="display:grid;gap:6px;min-width:220px;max-width:280px;">
        <strong style="font-size:13px;">${label}</strong>
        ${mediaHtml}
        <div style="display:flex;gap:8px;align-items:center;font-size:11px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cam.status === "live" ? "#34d399" : cam.status === "offline" ? "#f87171" : "#fbbf24"};"></span>
          <span>${statusText}</span>
          <span style="opacity:0.5;">•</span>
          <span>${cam.source}</span>
        </div>
        <small style="opacity:0.6;">${cam.cameraId} • ${cam.zone}</small>
        <small style="opacity:0.75;">${statusDetail}${checkedAtText ? ` • ${checkedAtText}` : ""}</small>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 300, minWidth: 220 });
    marker.addTo(target);
  });
}

/**
 * Renders a 500 m × 500 m reference grid over the Muang Thong Thani area.
 * Grid lines are drawn as Leaflet polylines; cell labels (e.g. A1, B2) are
 * placed at each intersection using DivIcon markers.
 */
function renderMttGrid(target: L.LayerGroup) {
  // Muang Thong Thani area bounds (roughly 4 km × 4 km centred on the development)
  const south = 13.890;
  const north = 13.930;
  const west  = 100.520;
  const east  = 100.560;

  // 500 m in degrees at ~14°N latitude
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos((13.91 * Math.PI) / 180);
  const stepLat = 500 / mPerDegLat;
  const stepLon = 500 / mPerDegLon;

  const lineStyle: L.PolylineOptions = {
    color: "rgba(148,163,184,0.30)",
    weight: 1,
    dashArray: "4 4",
    interactive: false
  };

  const cols: number[] = [];
  for (let lon = west; lon <= east + 1e-9; lon += stepLon) cols.push(lon);

  const rows: number[] = [];
  for (let lat = south; lat <= north + 1e-9; lat += stepLat) rows.push(lat);

  // Horizontal lines
  rows.forEach((lat) => {
    L.polyline(
      [
        [lat, west],
        [lat, east]
      ],
      lineStyle
    ).addTo(target);
  });

  // Vertical lines
  cols.forEach((lon) => {
    L.polyline(
      [
        [south, lon],
        [north, lon]
      ],
      lineStyle
    ).addTo(target);
  });

  // Cell labels at top-left corner of each cell
  const colLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols.length - 1; c++) {
      const cellLabel = `${colLetters[c] ?? c}${r + 1}`;
      const labelIcon = L.divIcon({
        className: "grid-label",
        html: cellLabel,
        iconSize: [24, 12],
        iconAnchor: [0, 0]
      });
      L.marker([rows[r] + stepLat * 0.94, cols[c] + stepLon * 0.04], {
        icon: labelIcon,
        interactive: false
      }).addTo(target);
    }
  }

  // Scale reference at the bottom-right corner
  const scaleIcon = L.divIcon({
    className: "grid-label",
    html: "500 m grid",
    iconSize: [50, 12],
    iconAnchor: [50, 12]
  });
  L.marker([south + stepLat * 0.15, east - stepLon * 0.15], {
    icon: scaleIcon,
    interactive: false
  }).addTo(target);
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

function toLeafletLatLngs(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<[number, number]>;
  }

  return value
    .map((entry) => normalizeCoordinatePair(entry))
    .filter((entry): entry is [number, number] => Boolean(entry))
    .map(([lon, lat]) => [lat, lon] as [number, number]);
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
  if (locale) {
    // Intentionally no synthetic fallback geometry.
  }
  if (featureCollections) {
    // Keep the signature stable for the JAXA fallback call site.
  }
}

function renderFeatureCollections(
  target: L.LayerGroup,
  activeLayers: Set<LayerId>,
  featureCollections: MapFeatureCollection[],
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
            ? 7
            : isBangkokPlaces
              ? 6
              : collection.layerId === "itic-traffic"
                ? 6
              : isPollutionLayer
                ? Math.max(5, Math.min(10, 4 + intensity / 20))
                : collection.layerId === "weather"
                  ? 6
                  : collection.layerId === "agriculture" || collection.layerId === "water" || collection.layerId === "land-use"
                    ? 5
                  : 4,
          color: pointColor,
          fillColor: pointColor,
          fillOpacity: isNationalFootprint ? 0.5 : isPollutionLayer ? 0.28 : 0.35,
          weight: 2
        });

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
              ? 5
              : collection.layerId === "agriculture"
                ? 4.5
                : 4,
          opacity: 0.82,
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
          weight: collection.layerId === "smart-city-thailand" ? 2 : 1.5,
          fillColor: pointColor,
          fillOpacity:
            collection.layerId === "economy"
              ? 0.12
              : collection.layerId === "agriculture"
                ? 0.14
                : collection.layerId === "water"
                  ? 0.1
                  : collection.layerId === "land-use"
                    ? 0.11
              : collection.layerId === "resilience"
                ? 0.1
                : collection.layerId === "projects"
                  ? 0.08
                  : collection.layerId === "disaster"
                    ? 0.11
                    : 0.09
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
  district?: DistrictProfile;
  domainSlug?: string;
  basemap: "atlas" | "satellite";
  layers: string[];
  overlayStyles: Record<
    string,
    {
      opacity: number;
      blendMode: "normal" | "multiply" | "screen" | "overlay";
      order: number;
    }
  >;
  projects: ProjectRecord[];
  news: NewsItem[];
  featureCollections: MapFeatureCollection[];
  publicCctvCameras: PublicCctvCamera[];
  recenterSignal: number;
}

export default function InteractiveMap({
  locale,
  view,
  citySlug,
  district,
  domainSlug,
  basemap,
  layers,
  overlayStyles,
  projects,
  news,
  featureCollections,
  publicCctvCameras,
  recenterSignal
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const atlasBaseRef = useRef<L.TileLayer | null>(null);
  const satelliteBaseRef = useRef<L.TileLayer | null>(null);
  const eoLayerRefs = useRef<Partial<Record<EoLayerId, L.TileLayer>>>({});
  const satelliteLayersRef = useRef<Partial<Record<SatelliteLayerId, L.TileLayer>>>({});
  const jaxaLayerRef = useRef<L.Layer | null>(null);
  const jaxaFallbackRef = useRef<L.LayerGroup | null>(null);
  const lastViewportKeyRef = useRef<string>("");
  const [eoRainState, setEoRainState] = useState<EoRainState>("off");

  const layerKey = layers.join(",");
  const overlayStyleKey = Object.entries(overlayStyles)
    .sort((left, right) => left[1].order - right[1].order)
    .map(([id, value]) => `${id}:${value.opacity}:${value.blendMode}:${value.order}`)
    .join("|");
  const bangkokFeatureBounds =
    featureCollections.find((collection) => collection.layerId === "bangkok-passages")?.bounds ?? null;
  const nationalCoverageBounds =
    featureCollections.find((collection) => collection.layerId === "smart-city-thailand")?.bounds ?? null;
  const bangkokBoundsKey = bangkokFeatureBounds ? bangkokFeatureBounds.join(":") : "default";
  const nationalBoundsKey = nationalCoverageBounds ? nationalCoverageBounds.join(":") : "default";
  const districtBoundsKey = district?.bounds ? district.bounds.join(":") : "";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 5,
      maxBoundsViscosity: 0.85
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    const atlasLayer = L.tileLayer(basemapSources.darkMatter.url, {
      maxZoom: basemapSources.darkMatter.maxZoom,
      attribution: basemapSources.darkMatter.attribution
    }).addTo(map);
    const satelliteLayer = L.tileLayer(basemapSources.esriSatellite.url, {
      maxZoom: basemapSources.esriSatellite.maxZoom,
      attribution: basemapSources.esriSatellite.attribution
    });

    atlasBaseRef.current = atlasLayer;
    satelliteBaseRef.current = satelliteLayer;
    map.setMaxBounds(thailandBounds.pad(0.22));

    overlayRef.current = L.layerGroup().addTo(map);
    jaxaFallbackRef.current = L.layerGroup();

    satelliteLayersRef.current = Object.fromEntries(
      Object.entries(satelliteLayerDefinitions).map(([id, definition]) => [
        id,
        L.tileLayer(definition.url, {
          attribution: satelliteAttribution,
          opacity: definition.opacity,
          maxZoom: definition.maxZoom
        })
      ])
    ) as Partial<Record<SatelliteLayerId, L.TileLayer>>;

    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const atlasLayer = atlasBaseRef.current;
    const satelliteLayer = satelliteBaseRef.current;
    if (!map || !atlasLayer || !satelliteLayer) {
      return;
    }

    const activeBase = basemap === "satellite" ? satelliteLayer : atlasLayer;
    const inactiveBase = basemap === "satellite" ? atlasLayer : satelliteLayer;

    if (!map.hasLayer(activeBase)) {
      activeBase.addTo(map);
    }

    if (map.hasLayer(inactiveBase)) {
      map.removeLayer(inactiveBase);
    }

    activeBase.bringToBack();
  }, [basemap]);

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
        : district
          ? `district:${citySlug}:${district.slug}:${districtBoundsKey}`
        : citySlug === "bangkok"
          ? `city:${citySlug}:${bangkokBoundsKey}`
          : `city:${citySlug}`;

    if (lastViewportKeyRef.current === nextViewportKey) {
      return;
    }

    lastViewportKeyRef.current = nextViewportKey;

    if (view === "national") {
      if (hasNationalCoverageLayer && nationalCoverageBounds) {
        map.fitBounds(
          [
            [nationalCoverageBounds[0], nationalCoverageBounds[1]],
            [nationalCoverageBounds[2], nationalCoverageBounds[3]]
          ],
          {
            padding: [18, 18]
          }
        );
        return;
      }

      map.fitBounds(thailandBounds, {
        padding: [18, 18]
      });
      return;
    }

    if (district?.bounds) {
      map.fitBounds(
        [
          [district.bounds[0], district.bounds[1]],
          [district.bounds[2], district.bounds[3]]
        ],
        {
          padding: [18, 18]
        }
      );
      return;
    }

    if (district?.center) {
      map.setView([district.center[1], district.center[0]], 12);
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

    if (citySlug === "bangkok") {
      map.fitBounds(bangkokBounds, {
        padding: [18, 18]
      });
      return;
    }

    const city = cityCenters[citySlug] ?? cityCenters.bangkok;
    const zoom = citySlug === "muang-thong-thani" ? 14 : (view === "city" ? 10 : 8);
    map.setView([city.lat, city.lon], zoom);
  }, [view, citySlug, district, layers, bangkokBoundsKey, districtBoundsKey, nationalBoundsKey]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    overlay.clearLayers();
    const activeLayers = new Set(layers as LayerId[]);

    renderFeatureCollections(overlay, activeLayers, featureCollections, domainSlug);

    if (activeLayers.has("cctv-cameras")) {
      renderCctvCameras(overlay, locale, publicCctvCameras);
    }

    if (activeLayers.has("mtt-grid")) {
      renderMttGrid(overlay);
    }

    const map = mapRef.current;
    if (map) {
      Object.entries(satelliteLayersRef.current).forEach(([id, layer]) => {
        if (!layer) {
          return;
        }

        if (activeLayers.has(id as LayerId)) {
          if (!map.hasLayer(layer)) {
            layer.addTo(map);
          }
          applyTileLayerVisuals(layer, overlayStyles[id] ?? {
            opacity: satelliteLayerDefinitions[id as SatelliteLayerId].opacity,
            blendMode: "normal",
            order: 0
          });
          return;
        }

        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    }
  }, [domainSlug, featureCollections, layerKey, locale, overlayStyleKey, overlayStyles, publicCctvCameras]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const configs = getEoTileConfigs();
    const activeEoLayers = new Set(EO_LAYER_IDS.filter((id) => layers.includes(id)));

    EO_LAYER_IDS.forEach((id) => {
      const existingLayer = eoLayerRefs.current[id];

      if (!activeEoLayers.has(id)) {
        if (existingLayer && map.hasLayer(existingLayer)) {
          map.removeLayer(existingLayer);
        }
        delete eoLayerRefs.current[id];
        return;
      }

      const config = configs[id];
      if (!config) {
        return;
      }
      const visuals = overlayStyles[id] ?? {
        opacity: config.opacity,
        blendMode: "multiply",
        order: 0
      };

      if (existingLayer) {
        existingLayer.setUrl(config.url);
        applyTileLayerVisuals(existingLayer, visuals);
        if (!map.hasLayer(existingLayer)) {
          existingLayer.addTo(map);
        }
        return;
      }

      const nextLayer = L.tileLayer(config.url, {
        opacity: visuals.opacity,
        maxZoom: 18,
        maxNativeZoom: config.maxNativeZoom,
        attribution: config.attribution,
        crossOrigin: true
      });

      nextLayer.addTo(map);
      applyTileLayerVisuals(nextLayer, visuals);
      eoLayerRefs.current[id] = nextLayer;
    });
  }, [layers, overlayStyleKey, overlayStyles]);

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
      const jaxaVisuals = overlayStyles["jaxa-rainfall"] ?? {
        opacity: 0.42,
        blendMode: "overlay",
        order: 0
      };

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
            opacity: jaxaVisuals.opacity,
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
        applyGenericLayerVisuals(nextLayer, jaxaVisuals);
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
  }, [featureCollections, layerKey, layers, locale, overlayStyleKey, overlayStyles]);

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
            ? "EO rain: รอภาพชั้นข้อมูล"
            : "EO rain: awaiting raster"
          : "";

  return (
    <div className="leaflet-map-shell">
      <div ref={containerRef} className="leaflet-map" aria-label="Interactive Thailand signal map" />
      {eoRainState !== "off" ? <div className={`map-layer-status ${eoRainState}`}>{eoRainStatusLabel}</div> : null}
    </div>
  );
}
