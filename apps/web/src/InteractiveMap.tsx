import { localize } from "@smart-city/shared";
import type { DashboardView, GeoFeatureRecord, Locale, MapFeatureCollection, NewsItem, ProjectRecord } from "@smart-city/shared";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LayerId =
  | "smart-city-thailand"
  | "bangkok-passages"
  | "projects"
  | "news"
  | "resilience"
  | "economy"
  | "weather"
  | "pollution"
  | "disaster";

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
  }
};

const layerColors: Record<LayerId, string> = {
  "smart-city-thailand": "#ff5b57",
  "bangkok-passages": "#22c55e",
  projects: "#0057ff",
  news: "#0c9b63",
  resilience: "#f59a00",
  economy: "#6246ea",
  weather: "#119fb8",
  pollution: "#c0264f",
  disaster: "#cf5c00"
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
  const route = [
    [cityCenters.phuket.lat, cityCenters.phuket.lon],
    [cityCenters.bangkok.lat, cityCenters.bangkok.lon],
    [cityCenters["khon-kaen"].lat, cityCenters["khon-kaen"].lon],
    [cityCenters["chiang-mai"].lat, cityCenters["chiang-mai"].lon]
  ] as L.LatLngExpression[];

  const line = L.polyline(route, {
    color: layerColors.economy,
    weight: 3,
    opacity: 0.7,
    dashArray: "8 6"
  });
  line.bindTooltip(locale === "th" ? "แนวเชื่อมโยงเศรษฐกิจเมือง" : "City economic linkage corridor");
  line.addTo(target);
}

function renderWeather(target: L.LayerGroup, locale: Locale) {
  [
    { citySlug: "bangkok", value: "31C" },
    { citySlug: "phuket", value: "29C" },
    { citySlug: "khon-kaen", value: "30C" },
    { citySlug: "chiang-mai", value: "27C" }
  ].forEach((item) => {
    const city = cityCenters[item.citySlug];
    const circle = L.circleMarker([city.lat, city.lon], {
      radius: 5,
      color: layerColors.weather,
      fillColor: layerColors.weather,
      fillOpacity: 0.35,
      weight: 2
    });
    circle.bindTooltip(`${localize(locale, city.label)}: ${item.value}`);
    circle.addTo(target);
  });
}

function renderPollution(target: L.LayerGroup, locale: Locale) {
  [
    { citySlug: "chiang-mai", value: "AQI 88" },
    { citySlug: "bangkok", value: "AQI 68" }
  ].forEach((item) => {
    const city = cityCenters[item.citySlug];
    const circle = L.circle([city.lat, city.lon], {
      radius: 30000,
      color: layerColors.pollution,
      weight: 2,
      fillColor: layerColors.pollution,
      fillOpacity: 0.07
    });
    circle.bindTooltip(`${localize(locale, city.label)}: ${item.value}`);
    circle.addTo(target);
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

      if (feature.geometryType !== "Point" || !Array.isArray(feature.coordinates) || feature.coordinates.length < 2) {
        return;
      }

      const [lon, lat] = feature.coordinates as [number, number];
      const isBangkokPlaces = collection.layerId === "bangkok-passages";
      const isNationalFootprint = collection.layerId === "smart-city-thailand";
      const marker = L.circleMarker([lat, lon], {
        radius: isNationalFootprint ? 7 : isBangkokPlaces ? 6 : 4,
        color: layerColors[collection.layerId as LayerId] ?? "#22c55e",
        fillColor: layerColors[collection.layerId as LayerId] ?? "#22c55e",
        fillOpacity: isNationalFootprint ? 0.5 : 0.35,
        weight: 2
      });

      const popupContent = `
        <div style="display:grid;gap:4px;min-width:180px;">
          <strong>${feature.title}</strong>
          ${feature.description ? `<span>${feature.description}</span>` : ""}
          <small>${feature.source.sourceName}</small>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(target);
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
}

export default function InteractiveMap({
  locale,
  view,
  citySlug,
  domainSlug,
  layers,
  projects,
  news,
  featureCollections
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const lastViewportKeyRef = useRef<string>("");

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
      attributionControl: true
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      overlayRef.current?.clearLayers();
      overlayRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
    map.setView([city.lat, city.lon], view === "city" ? 10 : 8);
  }, [view, citySlug, layers, bangkokBoundsKey, nationalBoundsKey]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    overlay.clearLayers();
    const activeLayers = new Set(layers as LayerId[]);

    renderFeatureCollections(overlay, activeLayers, featureCollections, domainSlug);

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
    if (activeLayers.has("weather")) {
      renderWeather(overlay, locale);
    }
    if (activeLayers.has("pollution")) {
      renderPollution(overlay, locale);
    }
    if (activeLayers.has("disaster")) {
      renderDisaster(overlay, locale);
    }
  }, [domainSlug, featureCollections, layerKey, locale, news, projects]);

  return <div ref={containerRef} className="leaflet-map" aria-label="Interactive Thailand signal map" />;
}
