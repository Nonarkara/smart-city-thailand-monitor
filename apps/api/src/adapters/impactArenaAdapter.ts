/**
 * IMPACT Arena Event Calendar Adapter
 *
 * Attempts to fetch the event calendar from impact.co.th and parse event
 * listings. Falls back to enriched seed data (real events manually sourced
 * from the website) if the fetch or parse fails.
 *
 * Source: https://www.impact.co.th/en/visitors/event-calendar
 * No public API exists — this adapter scrapes the HTML calendar page.
 */

import type { ImpactArenaEvent } from "@smart-city/shared";
import { impactArenaEvents as seedEvents } from "@smart-city/shared";
import { fetchTextOrNull } from "./common.js";
import { config } from "../config.js";

let cachedEvents: ImpactArenaEvent[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL = 6 * 60 * 60_000; // 6 hours

/**
 * Attempt to parse event data from the IMPACT calendar HTML.
 * The page uses structured markup for event listings — we extract
 * event name, date range, and venue from the HTML.
 */
function parseEventsFromHtml(html: string): ImpactArenaEvent[] {
  const events: ImpactArenaEvent[] = [];

  // Match event blocks — the calendar page renders events as list items
  // with structured text: title, date range, venue
  const eventPattern = /class="[^"]*event[^"]*"[^>]*>[\s\S]*?<\/(?:div|article|li)>/gi;
  const blocks = html.match(eventPattern) ?? [];

  for (const block of blocks) {
    // Extract title
    const titleMatch = block.match(/<(?:h[2-4]|strong|a)[^>]*>([^<]+)</i);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Extract date
    const dateMatch = block.match(/(\d{1,2})\s*(?:–|-)\s*(\d{1,2})?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})/i);
    let dateStr = "";
    if (dateMatch) {
      const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
      const month = months[dateMatch[3]] ?? "01";
      const day = dateMatch[1].padStart(2, "0");
      dateStr = `${dateMatch[4]}-${month}-${day}`;
    }

    if (!dateStr) continue;

    // Extract venue
    const venueMatch = block.match(/(?:Arena|Challenger|Exhibition|Thunder|Hall\s*\d)/i);
    const venue = venueMatch ? venueMatch[0] : "IMPACT";

    const id = `live-${title.replace(/\W+/g, "-").toLowerCase().slice(0, 40)}`;

    events.push({
      id,
      title: { th: title, en: title },
      venue: { th: `IMPACT ${venue}`, en: `IMPACT ${venue}` },
      date: dateStr,
      timeStart: "10:00",
      timeEnd: "22:00",
      expectedCrowd: venue.toLowerCase().includes("arena") ? 10000
        : venue.toLowerCase().includes("challenger") ? 8000
        : venue.toLowerCase().includes("thunder") ? 6000
        : 4000,
      category: title.toLowerCase().includes("concert") || title.toLowerCase().includes("tour")
        ? "concert"
        : title.toLowerCase().includes("expo") || title.toLowerCase().includes("fair") || title.toLowerCase().includes("show")
          ? "expo"
          : "other",
      parkingPressure: venue.toLowerCase().includes("arena") || venue.toLowerCase().includes("challenger") ? "high" : "moderate",
      status: "confirmed"
    });
  }

  return events;
}

export async function getImpactArenaEvents(): Promise<ImpactArenaEvent[]> {
  // Return cache if fresh
  if (cachedEvents && Date.now() < cacheExpiresAt) {
    return cachedEvents;
  }

  // Try live fetch
  const html = await fetchTextOrNull(config.impactArenaCalendarUrl);

  if (html) {
    const parsed = parseEventsFromHtml(html);
    if (parsed.length >= 3) {
      cachedEvents = parsed;
      cacheExpiresAt = Date.now() + CACHE_TTL;
      return parsed;
    }
  }

  // Fallback to enriched seed data (real events manually sourced)
  cachedEvents = seedEvents;
  cacheExpiresAt = Date.now() + CACHE_TTL;
  return seedEvents;
}
