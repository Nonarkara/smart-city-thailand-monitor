import { useQuery } from "@tanstack/react-query";
import {
  cloneSeed,
  createOverviewSnapshot,
  createTimeSnapshot,
  localize,
  mapFeatureCollections as mapFeatureSeed,
  mapLayers as layerSeed,
  mediaFeeds as mediaFeedSeed,
  news as newsSeed,
  projects as projectSeed,
  resilience as resilienceSeed,
  sources as sourceSeed
} from "@smart-city/shared";
import type {
  DashboardView,
  Locale,
  MapFeatureCollection,
  MediaFeedItem,
  NewsItem,
  OverviewSnapshot,
  ProjectRecord,
  ResilienceSnapshot,
  SourceRecord,
  TimeRange,
  TimeSnapshot
} from "@smart-city/shared";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState
} from "react";
import { NavLink, Route, Routes, useSearchParams } from "react-router-dom";
import {
  createDashboardSkeletonExport,
  createGoogleTrendsUrl,
  pickLocalized,
  researchInsights,
  toolkitLinks,
  trendWatchItems
} from "./content";
import InteractiveMap from "./InteractiveMap";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";
const LIVE_POLL_INTERVAL_MS = 300000;

const copyDeck = {
  th: {
    title: "Smart City Thailand Monitor",
    brandEyebrow: "แดชบอร์ดปฏิบัติการสาธารณะ",
    subtitle: "แดชบอร์ดทดลองสาธารณะสำหรับติดตามสัญญาณเมืองอัจฉริยะไทย",
    view: "มุมมอง",
    range: "ช่วงเวลา",
    share: "คัดลอกลิงก์",
    copied: "คัดลอกแล้ว",
    sync: "ความสดของข้อมูล",
    search: "ค้นหาเมือง โครงการ หรือหัวข้อ",
    publicView: "สาธารณะ",
    admin: "คอนโซล",
    topLine: "สัญญาณหลัก",
    projects: "โครงการ",
    news: "ข่าว",
    resilience: "ความยืดหยุ่น",
    compare: "เปรียบเทียบเมือง",
    sources: "แหล่งข้อมูล",
    briefing: "สรุปสถานการณ์",
    time: "เวลาอ้างอิง",
    map: "แผนที่สัญญาณ",
    official: "ข่าวภายใน",
    external: "ข่าวภายนอก",
    adminToken: "โทเค็นผู้ดูแล",
    syncNow: "ซิงก์แหล่งข้อมูล",
    publishBriefing: "เผยแพร่สรุป",
    refreshHealth: "ดึงสถานะ",
    adminHelp: "คอนโซลนี้เรียกใช้ API ฝั่งหลังบ้านผ่าน `x-admin-token` เท่านั้น",
    trendWatch: "Google Trends Watch",
    research: "Why This Dashboard Exists",
    toolkit: "Build It Yourself",
    exportJson: "คัดลอก JSON โครงร่าง",
    exported: "คัดลอก JSON แล้ว",
    apiDirectory: "8 APIs / Data Ports",
    stack: "Applications Used",
    finePrint: "ข้อกำหนดและคำชี้แจง",
    privacy: "แดชบอร์ดสาธารณะนี้ไม่ตั้งใจเก็บข้อมูลส่วนบุคคลของผู้ใช้งานทั่วไป และแสดงผลจากข้อมูลสาธารณะ ข้อมูลทดลอง และข้อมูลที่จัดการภายในตามบริบทของต้นแบบ",
    experimental:
      "ต้นแบบนี้เป็นแดชบอร์ดเชิงทดลอง ออกแบบโดย ดร. นน อัครประเสริฐกุล Senior Expert in Smart City Promotion ที่ depa ในฐานะงานทดลองส่วนตัวเพื่อชวนให้คนอื่นสร้างแอปเมืองของตนเองได้",
    builder:
      "แนวคิดหลักคือวันนี้ไม่ควรมีข้ออ้างอีกต่อไปว่าต้องมีพื้นฐาน computer science แบบเดิมถึงจะสร้างเครื่องมือดิจิทัลได้ คุณสามารถใช้ Codex หรือ no-code platform เพื่อเริ่มจากโครงร่างนี้แล้วต่อยอดเอง",
    trendNote:
      "แต่ละแถวแสดงค่าดัชนีล่าสุด การเปลี่ยนแปลง ค่าสูงสุด และค่าเฉลี่ยของคำค้น พร้อมลิงก์เปิด Google Trends ประเทศไทยโดยตรง",
    trendNow: "ล่าสุด",
    trendDelta: "เปลี่ยน",
    trendPeak: "สูงสุด",
    trendAverage: "เฉลี่ย",
    sourceResearch:
      "แหล่งอ้างอิงภายนอกใช้เพื่ออธิบายวิธีคิดของเมืองต่อ dashboards, livability, และ city-as-a-platform",
    copyright:
      "ลิขสิทธิ์ เครื่องหมายการค้า และข้อมูลภายนอกเป็นของเจ้าของแต่ละราย ต้นแบบนี้เผยแพร่เป็นทรัพยากรการเรียนรู้แบบเปิด และควรตรวจสอบข้อมูลซ้ำก่อนใช้เชิงปฏิบัติการ"
  },
  en: {
    title: "Smart City Thailand Monitor",
    brandEyebrow: "Public Operations Dashboard",
    subtitle: "Experimental public dashboard for Thailand’s smart city pulse",
    view: "View",
    range: "Time Range",
    share: "Copy Link",
    copied: "Copied",
    sync: "Data Freshness",
    search: "Search cities, projects, or topics",
    publicView: "Public",
    admin: "Console",
    topLine: "Current Pulse",
    projects: "Projects",
    news: "News",
    resilience: "Resilience",
    compare: "City Compare",
    sources: "Sources",
    briefing: "Briefing",
    time: "Reference Time",
    map: "Signal Map",
    official: "Official",
    external: "External",
    adminToken: "Admin token",
    syncNow: "Run sync",
    publishBriefing: "Publish briefing",
    refreshHealth: "Load source health",
    adminHelp: "This console only calls backend admin APIs with an `x-admin-token` header.",
    trendWatch: "Google Trends Watch",
    research: "Why This Dashboard Exists",
    toolkit: "Build It Yourself",
    exportJson: "Copy JSON Skeleton",
    exported: "JSON copied",
    apiDirectory: "8 APIs / Data Ports",
    stack: "Applications Used",
    finePrint: "Fine Print",
    privacy:
      "This public dashboard is not intended to collect personal data from general visitors and is designed to surface public, experimental, and manually curated operational signals.",
    experimental:
      "This is an experimental dashboard designed by Dr. Non Arkaraprasertkul, Senior Expert in Smart City Promotion at depa, as a hobby project that became a practical civic design exercise.",
    builder:
      "The point is simple: there is no longer a credible excuse that building useful civic software must wait for formal computer-science training. This skeleton is meant to help others build their own tools with Codex or any no-code platform.",
    trendNote:
      "Each row shows the current index, change, peak, and average for the tracked term, and opens Google Trends for Thailand directly.",
    trendNow: "Now",
    trendDelta: "Delta",
    trendPeak: "Peak",
    trendAverage: "Avg",
    sourceResearch:
      "External references are included to show how cities use dashboards for operations, livability, and city-as-a-platform thinking.",
    copyright:
      "Copyright, trademarks, and external datasets remain with their respective owners. This prototype is shared as an open learning resource and should be independently validated before operational use."
  }
} as const;

