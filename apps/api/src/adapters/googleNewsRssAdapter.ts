import type { NewsItem } from "@smart-city/shared";
import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import { buildResult } from "./common.js";

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
}

interface RssPayload {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true
});

const defaultQueries = [
  "\"smart city\" Thailand",
  "\"smart mobility\" Thailand",
  "\"smart environment\" Thailand",
  "\"smart living\" Thailand",
  "\"Smart City Thailand Office\" OR \"Digital Economy Promotion Agency\""
];

function inferDomain(text: string) {
  const source = text.toLowerCase();
  if (source.includes("environment") || source.includes("climate") || source.includes("air") || source.includes("flood")) {
    return "environment";
  }
  if (source.includes("mobility") || source.includes("transit") || source.includes("transport")) {
    return "mobility";
  }
  if (source.includes("economy") || source.includes("investment") || source.includes("industry")) {
    return "economy";
  }
  if (source.includes("energy") || source.includes("power")) {
    return "energy";
  }
  if (source.includes("people") || source.includes("skills") || source.includes("education")) {
    return "people";
  }
  if (source.includes("living") || source.includes("health") || source.includes("safety")) {
    return "living";
  }
  if (source.includes("governance") || source.includes("data") || source.includes("policy")) {
    return "governance";
  }
  return undefined;
}

function inferCity(text: string) {
  const source = text.toLowerCase();
  if (source.includes("bangkok")) return "bangkok";
  if (source.includes("phuket")) return "phuket";
  if (source.includes("chiang mai")) return "chiang-mai";
  if (source.includes("khon kaen")) return "khon-kaen";
  return undefined;
}

function stripHtml(value: string | undefined) {
  return decodeEntities(
    (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  );
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function toArray(value?: RssItem | RssItem[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchXml(url: string) {
  if (!config.allowLiveFetch || !url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml"
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

async function fetchGoogleQuery(query: string) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "TH");
  url.searchParams.set("ceid", "TH:en");

  const xml = await fetchXml(url.toString());
  if (!xml) return [];

  const payload = parser.parse(xml) as RssPayload;
  return toArray(payload.rss?.channel?.item);
}

async function fetchAlertFeed(url: string) {
  const xml = await fetchXml(url);
  if (!xml) return [];

  const payload = parser.parse(xml) as RssPayload;
  return toArray(payload.rss?.channel?.item);
}

function normalizeItems(items: RssItem[], sourceName: string): NewsItem[] {
  return items
    .filter((item) => item.title || item.description)
    .map((item, index) => {
      const title = stripHtml(item.title);
      const excerpt = stripHtml(item.description);
      const combined = `${title} ${excerpt}`;

      return {
        id: `external-google-${sourceName.toLowerCase().replace(/\s+/g, "-")}-${index}`,
        slug: `external-google-${sourceName.toLowerCase().replace(/\s+/g, "-")}-${index}`,
        title: {
          th: title || "อัปเดตข่าวเมืองอัจฉริยะ",
          en: title || "Smart city news update"
        },
        excerpt: {
          th: excerpt || "สัญญาณข่าวภายนอกจาก Google feed",
          en: excerpt || "External news signal from a Google feed."
        },
        kind: "external",
        citySlug: inferCity(combined),
        domainSlug: inferDomain(combined),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: {
          sourceName,
          sourceUrl: item.link ?? "https://news.google.com",
          fetchedAt: new Date().toISOString(),
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          freshnessStatus: "live",
          confidence: 0.76,
          fallbackMode: "live"
        }
      };
    });
}

export async function syncGoogleNewsRss() {
  if (!config.allowLiveFetch) {
    return buildResult({
      sourceId: "google-news-rss",
      status: "manual",
      message: "Enable ALLOW_LIVE_FETCH to activate free Google RSS news sync.",
      sourceUrl: "https://news.google.com"
    });
  }

  try {
    const queryList = config.googleNewsRssQueries.length > 0 ? config.googleNewsRssQueries : defaultQueries;
    const [queryResults, alertResults] = await Promise.all([
      Promise.allSettled(queryList.map((query) => fetchGoogleQuery(query))),
      Promise.allSettled(config.googleAlertsFeeds.map((url) => fetchAlertFeed(url)))
    ]);

    const queryItems = queryResults
      .filter((result): result is PromiseFulfilledResult<RssItem[]> => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const alertItems = alertResults
      .filter((result): result is PromiseFulfilledResult<RssItem[]> => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const newsItems = [...normalizeItems(queryItems, "Google News RSS"), ...normalizeItems(alertItems, "Google Alerts RSS")]
      .filter((item, index, array) => {
        const fingerprint = `${item.source.sourceUrl ?? ""}|${item.title.en}`;
        return array.findIndex((candidate) => `${candidate.source.sourceUrl ?? ""}|${candidate.title.en}` === fingerprint) === index;
      })
      .slice(0, 10);

    if (newsItems.length === 0) {
      return buildResult({
        sourceId: "google-news-rss",
        status: "stale",
        message: "Google RSS feeds returned no items. Keeping cached external news.",
        sourceUrl: "https://news.google.com"
      });
    }

    const failedCount =
      queryResults.filter((result) => result.status === "rejected").length +
      alertResults.filter((result) => result.status === "rejected").length;

    return buildResult({
      sourceId: "google-news-rss",
      status: "live",
      message:
        failedCount > 0
          ? `Imported ${newsItems.length} items from Google RSS (${failedCount} feed(s) failed).`
          : `Imported ${newsItems.length} items from Google RSS.`,
      sourceUrl: "https://news.google.com",
      newsItems
    });
  } catch {
    return buildResult({
      sourceId: "google-news-rss",
      status: "stale",
      message: "Google RSS sync failed unexpectedly. Keeping cached external news.",
      sourceUrl: "https://news.google.com"
    });
  }
}
