import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const workspaceRoot = resolve(rootDir, "../..");
  const env = loadEnv(mode, workspaceRoot, "");
  const proxyTarget =
    env.VITE_API_PROXY_TARGET?.trim() ||
    env.VITE_API_BASE_URL?.trim() ||
    "http://127.0.0.1:4000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@smart-city/shared": resolve(rootDir, "../../packages/shared/src/index.ts")
      }
    },
    publicDir: resolve(rootDir, "../../public"),
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
