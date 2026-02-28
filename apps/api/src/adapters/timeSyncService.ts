import { createTimeSnapshot } from "@smart-city/shared";
import { buildResult } from "./common.js";

export async function syncTimeSnapshot() {
  return buildResult({
    sourceId: "time-sync",
    status: "live",
    message: "Server time snapshot refreshed.",
    sourceUrl: "https://www.nist.gov/pml/time-and-frequency-division/time-services/internet-time-service-its",
    timeSnapshot: createTimeSnapshot()
  });
}
