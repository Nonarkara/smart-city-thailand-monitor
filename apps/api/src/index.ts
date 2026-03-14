import "./loadEnv.js";
import { config } from "./config.js";
import { loadPersistedStoreSnapshot } from "./data/persistence.js";
import { store } from "./data/store.js";
import { refreshPublicCctvSnapshot } from "./services/publicCctv.js";
import { runSourceSync } from "./services/sync.js";
import { createServer } from "./server.js";

const persistedSnapshot = await loadPersistedStoreSnapshot();
if (persistedSnapshot) {
  store.hydrate(persistedSnapshot);
}

const server = await createServer();

try {
  await server.listen({
    port: config.port,
    host: config.host
  });

  if (config.allowLiveFetch) {
    void refreshPublicCctvSnapshot().catch((error) => {
      server.log.warn({ error }, "Initial public CCTV refresh failed");
    });

    void runSourceSync().catch((error) => {
      server.log.warn({ error }, "Initial source sync failed");
    });

    setInterval(() => {
      void refreshPublicCctvSnapshot().catch((error) => {
        server.log.warn({ error }, "Scheduled public CCTV refresh failed");
      });

      void runSourceSync().catch((error) => {
        server.log.warn({ error }, "Scheduled source sync failed");
      });
    }, config.syncIntervalMs);
  }
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
