import { syncCitydataCatalog } from "../adapters/citydataAdapter.js";
import { syncDataGoTh } from "../adapters/dataGoThAdapter.js";
import { syncGistdaDisaster } from "../adapters/gistdaDisasterAdapter.js";
import { syncGoogleNewsRss } from "../adapters/googleNewsRssAdapter.js";
import { syncNewsApi } from "../adapters/newsApiAdapter.js";
import { syncOpenMeteoAirQuality } from "../adapters/openMeteoAirQualityAdapter.js";
import { syncOpenMeteoWeather } from "../adapters/openMeteoWeatherAdapter.js";
import { syncTimeSnapshot } from "../adapters/timeSyncService.js";
import { syncUrbanis } from "../adapters/urbanisAdapter.js";
import type { AdapterSyncResult } from "../adapters/common.js";
import { store } from "../data/store.js";

export async function runSourceSync() {
  const settled = await Promise.allSettled([
    syncCitydataCatalog(),
    syncDataGoTh(),
    syncUrbanis(),
    syncGistdaDisaster(),
    syncGoogleNewsRss(),
    syncNewsApi(),
    syncOpenMeteoWeather(),
    syncOpenMeteoAirQuality(),
    syncTimeSnapshot()
  ]);

  const results: AdapterSyncResult[] = settled.map((entry, index) => {
    if (entry.status === "fulfilled") {
      return entry.value;
    }

    const fallbackIds = [
      "citydata",
      "data-go-th",
      "urbanis",
      "gistda-disaster",
      "google-news-rss",
      "news-api",
      "open-meteo-weather",
      "open-meteo-air",
      "time-sync"
    ];

    return {
      sourceId: fallbackIds[index] ?? `source-${index}`,
      status: "stale",
      fetchedAt: new Date().toISOString(),
      message: "Sync failed unexpectedly.",
      sourceUrl: ""
    };
  });

  return store.applySyncResults(results);
}
