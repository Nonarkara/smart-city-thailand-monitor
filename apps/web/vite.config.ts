import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@smart-city/shared": resolve(rootDir, "../../packages/shared/src/index.ts")
    }
  },
  publicDir: resolve(rootDir, "../../public"),
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
