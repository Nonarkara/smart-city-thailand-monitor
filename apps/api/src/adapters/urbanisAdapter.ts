import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

export async function syncUrbanis() {
  const payload = await fetchJsonOrNull<unknown>(config.urbanisEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "urbanis",
      status: config.urbanisEndpoint ? "stale" : "manual",
      message: config.urbanisEndpoint
        ? "Configured Urbanis endpoint failed, keeping enrichment source in standby."
        : "Urbanis remains an enrichment source until a stable export or API URL is defined.",
      sourceUrl: "https://urbandata.theurbanis.com"
    });
  }

  return buildResult({
    sourceId: "urbanis",
    status: "live",
    message: "Urbanis endpoint fetched successfully.",
    sourceUrl: "https://urbandata.theurbanis.com"
  });
}

