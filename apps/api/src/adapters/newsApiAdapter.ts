import type { NewsItem } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult } from "./common.js";

interface NewsApiResponse {
  articles?: Array<{
    title?: string;
    description?: string;
    publishedAt?: string;
    url?: string;
    source?: {
      name?: string;
    };
  }>;
}

const defaultQueries = [
  "\"smart city\" AND Thailand",
  "\"city data platform\" AND Thailand",
  "(\"smart mobility\" OR \"smart environment\" OR \"smart living\") AND Thailand"
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

async function fetchQuery(query: string) {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("searchIn", "title,description");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(config.newsApiPageSize));

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": config.newsApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed for query: ${query}`);
  }

  return (await response.json()) as NewsApiResponse;
}

export async function syncNewsApi() {
  if (!config.allowLiveFetch || !config.newsApiKey) {
    return buildResult({
      sourceId: "news-api",
      status: "manual",
      message: "NewsAPI key is not configured for live sync.",
      sourceUrl: "https://newsapi.org/docs"
    });
  }

  try {
    const queries = config.newsApiQueries.length > 0 ? config.newsApiQueries : defaultQueries;
    const settled = await Promise.allSettled(queries.map((query) => fetchQuery(query)));

    const successfulPayloads = settled
      .filter((result): result is PromiseFulfilledResult<NewsApiResponse> => result.status === "fulfilled")
      .map((result) => result.value);

    if (successfulPayloads.length === 0) {
      return buildResult({
        sourceId: "news-api",
        status: "stale",
        message: "NewsAPI requests failed. Retaining current external news items.",
        sourceUrl: "https://newsapi.org/docs"
      });
    }

    const dedupedArticles = successfulPayloads
      .flatMap((payload) => payload.articles ?? [])
      .filter((article, index, array) => {
        const fingerprint = `${article.url ?? ""}|${article.title ?? ""}`;
        return array.findIndex((candidate) => `${candidate.url ?? ""}|${candidate.title ?? ""}` === fingerprint) === index;
      })
      .filter((article) => article.title || article.description)
      .slice(0, 8);

    const newsItems: NewsItem[] = dedupedArticles.map((article, index) => {
      const combinedText = `${article.title ?? ""} ${article.description ?? ""}`;
      return {
        id: `external-newsapi-${index}`,
        slug: `external-newsapi-${index}`,
        title: {
          th: article.title ?? "ข่าวเมืองอัจฉริยะจากภายนอก",
          en: article.title ?? "External smart city signal"
        },
        excerpt: {
          th: article.description ?? "อัปเดตจากแหล่งข่าวภายนอก",
          en: article.description ?? "External headline imported through NewsAPI."
        },
        kind: "external",
        citySlug: inferCity(combinedText),
        domainSlug: inferDomain(combinedText),
        publishedAt: article.publishedAt ?? new Date().toISOString(),
        source: {
          sourceName: article.source?.name ?? "NewsAPI",
          sourceUrl: article.url ?? "https://newsapi.org/docs",
          fetchedAt: new Date().toISOString(),
          publishedAt: article.publishedAt,
          freshnessStatus: "live",
          confidence: 0.78,
          fallbackMode: "live"
        }
      };
    });

    const failedCount = settled.filter((result) => result.status === "rejected").length;

    return buildResult({
      sourceId: "news-api",
      status: "live",
      message:
        failedCount > 0
          ? `Imported ${newsItems.length} external articles (${failedCount} query set(s) failed).`
          : `Imported ${newsItems.length} external articles.`,
      sourceUrl: "https://newsapi.org/docs",
      newsItems
    });
  } catch {
    return buildResult({
      sourceId: "news-api",
      status: "stale",
      message: "NewsAPI request threw an error. Keeping cached items.",
      sourceUrl: "https://newsapi.org/docs"
    });
  }
}
