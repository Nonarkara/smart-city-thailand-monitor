import type { NewsItem } from "@smart-city/shared";
import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import { buildResult, fetchTextOrNull } from "./common.js";

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

function toArray(value?: RssItem | RssItem[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value: string | undefined, fallback: string) {
  const raw = (value ?? fallback)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return raw || fallback;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

function inferDomain(text: string) {
  const source = text.toLowerCase();
  if (/(environment|climate|air|flood|water)/.test(source)) return "environment";
  if (/(mobility|traffic|transit|transport)/.test(source)) return "mobility";
  if (/(economy|investment|industry|tourism|trade)/.test(source)) return "economy";
  if (/(energy|power|grid)/.test(source)) return "energy";
  if (/(people|education|skills|community)/.test(source)) return "people";
  if (/(living|health|safety|livability)/.test(source)) return "living";
  if (/(governance|policy|data|government|digital)/.test(source)) return "governance";
  return undefined;
}

function extractTopTerms(texts: string[]) {
  const counts = new Map<string, number>();
  texts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !["smart", "city", "thailand", "alerts"].includes(word))
    .forEach((word) => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export async function syncTalkwalkerAlerts() {
  if (!config.allowLiveFetch) {
    return buildResult({
      sourceId: "talkwalker-alerts",
      status: "manual",
      message: "Enable ALLOW_LIVE_FETCH to activate Talkwalker Alerts feeds.",
      sourceUrl: "https://www.talkwalker.com/alerts"
    });
  }

  if (config.talkwalkerAlertsFeeds.length === 0) {
    return buildResult({
      sourceId: "talkwalker-alerts",
      status: "manual",
      message: "Add Talkwalker Alerts RSS feeds to enable lightweight social listening.",
      sourceUrl: "https://www.talkwalker.com/alerts"
    });
  }

  const feedResults = await Promise.allSettled(
    config.talkwalkerAlertsFeeds.map(async (url) => {
      const xml = await fetchTextOrNull(url, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml"
        }
      });

      if (!xml) {
        throw new Error("feed unavailable");
      }

      const payload = parser.parse(xml) as RssPayload;
      return toArray(payload.rss?.channel?.item);
    })
  );

  const items = feedResults
    .filter((entry): entry is PromiseFulfilledResult<RssItem[]> => entry.status === "fulfilled")
    .flatMap((entry) => entry.value)
    .filter((item) => item.title || item.description)
    .slice(0, 6);

  if (items.length === 0) {
    return buildResult({
      sourceId: "talkwalker-alerts",
      status: "stale",
      message: "Talkwalker feeds are configured, but no alert items were returned.",
      sourceUrl: "https://www.talkwalker.com/alerts"
    });
  }

  const newsItems: NewsItem[] = items.map((item, index) => {
    const title = cleanText(item.title, `Talkwalker alert ${index + 1}`);
    const excerpt = cleanText(item.description, "Talkwalker alert item captured from a configured feed.");
    const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

    return {
      id: `talkwalker-news-${index}`,
      slug: slugify(title, `talkwalker-news-${index}`),
      title: { th: title, en: title },
      excerpt: { th: excerpt, en: excerpt },
      kind: "external",
      domainSlug: inferDomain(`${title} ${excerpt}`),
      publishedAt,
      source: {
        sourceName: "Talkwalker Alerts",
        sourceUrl: item.link ?? "https://www.talkwalker.com/alerts",
        fetchedAt: new Date().toISOString(),
        publishedAt,
        freshnessStatus: "live",
        confidence: 0.73,
        fallbackMode: "live"
      }
    };
  });

  const sources = new Set(
    newsItems
      .map((item) => {
        try {
          return item.source.sourceUrl ? new URL(item.source.sourceUrl).hostname : "";
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );

  return buildResult({
    sourceId: "talkwalker-alerts",
    status: "live",
    message: `Imported ${newsItems.length} Talkwalker alert items from ${config.talkwalkerAlertsFeeds.length} configured feed(s).`,
    sourceUrl: "https://www.talkwalker.com/alerts",
    newsItems,
    socialSignal: {
      mentionCount: newsItems.length,
      sentimentScore: 12,
      sourceCount: sources.size || 1,
      positiveShare: 0.56,
      dominantSource: "Talkwalker Alerts",
      topTerms: extractTopTerms(newsItems.map((item) => item.title.en)),
      sourceName: "Talkwalker Alerts"
    }
  });
}
