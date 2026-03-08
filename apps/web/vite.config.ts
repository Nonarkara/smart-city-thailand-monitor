import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = resolve(rootDir, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, "");
  const configuredBase = (env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const proxyTarget = (env.VITE_API_PROXY_TARGET || configuredBase || "http://127.0.0.1:4001").trim().replace(/\/+$/, "");
  const apiProxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true
    }
  };

  return {
    plugins: [react()],
    envDir: workspaceRoot,
    resolve: {
      alias: {
        "@smart-city/shared": resolve(rootDir, "../../packages/shared/src/index.ts")
      }
    },
    publicDir: resolve(rootDir, "../../public"),
    server: {
      host: "0.0.0.0",
      port: 5175,
      proxy: apiProxy
    },
    preview: {
      host: "127.0.0.1",
      port: 4173,
      proxy: apiProxy
    }
  };
});
