import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

export async function syncGistdaDisaster() {
  const payload = await fetchJsonOrNull<unknown>(config.gistdaEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "gistda-disaster",
      status: config.gistdaEndpoint ? "stale" : "manual",
      message: config.gistdaEndpoint
        ? "Configured GISTDA endpoint failed, leaving disaster layer in fallback mode."
        : "Set a confirmed GISTDA endpoint to enable live disaster overlays.",
      sourceUrl: "https://disaster.gistda.or.th/services/open-api"
    });
  }

  return buildResult({
    sourceId: "gistda-disaster",
    status: "live",
    message: "GISTDA payload fetched successfully.",
    sourceUrl: "https://disaster.gistda.or.th/services/open-api"
  });
}

