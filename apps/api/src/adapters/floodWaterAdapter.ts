/**
 * Flood & Water Monitoring Adapter
 *
 * Monitors water levels, precipitation forecasts, and flood risk for MTT area.
 * Currently returns seed data — connect to live APIs when ready.
 *
 * Live API targets:
 *   - ThaiWater API: https://standard.thaiwater.net/docs/
 *     Water levels, rainfall, reservoir data from HII (Hydro Informatics Institute)
 *
 *   - TMD API: https://data.tmd.go.th/api/index1.php
 *     Precipitation forecasts, weather warnings from Thai Meteorological Department
 *
 *   - GISTDA STAC: https://disaster-vallaris.gistda.or.th/core/api/stac/1.0/Flood/
 *     Satellite flood extent imagery (Sentinel-1, THEOS-2)
 *
 *   - Royal Irrigation Department: http://water.rid.go.th/flood/flood/
 *     River levels and discharge observations
 *
 *   - Bangkok Drainage: https://dds.bangkok.go.th/
 *     Pump station status, canal levels (no public API — may need partnership)
 */

import { mttFloodRisk } from "@smart-city/shared";
import type { FloodRiskSnapshot } from "@smart-city/shared";

let cachedSnapshot: FloodRiskSnapshot | null = null;
let cacheTime = 0;
const CACHE_TTL = 300_000; // 5 minutes

export async function getFloodRiskSnapshot(): Promise<FloodRiskSnapshot> {
  if (cachedSnapshot && Date.now() - cacheTime < CACHE_TTL) {
    return cachedSnapshot;
  }

  // TODO: Connect ThaiWater API for live water levels
  // const waterLevels = await fetch("https://standard.thaiwater.net/api/v1/...");
  //
  // TODO: Connect TMD API for precipitation forecast
  // const forecast = await fetch("https://data.tmd.go.th/api/index1.php?...");
  //
  // TODO: Merge live data with station config, compute flood risk level

  cachedSnapshot = {
    ...mttFloodRisk,
    updatedAt: new Date().toISOString()
  };
  cacheTime = Date.now();
  return cachedSnapshot;
}
