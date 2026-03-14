export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",
  adminToken: process.env.ADMIN_TOKEN ?? "change-me",
  allowLiveFetch: process.env.ALLOW_LIVE_FETCH !== "false",
  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 300000),
  stateSnapshotPath: process.env.STATE_SNAPSHOT_PATH ?? "tmp/api-state.json",
  cctvSnapshotPath: process.env.CCTV_SNAPSHOT_PATH ?? "tmp/public-cctv-state.json",
  cctvCacheTtlMs: Number(process.env.CCTV_CACHE_TTL_MS ?? 300000),
  cctvProbeTimeoutMs: Number(process.env.CCTV_PROBE_TIMEOUT_MS ?? 2500),
  cctvProbeConcurrency: Number(process.env.CCTV_PROBE_CONCURRENCY ?? 8),
  maxDailyAiInquiries: Number(process.env.MAX_DAILY_AI_INQUIRIES ?? 200),
  knowledgeDir: process.env.KNOWLEDGE_DIR ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  newsApiPageSize: Number(process.env.NEWS_API_PAGE_SIZE ?? 4),
  satelliteImageryEndpoint: process.env.SATELLITE_IMAGERY_ENDPOINT ?? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  newsApiQueries: (process.env.NEWS_API_QUERIES ?? "Muang Thong Thani|IMPACT Muang Thong Thani|Nonthaburi Smart City")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  googleNewsRssQueries: (process.env.GOOGLE_NEWS_RSS_QUERIES ?? "Muang Thong Thani|Nonthaburi Smart City")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  googleAlertsFeeds: (process.env.GOOGLE_ALERTS_FEEDS ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  gdeltDocEndpoint:
    process.env.GDELT_DOC_ENDPOINT ??
    "https://api.gdeltproject.org/api/v2/doc/doc?query=%28%22smart%20city%22%20AND%20Thailand%29%20OR%20%28depa%20AND%20%22smart%20city%22%29&mode=ArtList&maxrecords=6&format=json&sort=DateDesc",
  talkwalkerAlertsFeeds: (process.env.TALKWALKER_ALERT_FEEDS ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  youtubeChannelIds: (process.env.YOUTUBE_CHANNEL_IDS ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  eonetEndpoint:
    process.env.EONET_ENDPOINT ??
    "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=12",
  bangkokPassagesMapUrl:
    process.env.BANGKOK_PASSAGES_MAP_URL ??
    "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.838530327896784%2C100.64165750169461&z=11",
  citydataEndpoint:
    process.env.CITYDATA_CATALOG_ENDPOINT ??
    "https://catalog.citydata.in.th/api/3/action/package_search?q=%22smart%20city%22&rows=12&sort=metadata_modified%20desc",
  dataGoThEndpoint: process.env.DATAGOTH_ENDPOINT ?? "",
  urbanisEndpoint: process.env.URBANIS_ENDPOINT ?? "",
  gistdaEndpoint: process.env.GISTDA_ENDPOINT ?? "",
  agricultureCollectionEndpoint:
    process.env.ESA_AGRICULTURE_COLLECTION_ENDPOINT ??
    "https://raw.githubusercontent.com/ESA-eodashboards/eodashboard-catalog/main/collections/E10c_rice_planting.json",
  waterCollectionEndpoint:
    process.env.JAXA_WATER_COLLECTION_ENDPOINT ??
    "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_GSMaP_standard.Gauge.00Z-23Z.v6_daily/collection.json",
  weatherEndpoint:
    process.env.OPEN_METEO_WEATHER_ENDPOINT ??
    "https://api.open-meteo.com/v1/forecast?latitude=13.9118&longitude=100.5512&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FBangkok",
  airQualityEndpoint:
    process.env.OPEN_METEO_AIR_ENDPOINT ??
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.9118&longitude=100.5512&current=pm10,pm2_5,us_aqi&timezone=Asia%2FBangkok",
  openaqEndpoint:
    process.env.OPENAQ_ENDPOINT ??
    "https://api.openaq.org/v3/locations?country=TH&limit=6",
  openaqApiKey: process.env.OPENAQ_API_KEY ?? "",
  marketBtcEndpoint:
    process.env.MARKET_BTC_ENDPOINT ??
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
  marketUsdThbEndpoint:
    process.env.MARKET_USD_THB_ENDPOINT ??
    "https://api.frankfurter.app/latest?from=USD&to=THB",
  marketGoldEndpoint: process.env.MARKET_GOLD_ENDPOINT ?? "https://api.gold-api.com/price/XAU",
  copernicusClientId: process.env.COPERNICUS_CLIENT_ID ?? "",
  copernicusClientSecret: process.env.COPERNICUS_CLIENT_SECRET ?? "",
  copernicusTokenUrl:
    process.env.COPERNICUS_TOKEN_URL ??
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
  sentinelHubProcessUrl:
    process.env.SENTINEL_HUB_PROCESS_URL ?? "https://sh.dataspace.copernicus.eu/api/v1/process",
  sentinelHubStatsUrl:
    process.env.SENTINEL_HUB_STATS_URL ?? "https://sh.dataspace.copernicus.eu/api/v1/statistics",
  sentinelHubCatalogSearchUrl:
    process.env.SENTINEL_HUB_CATALOG_URL ?? "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search",
  slicThailandUrl: process.env.SLIC_THAILAND_URL ?? "https://slic-index.onrender.com/thailand"
};
