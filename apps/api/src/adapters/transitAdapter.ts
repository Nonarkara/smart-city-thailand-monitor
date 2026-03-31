/**
 * Public Transit Adapter
 *
 * Provides bus, MRT, BTS, and shuttle connection info for MTT area.
 * Currently returns seed data — connect to live tracking when ready.
 *
 * Live API targets:
 *   - ViaBus: https://www.viabus.co/
 *     Real-time bus tracking for BMTA routes (166, 356) near MTT
 *     No public API documented — contact for partnership or reverse-engineer app protocol
 *
 *   - GTFS feeds: https://www.transit.land/
 *     Bangkok limited coverage, check Transitland for any BMTA feeds
 *
 *   - MRT Purple Line: No public API
 *     Contact MRTA for potential data sharing: https://www.mrta.co.th/
 *
 *   - BTS Skytrain: No public API
 *     Contact BTS Group: https://www.bts.co.th/eng/
 *
 *   - MTT Internal Shuttle: Managed by MTT town management
 *     Direct integration when partnership established
 *
 * Key routes for MTT:
 *   Bus 166: Pak Kret ↔ Victory Monument (passes MTT)
 *   Bus 356: MTT ↔ Mor Chit BTS (direct service)
 *   MRT Purple: Khae Rai station (1.8 km walk from MTT)
 *   MTT Shuttle: Internal loop Lakefront → IMPACT → Main Gate
 */

import { mttTransit } from "@smart-city/shared";
import type { TransitSnapshot } from "@smart-city/shared";

let cachedSnapshot: TransitSnapshot | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute (transit data should refresh fast)

export async function getTransitSnapshot(): Promise<TransitSnapshot> {
  if (cachedSnapshot && Date.now() - cacheTime < CACHE_TTL) {
    return cachedSnapshot;
  }

  // TODO: Connect ViaBus API for real-time bus positions
  // const viabusData = await fetch("https://api.viabus.co/v1/...");
  //
  // TODO: Compute nextArrival from real-time positions
  // for (const connection of connections) {
  //   if (connection.provider === "bmta") {
  //     connection.nextArrival = computeETA(viabusData, connection.routeNumber);
  //   }
  // }

  cachedSnapshot = {
    ...mttTransit,
    updatedAt: new Date().toISOString()
  };
  cacheTime = Date.now();
  return cachedSnapshot;
}
