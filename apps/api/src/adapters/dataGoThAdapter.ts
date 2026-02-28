import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

export async function syncDataGoTh() {
  const payload = await fetchJsonOrNull<unknown>(config.dataGoThEndpoint);
  if (!payload) {
    return buildResult({
      sourceId: "data-go-th",
      status: config.dataGoThEndpoint ? "stale" : "manual",
      message: config.dataGoThEndpoint
        ? "Configured data.go.th endpoint failed, using dataset-registry fallback."
        : "Configure a dataset-specific data.go.th endpoint to enable live pulls.",
      sourceUrl: "https://data.go.th"
    });
  }

  return buildResult({
    sourceId: "data-go-th",
    status: "live",
    message: "data.go.th endpoint fetched successfully.",
    sourceUrl: "https://data.go.th"
  });
}

