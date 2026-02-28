import { syncCitydataCatalog } from "../adapters/citydataAdapter.js";
import { syncDataGoTh } from "../adapters/dataGoThAdapter.js";
import { syncEonetEvents } from "../adapters/eonetAdapter.js";
import { syncGdeltSignals } from "../adapters/gdeltAdapter.js";
import { syncGistdaDisaster } from "../adapters/gistdaDisasterAdapter.js";
import { syncGoogleNewsRss } from "../adapters/googleNewsRssAdapter.js";
import { syncNewsApi } from "../adapters/newsApiAdapter.js";
import { syncOpenAq } from "../adapters/openaqAdapter.js";
import { syncOpenMeteoAirQuality } from "../adapters/openMeteoAirQualityAdapter.js";
import { syncOpenMeteoWeather } from "../adapters/openMeteoWeatherAdapter.js";
import { syncTalkwalkerAlerts } from "../adapters/talkwalkerAlertsAdapter.js";
import { syncTimeSnapshot } from "../adapters/timeSyncService.js";
import { syncUrbanis } from "../adapters/urbanisAdapter.js";
import { syncYouTubeSignals } from "../adapters/youtubeSignalsAdapter.js";
import type { AdapterSyncResult } from "../adapters/common.js";
import { store } from "../data/store.js";

export async function runSourceSync() {
  const settled = await Promise.allSettled([
    syncCitydataCatalog(),
    syncDataGoTh(),
    syncUrbanis(),
    syncGistdaDisaster(),
    syncGoogleNewsRss(),
    syncGdeltSignals(),
    syncTalkwalkerAlerts(),
    syncNewsApi(),
    syncYouTubeSignals(),
    syncEonetEvents(),
    syncOpenMeteoWeather(),
    syncOpenMeteoAirQuality(),
    syncOpenAq(),
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
      "gdelt-signals",
      "talkwalker-alerts",
      "news-api",
      "youtube-signals",
      "nasa-eonet",
      "open-meteo-weather",
      "open-meteo-air",
      "openaq",
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
