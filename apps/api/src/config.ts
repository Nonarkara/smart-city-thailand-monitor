// Muang Thong Thani Smart City Monitor — API Configuration
// Lat/Lon: 13.9118°N, 100.5512°E  (Muang Thong Thani, Nonthaburi)
export const config = {
  port: Number(process.env.PORT ?? 4001),
  adminToken: process.env.ADMIN_TOKEN ?? "change-me",
  allowLiveFetch: process.env.ALLOW_LIVE_FETCH !== "false",
  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 300000),
  stateSnapshotPath: process.env.STATE_SNAPSHOT_PATH ?? "tmp/mtt-state.json",
  knowledgeDir: process.env.KNOWLEDGE_DIR ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  newsApiPageSize: Number(process.env.NEWS_API_PAGE_SIZE ?? 6),
  satelliteImageryEndpoint:
    process.env.SATELLITE_IMAGERY_ENDPOINT ??
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  newsApiQueries: (
    process.env.NEWS_API_QUERIES ??
    "Muang Thong Thani|เมืองทองธานี|IMPACT Arena Nonthaburi|Nonthaburi Smart City|IMPACT Exhibition Center"
  )
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  googleNewsRssQueries: (
    process.env.GOOGLE_NEWS_RSS_QUERIES ??
    "Muang Thong Thani|เมืองทองธานี นนทบุรี|Nonthaburi Smart City"
  )
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  googleAlertsFeeds: (process.env.GOOGLE_ALERTS_FEEDS ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  // GDELT: focused on Muang Thong Thani / Nonthaburi / Thailand smart city
  gdeltDocEndpoint:
    process.env.GDELT_DOC_ENDPOINT ??
    "https://api.gdeltproject.org/api/v2/doc/doc?query=%22Muang+Thong+Thani%22+OR+%22%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%97%E0%B8%AD%E0%B8%87%E0%B8%98%E0%B8%B2%E0%B8%99%E0%B8%B5%22+OR+%28%22Nonthaburi%22+AND+%22smart+city%22%29&mode=ArtList&maxrecords=8&format=json&sort=DateDesc",
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
    "https://www.google.com/maps/d/u/0/viewer?mid=1DbE8UXPzd5V_e7PxHee-TXc57Bb_a02P&ll=13.9118%2C100.5512&z=14",
  // CityData: query for Nonthaburi + smart city datasets
  citydataEndpoint:
    process.env.CITYDATA_CATALOG_ENDPOINT ??
    "https://catalog.citydata.in.th/api/3/action/package_search?q=%22%E0%B8%99%E0%B8%99%E0%B8%97%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5%22+OR+%22smart+city%22&rows=12&sort=metadata_modified%20desc",
  dataGoThEndpoint: process.env.DATAGOTH_ENDPOINT ?? "",
  urbanisEndpoint: process.env.URBANIS_ENDPOINT ?? "",
  gistdaEndpoint: process.env.GISTDA_ENDPOINT ?? "",
  agricultureCollectionEndpoint:
    process.env.ESA_AGRICULTURE_COLLECTION_ENDPOINT ??
    "https://raw.githubusercontent.com/ESA-eodashboards/eodashboard-catalog/main/collections/E10c_rice_planting.json",
  waterCollectionEndpoint:
    process.env.JAXA_WATER_COLLECTION_ENDPOINT ??
    "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_GSMaP_standard.Gauge.00Z-23Z.v6_daily/collection.json",
  // Weather pinned to Muang Thong Thani (13.9118°N, 100.5512°E)
  weatherEndpoint:
    process.env.OPEN_METEO_WEATHER_ENDPOINT ??
    "https://api.open-meteo.com/v1/forecast?latitude=13.9118&longitude=100.5512&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FBangkok",
  // Air quality pinned to Muang Thong Thani
  airQualityEndpoint:
    process.env.OPEN_METEO_AIR_ENDPOINT ??
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.9118&longitude=100.5512&current=pm10,pm2_5,us_aqi&timezone=Asia%2FBangkok",
  // OpenAQ: Nonthaburi province locations
  openaqEndpoint:
    process.env.OPENAQ_ENDPOINT ??
    "https://api.openaq.org/v3/locations?country=TH&city=Nonthaburi&limit=8",
  openaqApiKey: process.env.OPENAQ_API_KEY ?? "",
  marketBtcEndpoint:
    process.env.MARKET_BTC_ENDPOINT ??
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
  marketUsdThbEndpoint:
    process.env.MARKET_USD_THB_ENDPOINT ??
    "https://api.frankfurter.app/latest?from=USD&to=THB",
  marketGoldEndpoint:
    process.env.MARKET_GOLD_ENDPOINT ?? "https://api.gold-api.com/price/XAU"
};
