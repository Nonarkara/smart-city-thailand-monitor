import "./loadEnv.js";
import { config } from "./config.js";
import { runSourceSync } from "./services/sync.js";
import { createServer } from "./server.js";

const server = await createServer();

try {
  await server.listen({
    port: config.port,
    host: "0.0.0.0"
  });

  if (config.allowLiveFetch) {
    void runSourceSync().catch((error) => {
      server.log.warn({ error }, "Initial source sync failed");
    });

    setInterval(() => {
      void runSourceSync().catch((error) => {
        server.log.warn({ error }, "Scheduled source sync failed");
      });
    }, config.syncIntervalMs);
  }
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
