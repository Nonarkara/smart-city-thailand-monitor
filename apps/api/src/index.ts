import "./loadEnv.js";
import { config } from "./config.js";
import { loadPersistedStoreSnapshot } from "./data/persistence.js";
import { store } from "./data/store.js";
import { refreshPublicCctvSnapshot } from "./services/publicCctv.js";
import { runOpsSync, runSourceSync } from "./services/sync.js";
import { createServer } from "./server.js";

const persistedSnapshot = await loadPersistedStoreSnapshot();
if (persistedSnapshot) {
  store.hydrate(persistedSnapshot);
}

const server = await createServer();

function scheduleTask(intervalMs: number, label: string, task: () => Promise<unknown>) {
  let running = false;

  return setInterval(() => {
    if (running) {
      server.log.info({ label }, "Skipped overlapping scheduled task");
      return;
    }

    running = true;
    void task()
      .catch((error) => {
        server.log.warn({ error, label }, "Scheduled task failed");
      })
      .finally(() => {
        running = false;
      });
  }, intervalMs);
}

try {
  await server.listen({
    port: config.port,
    host: config.host
  });

  if (config.allowLiveFetch) {
    void refreshPublicCctvSnapshot().catch((error) => {
      server.log.warn({ error }, "Initial public CCTV refresh failed");
    });

    if (config.autoSyncEnabled) {
      void runSourceSync().catch((error) => {
        server.log.warn({ error }, "Initial source sync failed");
      });

      scheduleTask(config.opsSyncIntervalMs, "ops-sync", async () => {
        await runOpsSync();
      });

      scheduleTask(config.syncIntervalMs, "full-sync", async () => {
        await refreshPublicCctvSnapshot();
        await runSourceSync();
      });
    }
  }
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
