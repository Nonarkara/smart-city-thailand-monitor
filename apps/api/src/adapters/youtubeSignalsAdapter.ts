import type { MediaFeedItem } from "@smart-city/shared";
import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull, fetchTextOrNull } from "./common.js";

interface YouTubeSearchResponse {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      liveBroadcastContent?: string;
    };
  }>;
}

interface YouTubeFeedPayload {
  feed?: {
    entry?: YouTubeFeedEntry | YouTubeFeedEntry[];
  };
}

interface YouTubeFeedEntry {
  id?: string;
  title?: string;
  published?: string;
  author?: {
    name?: string;
  };
  link?: {
    "@_href"?: string;
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true
});

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

function toArray<T>(value: T | T[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchChannelViaApi(channelId: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("order", "date");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("key", config.youtubeApiKey);

  const payload = await fetchJsonOrNull<YouTubeSearchResponse>(url.toString());
  return payload?.items ?? [];
}

async function fetchChannelViaFeed(channelId: string) {
  const xml = await fetchTextOrNull(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
    headers: {
      Accept: "application/atom+xml, application/xml, text/xml"
    }
  });
  if (!xml) {
    return [];
  }

  const payload = parser.parse(xml) as YouTubeFeedPayload;
  return toArray(payload.feed?.entry);
}

export async function syncYouTubeSignals() {
  if (!config.allowLiveFetch) {
    return buildResult({
      sourceId: "youtube-signals",
      status: "manual",
      message: "Enable ALLOW_LIVE_FETCH to activate YouTube signal monitoring.",
      sourceUrl: "https://developers.google.com/youtube/v3"
    });
  }

  if (config.youtubeChannelIds.length === 0) {
    return buildResult({
      sourceId: "youtube-signals",
      status: "manual",
      message: "Add YouTube channel IDs to monitor videos and livestream activity.",
      sourceUrl: "https://developers.google.com/youtube/v3"
    });
  }

  const mediaFeeds: MediaFeedItem[] = [];

  if (config.youtubeApiKey) {
    const results = await Promise.allSettled(config.youtubeChannelIds.map((channelId) => fetchChannelViaApi(channelId)));
    results
      .filter((entry): entry is PromiseFulfilledResult<NonNullable<YouTubeSearchResponse["items"]>> => entry.status === "fulfilled")
      .flatMap((entry) => entry.value)
      .slice(0, 6)
      .forEach((item, index) => {
        const videoId = item.id?.videoId;
        if (!videoId) {
          return;
        }

        const title = cleanText(item.snippet?.title, `YouTube signal ${index + 1}`);
        mediaFeeds.push({
          id: `youtube-media-${videoId}`,
          kind: item.snippet?.liveBroadcastContent === "live" ? "stream" : "link",
          label: title,
          region: item.snippet?.channelTitle ?? "YouTube",
          externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isEmbeddable: false,
          status: item.snippet?.liveBroadcastContent === "live" ? "live" : "unknown",
          source: {
            sourceName: "YouTube Signals",
            sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
            fetchedAt: new Date().toISOString(),
            publishedAt: item.snippet?.publishedAt,
            freshnessStatus: "live",
            confidence: 0.72,
            fallbackMode: "live"
          }
        });
      });
  } else {
    const results = await Promise.allSettled(config.youtubeChannelIds.map((channelId) => fetchChannelViaFeed(channelId)));
    results
      .filter((entry): entry is PromiseFulfilledResult<YouTubeFeedEntry[]> => entry.status === "fulfilled")
      .flatMap((entry) => entry.value)
      .slice(0, 6)
      .forEach((item, index) => {
        const title = cleanText(item.title, `YouTube signal ${index + 1}`);
        const externalUrl = item.link?.["@_href"] ?? `https://www.youtube.com/channel/${config.youtubeChannelIds[0]}`;
        const author = item.author?.name ?? "YouTube";
        mediaFeeds.push({
          id: `youtube-media-feed-${index}`,
          kind: /live/i.test(title) ? "stream" : "link",
          label: title,
          region: author,
          externalUrl,
          isEmbeddable: false,
          status: /live/i.test(title) ? "live" : "unknown",
          source: {
            sourceName: "YouTube Signals",
            sourceUrl: externalUrl,
            fetchedAt: new Date().toISOString(),
            publishedAt: item.published,
            freshnessStatus: "live",
            confidence: 0.68,
            fallbackMode: "live"
          }
        });
      });
  }

  if (mediaFeeds.length === 0) {
    return buildResult({
      sourceId: "youtube-signals",
      status: "stale",
      message: "YouTube monitoring is configured, but no recent channel items were returned.",
      sourceUrl: "https://developers.google.com/youtube/v3"
    });
  }

  return buildResult({
    sourceId: "youtube-signals",
    status: "live",
    message: config.youtubeApiKey
      ? `Imported ${mediaFeeds.length} YouTube video signals through the Data API.`
      : `Imported ${mediaFeeds.length} YouTube video signals through public channel feeds.`,
    sourceUrl: "https://developers.google.com/youtube/v3",
    mediaFeeds
  });
}
