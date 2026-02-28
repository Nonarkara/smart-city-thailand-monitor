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
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.7563&longitude=100.5018&current=pm10,pm2_5,us_aqi&timezone=Asia%2FBangkok"
};