async function fetchFromApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function parseLayerSet(raw: string | null) {
  if (!raw) {
    return layerSeed.filter((item) => item.active).map((item) => item.id);
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Sparkline({ values }: { values: number[] }) {
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - value}`).join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function getTrendStats(values: number[]) {
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? latest;
  const peak = Math.max(...values);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));

  return {
    latest,
    delta: latest - previous,
    peak,
    average
  };
}

function formatUtcClock(value?: string) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toISOString().slice(11, 16);
}

function useDashboardData(searchParams: URLSearchParams) {
  const lang = (searchParams.get("lang") === "th" ? "th" : "en") as Locale;
  const view = (searchParams.get("view") as DashboardView) || "city";
  const timeRange = (searchParams.get("timeRange") as TimeRange) || "7d";
  const city = searchParams.get("city") ?? "bangkok";
  const domain = searchParams.get("domain") ?? "";
  const layers = parseLayerSet(searchParams.get("layers"));
  const cityFilter = view === "national" ? "" : city;
  const queryString = new URLSearchParams(searchParams);

  queryString.set("view", view);
  queryString.set("timeRange", timeRange);
  queryString.set("city", city);
  queryString.set("layers", layers.join(","));
  queryString.set("lang", lang);
  if (domain) {
    queryString.set("domain", domain);
  } else {
    queryString.delete("domain");
  }

  const overviewFallback = createOverviewSnapshot({
    view,
    timeRange,
    city,
    domain: domain || undefined,
    layers
  });

  const overviewQuery = useQuery({
    queryKey: ["overview", queryString.toString()],
    queryFn: () => fetchFromApi<OverviewSnapshot>(`/api/overview?${queryString.toString()}`, overviewFallback),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", city, domain],
    queryFn: () =>
      fetchFromApi<ProjectRecord[]>(
        `/api/projects${cityFilter ? `?city=${cityFilter}` : "?"}${domain ? `${cityFilter ? "&" : ""}domain=${domain}` : ""}`,
        cloneSeed(
          projectSeed.filter((project) => {
            if (cityFilter && project.citySlug !== cityFilter) return false;
            if (domain && project.domainSlug !== domain) return false;
            return true;
          })
        )
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const newsQuery = useQuery({
    queryKey: ["news", city, domain],
    queryFn: () =>
      fetchFromApi<NewsItem[]>(
        `/api/news?limit=8${cityFilter ? `&city=${cityFilter}` : ""}${domain ? `&domain=${domain}` : ""}`,
        cloneSeed(
          newsSeed.filter((item) => {
            if (cityFilter && item.citySlug && item.citySlug !== cityFilter) return false;
            if (domain && item.domainSlug && item.domainSlug !== domain) return false;
            return true;
          })
        )
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const resilienceQuery = useQuery({
    queryKey: ["resilience"],
    queryFn: () => fetchFromApi<ResilienceSnapshot>("/api/resilience", cloneSeed(resilienceSeed)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const sourcesQuery = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchFromApi<SourceRecord[]>("/api/sources", cloneSeed(sourceSeed)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const mapFeaturesQuery = useQuery({
    queryKey: ["map-features", layers.join(","), city],
    queryFn: () =>
      fetchFromApi<MapFeatureCollection[]>(
        `/api/map/features?layers=${encodeURIComponent(layers.join(","))}`,
        cloneSeed(
          mapFeatureSeed.filter((collection) => layers.includes(collection.layerId) || collection.layerId === "bangkok-passages")
        )
      ),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const mediaFeedsQuery = useQuery({
    queryKey: ["media-feeds"],
    queryFn: () => fetchFromApi<MediaFeedItem[]>("/api/media/feeds", cloneSeed(mediaFeedSeed)),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  const timeQuery = useQuery({
    queryKey: ["time"],
    queryFn: () => fetchFromApi<TimeSnapshot>("/api/time", createTimeSnapshot()),
    refetchInterval: 1000
  });

  return {
    lang,
    view,
    timeRange,
    city,
    domain,
    layers,
    overview: overviewQuery.data ?? overviewFallback,
    projects: projectsQuery.data ?? cloneSeed(projectSeed),
    news: newsQuery.data ?? cloneSeed(newsSeed),
    resilience: resilienceQuery.data ?? cloneSeed(resilienceSeed),
    sources: sourcesQuery.data ?? cloneSeed(sourceSeed),
    mapFeatures:
      mapFeaturesQuery.data ??
      cloneSeed(mapFeatureSeed.filter((collection) => layers.includes(collection.layerId) || collection.layerId === "bangkok-passages")),
    mediaFeeds: mediaFeedsQuery.data ?? cloneSeed(mediaFeedSeed),
    time: timeQuery.data ?? createTimeSnapshot()
  };
}

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSkeleton, setCopiedSkeleton] = useState(false);
  const deferredSearchText = useDeferredValue(searchText);

  const {
    lang,
    view,
    timeRange,
    city,
    domain,
    layers,
    overview,
    projects,
    news,
    resilience,
    sources,
    mapFeatures,
    mediaFeeds,
    time
  } = useDashboardData(searchParams);

  const copy = copyDeck[lang];
  const selectedCity = overview.cities.find((item) => item.slug === city) ?? overview.cities[0];
  const selectedDomain = overview.domains.find((item) => item.slug === domain);
  const normalizedSearch = deferredSearchText.trim().toLowerCase();

  const filteredProjects = normalizedSearch
    ? projects.filter((project) => {
        return (
          project.title.en.toLowerCase().includes(normalizedSearch) ||
          project.title.th.includes(deferredSearchText) ||
          project.summary.en.toLowerCase().includes(normalizedSearch) ||
          project.summary.th.includes(deferredSearchText)
        );
      })
    : projects;

  const filteredNews = normalizedSearch
    ? news.filter((item) => {
        return (
          item.title.en.toLowerCase().includes(normalizedSearch) ||
          item.title.th.includes(deferredSearchText) ||
          item.excerpt.en.toLowerCase().includes(normalizedSearch) ||
          item.excerpt.th.includes(deferredSearchText)
        );
      })
    : news;

  const officialNews = filteredNews.filter((item) => item.kind === "official").slice(0, 2);
  const externalNews = filteredNews.filter((item) => item.kind === "external").slice(0, 3);
  const compactProjects = filteredProjects.slice(0, 3);
  const compactSources = sources.slice(0, 4);
  const compactCities = overview.cities.slice(0, 4);
  const visibleTrends = trendWatchItems.slice(0, 3);
  const compactMedia = mediaFeeds.slice(0, 3);
  const timeZones = time.zones.slice(0, 3);
  const liveNewsSource =
    sources.find((source) => source.category === "news" && source.freshnessStatus === "live") ??
    sources.find((source) => source.category === "news") ??
    null;
  const nextNewsCheckAt = (() => {
    if (!liveNewsSource) {
      return "";
    }

    const lastCheckMs = new Date(liveNewsSource.lastCheckedAt).getTime();
    if (Number.isNaN(lastCheckMs)) {
      return "";
    }

    return new Date(lastCheckMs + 300000).toISOString();
  })();

  const skeletonJson = useMemo(() => JSON.stringify(createDashboardSkeletonExport(), null, 2), []);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    startTransition(() => {
      setSearchParams(next);
    });
  }

  function toggleLayer(id: string) {
    const next = new URLSearchParams(searchParams);
    const nextLayers = new Set(layers);
    const enabling = !nextLayers.has(id);
    if (nextLayers.has(id)) {
      nextLayers.delete(id);
    } else {
      nextLayers.add(id);
    }

    next.set("layers", Array.from(nextLayers).join(","));
    if (id === "smart-city-thailand" && enabling) {
      next.set("view", "national");
    }

    startTransition(() => {
      setSearchParams(next);
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1200);
  }

  async function copySkeleton() {
    await navigator.clipboard.writeText(skeletonJson);
    setCopiedSkeleton(true);
    window.setTimeout(() => setCopiedSkeleton(false), 1400);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-cluster">
          <img src="/Logo depa-01.png" alt="depa" className="brand-logo" />
          <img src="/Smart City Logo-02.png" alt="Smart City Thailand Office" className="brand-logo smart-city-logo" />
          <img src="/mdes.png" alt="MDES" className="brand-logo secondary" />
          <div className="brand-copy">
            <p className="eyebrow">{copy.brandEyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="brand-subline">{copy.subtitle}</p>
          </div>
        </div>

        <div className="top-controls">
          <nav className="compact-group">
            <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/">
              {copy.publicView}
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/admin">
              {copy.admin}
            </NavLink>
          </nav>

          <div className="compact-group">
            <span className="eyebrow">{copy.view}</span>
            {(["national", "city", "domain"] as DashboardView[]).map((option) => (
              <button
                key={option}
                className={option === view ? "chip active" : "chip"}
                onClick={() => updateParam("view", option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="compact-group">
            <span className="eyebrow">{copy.range}</span>
            {(["24h", "7d", "30d", "90d"] as TimeRange[]).map((option) => (
              <button
                key={option}
                className={option === timeRange ? "chip active" : "chip"}
                onClick={() => updateParam("timeRange", option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="compact-group">
            <button className={lang === "en" ? "chip active" : "chip"} onClick={() => updateParam("lang", "en")}>
              EN
            </button>
            <button className={lang === "th" ? "chip active" : "chip"} onClick={() => updateParam("lang", "th")}>
              TH
            </button>
          </div>

          <button className="share-button" onClick={copyLink}>
            {copiedLink ? copy.copied : copy.share}
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="side-section">
          <span className="eyebrow">Layers</span>
          <nav className="side-nav side-layer-nav">
            {layerSeed.map((layer) => (
              <button
                key={layer.id}
                type="button"
                className={layers.includes(layer.id) ? "side-button active" : "side-button"}
                onClick={() => toggleLayer(layer.id)}
              >
                <span className="swatch" style={{ background: layer.color }} />
                <span>{localize(lang, layer.label)}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="side-section side-filters">
          <label className="stack-field">
            <span className="eyebrow">City</span>
            <select value={city} onChange={(event) => updateParam("city", event.target.value)}>
              {overview.cities.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {localize(lang, item.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="stack-field">
            <span className="eyebrow">Domain</span>
            <select value={domain} onChange={(event) => updateParam("domain", event.target.value)}>
              <option value="">All</option>
              {overview.domains.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {localize(lang, item.title)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav className="side-nav side-anchor-nav">
          <a href="#pulse">{copy.topLine}</a>
          <a href="#news">{copy.news}</a>
          <a href="#projects">{copy.projects}</a>
          <a href="#trends">{copy.trendWatch}</a>
          <a href="#toolkit">{copy.toolkit}</a>
          <a href="#fine-print">{copy.finePrint}</a>
        </nav>
      </aside>

      <main className="dashboard-shell">
        <section className="card map-hero" id="map">
          <div className="card-header">
            <span className="eyebrow">{copy.map}</span>
            <span className="status-pill">
              {view === "national" && layers.includes("smart-city-thailand") ? "Thailand Coverage" : view === "national" ? "Thailand" : "Bangkok Passages"}
            </span>
          </div>

          <div className="thai-map">
            <InteractiveMap
              locale={lang}
              view={view}
              citySlug={city}
              domainSlug={domain || undefined}
              layers={layers}
              projects={projects}
              news={news}
              featureCollections={mapFeatures}
            />
            <div className="map-overlay">
              <div className="map-caption">
                <strong>{view === "national" ? "Thailand" : localize(lang, selectedCity.name)}</strong>
                <span>{view === "national" ? "Smart City coverage footprint" : localize(lang, selectedCity.region)}</span>
              </div>
              <span className="map-open-link">Live Layers</span>
            </div>
          </div>

          <div className="hero-toolbar">
            <div className="hero-toolbar-group">
              <div className="map-city-list">
                {overview.cities.map((item) => (
                  <button
                    key={item.slug}
                    className={item.slug === city ? "map-city-button active" : "map-city-button"}
                    onClick={() => updateParam("city", item.slug)}
                  >
                    {localize(lang, item.name)}
                  </button>
                ))}
              </div>
              {layers.includes("smart-city-thailand") ? (
                <label className="coverage-filter">
                  <span className="eyebrow">Coverage Domain</span>
                  <select value={domain} onChange={(event) => updateParam("domain", event.target.value)}>
                    <option value="">All</option>
                    {overview.domains.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {localize(lang, item.title)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <span className="hero-note">CityData + Google My Maps + live overlays</span>
          </div>
        </section>

        <section className="dashboard-board">
          <section className="card hero-card" id="pulse">
            <div className="card-header">
              <span className="eyebrow">{copy.topLine}</span>
              <span className="status-pill">
                {copy.sync}: {overview.updatedAt.slice(11, 19)} UTC
              </span>
            </div>

            <div className="metric-grid">
              {overview.metrics.map((metric, index) => (
                <article key={metric.id} className={`metric-card tone-${metric.tone}`}>
                  <div>
                    <p className="metric-label">{localize(lang, metric.label)}</p>
                    <p className="metric-value">
                      {metric.displayValue}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </p>
                  </div>
                  <p className="metric-delta">{localize(lang, metric.deltaText)}</p>
                  <Sparkline values={[24 + index * 8, 42 + index * 4, 38 + index * 6, 70 - index * 4]} />
                </article>
              ))}
            </div>

            <div className="selection-strip">
              <div>
                <span className="eyebrow">City focus</span>
                <strong>{localize(lang, selectedCity.name)}</strong>
                <p>{localize(lang, selectedCity.focus)}</p>
              </div>
              <div>
                <span className="eyebrow">Domain focus</span>
                <strong>
                  {selectedDomain ? localize(lang, selectedDomain.title) : copy.topLine}
                </strong>
                <p>
                  {selectedDomain
                    ? localize(lang, selectedDomain.description)
                    : localize(lang, overview.briefing.body)}
                </p>
              </div>
            </div>
          </section>

          <section className="card news-card" id="news">
            <div className="card-header">
              <span className="eyebrow">{copy.news}</span>
              <span className="status-pill">{liveNewsSource ? `${liveNewsSource.freshnessStatus} / 5m` : "5m"}</span>
            </div>
            <div className="news-monitor">
              <span>Items {filteredNews.length}</span>
              <span>Last {formatUtcClock(liveNewsSource?.lastCheckedAt)} UTC</span>
              <span>Next {formatUtcClock(nextNewsCheckAt)} UTC</span>
            </div>
            <div className="news-columns tile-scroll">
              <div>
                <h3>{copy.official}</h3>
                <div className="compact-list">
                  {officialNews.map((item) => (
                    <article key={item.id} className="headline-item">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <h3>{copy.external}</h3>
                <div className="compact-list">
                  {externalNews.map((item) => (
                    <article key={item.id} className="headline-item">
                      <strong>{localize(lang, item.title)}</strong>
                      <small>{item.source.sourceName}</small>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card briefing-card">
            <div className="card-header">
              <span className="eyebrow">{copy.briefing}</span>
              <span className="status-pill">{view}</span>
            </div>
            <h2>{localize(lang, overview.briefing.headline)}</h2>
            <p>{localize(lang, overview.briefing.body)}</p>
          </section>

          <section className="card resilience-card" id="resilience">
            <div className="card-header">
              <span className="eyebrow">{copy.resilience}</span>
              <span className="status-pill">{resilience.source.freshnessStatus}</span>
            </div>
            <div className="resilience-grid">
              <div>
                <p className="eyebrow">Weather</p>
                <strong>{localize(lang, resilience.weatherSummary)}</strong>
              </div>
              <div>
                <p className="eyebrow">Pollution</p>
                <strong>{localize(lang, resilience.pollutionSummary)}</strong>
              </div>
              <div className="warning-list">
                {resilience.warnings.map((warning, index) => (
                  <p key={index}>{localize(lang, warning)}</p>
                ))}
              </div>
            </div>
          </section>

          <section className="card projects-card" id="projects">
            <div className="card-header">
              <span className="eyebrow">{copy.projects}</span>
              <span className="eyebrow">{filteredProjects.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {compactProjects.map((project) => (
                <article key={project.id} className="stack-item">
                  <div className="stack-title">
                    <strong>{localize(lang, project.title)}</strong>
                    <span className={`status-tag ${project.status}`}>{project.status}</span>
                  </div>
                  <p>{localize(lang, project.summary)}</p>
                  <div className="progress-row">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${project.completionPercent}%` }} />
                    </div>
                    <span>{project.completionPercent}%</span>
                  </div>
                  <small>{localize(lang, project.nextMilestone)}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="card sources-card" id="sources">
            <div className="card-header">
              <span className="eyebrow">{copy.sources}</span>
              <span className="eyebrow">{sources.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {compactSources.map((source) => (
                <article key={source.id} className="source-item compact-source">
                  <div className="stack-title">
                    <strong>{source.name}</strong>
                    <span className={`status-tag ${source.freshnessStatus}`}>{source.freshnessStatus}</span>
                  </div>
                  <small>{source.message}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="card time-card">
            <div className="card-header">
              <span className="eyebrow">{copy.time}</span>
              <span className="status-pill">UTC</span>
            </div>
            <div className="time-zones">
              {timeZones.map((zone) => (
                <div key={zone.timeZone} className="time-zone">
                  <span className="eyebrow">{zone.label}</span>
                  <strong>{zone.localTime}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="card compare-card" id="compare">
            <div className="card-header">
              <span className="eyebrow">{copy.compare}</span>
              <span className="eyebrow">{overview.cities.length}</span>
            </div>
            <div className="compare-table tile-scroll">
              {compactCities.map((item) => (
                <div key={item.slug} className={item.slug === city ? "compare-row active" : "compare-row"}>
                  <button onClick={() => updateParam("city", item.slug)}>{localize(lang, item.name)}</button>
                  <span>{Math.round(item.scores.reduce((sum, score) => sum + score.score, 0) / item.scores.length)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card trends-card" id="trends">
            <div className="card-header">
              <span className="eyebrow">{copy.trendWatch}</span>
              <span className="status-pill">TH / 5Y</span>
            </div>
            <div className="trend-list tile-scroll">
              {visibleTrends.map((item) => {
                const stats = getTrendStats(item.values);

                return (
                  <a
                    key={item.id}
                    className="trend-row"
                    href={createGoogleTrendsUrl(item.query)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="trend-term">
                      <strong>{pickLocalized(lang, item.term)}</strong>
                      <span className="status-pill">{pickLocalized(lang, item.category)}</span>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendNow}</span>
                      <strong>{stats.latest}</strong>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendDelta}</span>
                      <strong className={stats.delta >= 0 ? "trend-positive" : "trend-negative"}>
                        {stats.delta >= 0 ? `+${stats.delta}` : stats.delta}
                      </strong>
                    </div>
                    <div className="trend-stat">
                      <span className="eyebrow">{copy.trendPeak}</span>
                      <strong>{stats.peak}</strong>
                    </div>
                    <div className="trend-mini">
                      <Sparkline values={item.values} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="card media-card" id="media">
            <div className="card-header">
              <span className="eyebrow">Live Media</span>
              <span className="status-pill">{mediaFeeds.length}</span>
            </div>
            <div className="stack-list tile-scroll">
              {compactMedia.map((item) => (
                <a
                  key={item.id}
                  className="stack-item linked"
                  href={item.externalUrl ?? item.embedUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="stack-title">
                    <strong>{item.label}</strong>
                    <span className={`status-tag ${item.status === "live" ? "live" : "manual"}`}>{item.status}</span>
                  </div>
                  <small>{item.region ?? item.kind}</small>
                </a>
              ))}
            </div>
          </section>
        </section>

        <section className="support-grid">
          <section className="card research-card">
          <div className="card-header">
            <span className="eyebrow">{copy.research}</span>
            <span className="status-pill">3</span>
          </div>
          <p className="card-note">{copy.sourceResearch}</p>
          <div className="stack-list tile-scroll">
            {researchInsights.slice(0, 3).map((item) => (
              <a key={item.id} className="stack-item linked" href={item.href} target="_blank" rel="noreferrer">
                <div className="stack-title">
                  <strong>{pickLocalized(lang, item.title)}</strong>
                  <span className="status-pill">{item.sourceLabel}</span>
                </div>
                <p>{pickLocalized(lang, item.summary)}</p>
              </a>
            ))}
          </div>
          </section>

          <section className="card toolkit-card" id="toolkit">
          <div className="card-header">
            <span className="eyebrow">{copy.toolkit}</span>
            <span className="status-pill">{copy.apiDirectory}</span>
          </div>

          <div className="toolkit-shell tile-scroll">
            <div className="toolkit-block">
              <h3>{copy.apiDirectory}</h3>
              <div className="tool-link-grid">
                {toolkitLinks.slice(0, 6).map((tool) => (
                  <a key={tool.id} className="tool-link" href={tool.href} target="_blank" rel="noreferrer">
                    <strong>{tool.name}</strong>
                    <span>{tool.kind}</span>
                    <p>{pickLocalized(lang, tool.description)}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="toolkit-block">
              <h3>{copy.stack}</h3>
              <div className="pill-list">
                {["Codex", "GitHub", "Render", "React", "Vite", "Fastify", "TypeScript", "npm"].map((item) => (
                  <span key={item} className="stack-pill">
                    {item}
                  </span>
                ))}
              </div>

              <div className="export-panel">
                <div className="stack-title">
                  <strong>{copy.exportJson}</strong>
                  <button className="share-button" onClick={copySkeleton}>
                    {copiedSkeleton ? copy.exported : copy.exportJson}
                  </button>
                </div>
                <pre>{skeletonJson}</pre>
              </div>
            </div>
          </div>
          </section>
        </section>

        <section className="card footnote-card" id="fine-print">
          <div className="card-header">
            <span className="eyebrow">{copy.finePrint}</span>
            <span className="status-pill">experimental</span>
          </div>
          <div className="footnote-grid">
            <p>{copy.privacy}</p>
            <p>{copy.experimental}</p>
            <p>{copy.copyright}</p>
          </div>
        </section>
      </main>

      <footer className="bottombar">
        <div className="ticker">
          <span className="eyebrow">Alert</span>
          <strong>{localize(lang, overview.briefing.headline)}</strong>
        </div>
        <div className="ticker-meta">
          <span>{localize(lang, selectedCity.name)}</span>
          <span>{selectedDomain ? localize(lang, selectedDomain.title) : "All domains"}</span>
          <span>{timeRange}</span>
        </div>
      </footer>
    </div>
  );
}

function AdminConsolePage() {
  const [lang, setLang] = useState<Locale>("en");
  const [token, setToken] = useState("");
  const [headlineTh, setHeadlineTh] = useState("สถานะทดลองพร้อมเผยแพร่");
  const [headlineEn, setHeadlineEn] = useState("Experimental operating brief ready");
  const [bodyTh, setBodyTh] = useState("ใช้คอนโซลนี้เพื่ออัปเดตสรุปสถานการณ์และซิงก์ข้อมูล");
  const [bodyEn, setBodyEn] = useState("Use this console to publish briefing updates and run source sync.");
  const [responseText, setResponseText] = useState("{ }");
  const [statusMessage, setStatusMessage] = useState("idle");
  const copy = copyDeck[lang];

  async function adminFetch(path: string, init?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        ...(init?.headers ?? {})
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? "Admin request failed");
    }

    return payload;
  }

  async function runSync() {
    try {
      const payload = await adminFetch("/api/admin/sources/sync", { method: "POST" });
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("sync completed");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "sync failed");
    }
  }

  async function loadHealth() {
    try {
      const payload = await adminFetch("/api/admin/sources/health");
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("health loaded");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "health failed");
    }
  }

  async function publishBriefing() {
    try {
      const payload = await adminFetch("/api/admin/briefings", {
        method: "POST",
        body: JSON.stringify({
          headline: { th: headlineTh, en: headlineEn },
          body: { th: bodyTh, en: bodyEn }
        })
      });
      setResponseText(JSON.stringify(payload, null, 2));
      setStatusMessage("briefing updated");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "publish failed");
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{copy.admin}</p>
          <h1>Smart City Thailand Admin</h1>
        </div>
        <div className="compact-group">
          <NavLink className={({ isActive }) => (isActive ? "chip active" : "chip")} to="/">
            {copy.publicView}
          </NavLink>
          <button className={lang === "en" ? "chip active" : "chip"} onClick={() => setLang("en")}>
            EN
          </button>
          <button className={lang === "th" ? "chip active" : "chip"} onClick={() => setLang("th")}>
            TH
          </button>
        </div>
      </header>

      <div className="admin-grid">
        <section className="card">
          <div className="card-header">
            <span className="eyebrow">{copy.adminToken}</span>
            <span className="status-pill">{statusMessage}</span>
          </div>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={copy.adminToken}
          />
          <p>{copy.adminHelp}</p>
          <div className="admin-actions">
            <button className="share-button" onClick={runSync}>
              {copy.syncNow}
            </button>
            <button className="chip active" onClick={loadHealth}>
              {copy.refreshHealth}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="eyebrow">{copy.publishBriefing}</span>
            <span className="status-pill">manual</span>
          </div>
          <div className="admin-form">
            <label>
              <span>Headline (TH)</span>
              <input value={headlineTh} onChange={(event) => setHeadlineTh(event.target.value)} />
            </label>
            <label>
              <span>Headline (EN)</span>
              <input value={headlineEn} onChange={(event) => setHeadlineEn(event.target.value)} />
            </label>
            <label>
              <span>Body (TH)</span>
              <textarea rows={4} value={bodyTh} onChange={(event) => setBodyTh(event.target.value)} />
            </label>
            <label>
              <span>Body (EN)</span>
              <textarea rows={4} value={bodyEn} onChange={(event) => setBodyEn(event.target.value)} />
            </label>
            <button className="share-button" onClick={publishBriefing}>
              {copy.publishBriefing}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="eyebrow">Response</span>
            <span className="status-pill">json</span>
          </div>
          <pre className="response-panel">{responseText}</pre>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminConsolePage />} />
    </Routes>
  );
}
