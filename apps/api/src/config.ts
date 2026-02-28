export const config = {
  port: Number(process.env.PORT ?? 4000),
  adminToken: process.env.ADMIN_TOKEN ?? "change-me",
  allowLiveFetch: process.env.ALLOW_LIVE_FETCH === "true",
  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 300000),
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  newsApiPageSize: Number(process.env.NEWS_API_PAGE_SIZE ?? 4),
  newsApiQueries: (process.env.NEWS_API_QUERIES ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean),
  googleNewsRssQueries: (process.env.GOOGLE_NEWS_RSS_QUERIES ?? "")
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
  weatherEndpoint:
    process.env.OPEN_METEO_WEATHER_ENDPOINT ??
    "https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FBangkok",
  airQualityEndpoint:
    process.env.OPEN_METEO_AIR_ENDPOINT ??
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.7563&longitude=100.5018&current=pm10,pm2_5,us_aqi&timezone=Asia%2FBangkok",
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
  marketGoldEndpoint: process.env.MARKET_GOLD_ENDPOINT ?? "https://api.gold-api.com/price/XAU"
};
