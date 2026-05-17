import { syncAir4Thai } from "../adapters/air4thaiAdapter.js";
import { syncBmaFlood } from "../adapters/bmaFloodAdapter.js";
import { syncBmaCityData } from "../adapters/bmaCityDataAdapter.js";
import { syncBmaGis } from "../adapters/bmaGisAdapter.js";
import { syncCitydataCatalog } from "../adapters/citydataAdapter.js";
import type { AdapterSyncResult } from "../adapters/common.js";
import { syncDataGoTh } from "../adapters/dataGoThAdapter.js";
import { syncEonetEvents } from "../adapters/eonetAdapter.js";
import { syncEsaAgriculture } from "../adapters/esaAgricultureAdapter.js";
import { syncGdeltSignals } from "../adapters/gdeltAdapter.js";
import { syncGistdaDisaster } from "../adapters/gistdaDisasterAdapter.js";
import { syncGoogleNewsRss } from "../adapters/googleNewsRssAdapter.js";
import { runIticSync } from "../adapters/iticAdapter.js";
import { syncJaxaWater } from "../adapters/jaxaWaterAdapter.js";
import { syncMarketSignals } from "../adapters/marketSignalsAdapter.js";
import { syncNewsApi } from "../adapters/newsApiAdapter.js";
import { syncOpenAq } from "../adapters/openaqAdapter.js";
import { syncOpenMeteoAirQuality } from "../adapters/openMeteoAirQualityAdapter.js";
import { syncOpenMeteoWeather } from "../adapters/openMeteoWeatherAdapter.js";
import { syncTalkwalkerAlerts } from "../adapters/talkwalkerAlertsAdapter.js";
import { syncTimeSnapshot } from "../adapters/timeSyncService.js";
import { syncTatTourism } from "../adapters/tatTourismAdapter.js";
import { syncTcebMice } from "../adapters/tcebAdapter.js";
import { syncTmdWeather } from "../adapters/tmdWeatherAdapter.js";
import { syncTraffyFondue } from "../adapters/traffyFondueAdapter.js";
import { syncUrbanis } from "../adapters/urbanisAdapter.js";
import { syncYouTubeSignals } from "../adapters/youtubeSignalsAdapter.js";
import { store } from "../data/store.js";

type SyncTask = {
  sourceId: string;
  run: () => Promise<AdapterSyncResult>;
};

const opsSyncTasks: SyncTask[] = [
  { sourceId: "itic-traffic", run: runIticSync },
  { sourceId: "traffy-fondue", run: syncTraffyFondue },
  { sourceId: "air4thai", run: syncAir4Thai },
  { sourceId: "tmd-weather", run: syncTmdWeather },
  { sourceId: "bma-flood", run: syncBmaFlood },
  { sourceId: "open-meteo-weather", run: syncOpenMeteoWeather },
  { sourceId: "open-meteo-air", run: syncOpenMeteoAirQuality },
  { sourceId: "openaq", run: syncOpenAq },
  { sourceId: "time-sync", run: syncTimeSnapshot }
];

const fullSyncTasks: SyncTask[] = [
  { sourceId: "citydata", run: syncCitydataCatalog },
  { sourceId: "data-go-th", run: syncDataGoTh },
  { sourceId: "urbanis", run: syncUrbanis },
  { sourceId: "gistda-disaster", run: syncGistdaDisaster },
  { sourceId: "esa-eodashboard", run: syncEsaAgriculture },
  { sourceId: "jaxa-earth", run: syncJaxaWater },
  { sourceId: "google-news-rss", run: syncGoogleNewsRss },
  { sourceId: "gdelt-signals", run: syncGdeltSignals },
  { sourceId: "talkwalker-alerts", run: syncTalkwalkerAlerts },
  { sourceId: "news-api", run: syncNewsApi },
  { sourceId: "youtube-signals", run: syncYouTubeSignals },
  { sourceId: "market-context", run: syncMarketSignals },
  { sourceId: "nasa-eonet", run: syncEonetEvents },
  { sourceId: "bma-gis", run: syncBmaGis },
  { sourceId: "bma-citydata", run: syncBmaCityData },
  { sourceId: "tat-tourism", run: syncTatTourism },
  { sourceId: "tceb-mice", run: syncTcebMice },
  ...opsSyncTasks
];

async function runTaskGroup(tasks: SyncTask[]) {
  const settled = await Promise.allSettled(tasks.map((task) => task.run()));

  const results = settled.map((entry, index) => {
    if (entry.status === "fulfilled") {
      return entry.value;
    }

    return {
      sourceId: tasks[index]?.sourceId ?? `source-${index}`,
      status: "stale" as const,
      fetchedAt: new Date().toISOString(),
      message: "Sync failed unexpectedly.",
      sourceUrl: ""
    };
  });

  return store.applySyncResults(results);
}

export async function runOpsSync() {
  return runTaskGroup(opsSyncTasks);
}

export async function runSourceSync() {
  return runTaskGroup(fullSyncTasks);
}
