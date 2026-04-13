import type { MarketSnapshot } from "@smart-city/shared";
import { config } from "../config.js";
import { buildResult, fetchJsonOrNull } from "./common.js";

interface CoinGeckoPayload {
  bitcoin?: {
    usd?: number;
    usd_24h_change?: number;
  };
}

interface FrankfurterPayload {
  rates?: {
    THB?: number;
  };
}

interface GoldApiPayload {
  price?: number;
  ch?: number;
  change?: number;
}

function formatUsd(value: number) {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(0)}`;
}

function formatSigned(value: number, suffix = "%") {
  const rounded = Number.isFinite(value) ? Number(value.toFixed(1)) : 0;
  return `${rounded >= 0 ? "+" : ""}${rounded}${suffix}`;
}

interface YahooChartResult {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        symbol?: string;
      };
    }>;
  };
}

const SET_TICKERS: Array<{ symbol: string; id: string; labelTh: string; labelEn: string }> = [
  { symbol: "^SET.BK", id: "set-index", labelTh: "SET Index", labelEn: "SET Index" },
  { symbol: "IMPACT.BK", id: "set-impact", labelTh: "IMPACT Growth REIT", labelEn: "IMPACT Growth REIT" },
  { symbol: "BTS.BK", id: "set-bts", labelTh: "BTS Group", labelEn: "BTS Group Holdings" },
  { symbol: "LH.BK", id: "set-lh", labelTh: "Land & Houses", labelEn: "Land and Houses" }
];

async function fetchSetStocks(): Promise<MarketSnapshot["items"]> {
  const items: MarketSnapshot["items"] = [];
  for (const ticker of SET_TICKERS) {
    try {
      const data = await fetchJsonOrNull<YahooChartResult>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.symbol)}?range=1d&interval=1d`
      );
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice && meta.previousClose) {
        const price = meta.regularMarketPrice;
        const change = ((price - meta.previousClose) / meta.previousClose) * 100;
        const isIndex = ticker.id === "set-index";
        items.push({
          id: ticker.id,
          label: { th: ticker.labelTh, en: ticker.labelEn },
          value: isIndex ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : `฿${price.toFixed(2)}`,
          changeText: { th: `24 ชม. ${formatSigned(change)}`, en: `24h ${formatSigned(change)}` },
          tone: change >= 0.5 ? "positive" : change <= -0.5 ? "warning" : "neutral"
        });
      }
    } catch {
      // Skip failed tickers silently
    }
  }
  return items;
}

export async function syncMarketSignals() {
  const [btcPayload, fxPayload, goldPayload, setStocks] = await Promise.all([
    fetchJsonOrNull<CoinGeckoPayload>(config.marketBtcEndpoint),
    fetchJsonOrNull<FrankfurterPayload>(config.marketUsdThbEndpoint),
    fetchJsonOrNull<GoldApiPayload>(config.marketGoldEndpoint),
    fetchSetStocks()
  ]);

  const items: MarketSnapshot["items"] = [];

  if (typeof fxPayload?.rates?.THB === "number") {
    items.push({
      id: "usd-thb",
      label: { th: "ดอลลาร์ / บาท", en: "USD / THB" },
      value: fxPayload.rates.THB.toFixed(2),
      changeText: { th: "บริบทค่าเงินภูมิภาค", en: "Regional FX context" },
      tone: "neutral"
    });
  }

  if (typeof btcPayload?.bitcoin?.usd === "number") {
    items.push({
      id: "btc-usd",
      label: { th: "บิตคอยน์", en: "Bitcoin" },
      value: formatUsd(btcPayload.bitcoin.usd),
      changeText: {
        th: `24 ชม. ${formatSigned(btcPayload.bitcoin.usd_24h_change ?? 0)}`,
        en: `24h ${formatSigned(btcPayload.bitcoin.usd_24h_change ?? 0)}`
      },
      tone: (btcPayload.bitcoin.usd_24h_change ?? 0) >= 0 ? "positive" : "warning"
    });
  }

  if (typeof goldPayload?.price === "number" && goldPayload.price > 500 && goldPayload.price < 4000) {
    const delta = typeof goldPayload.ch === "number" ? goldPayload.ch : typeof goldPayload.change === "number" ? goldPayload.change : 0;
    items.push({
      id: "gold-usd",
      label: { th: "ทองคำ / ออนซ์", en: "Gold / oz" },
      value: `$${Math.round(goldPayload.price).toLocaleString("en-US")}`,
      changeText: {
        th: `การเปลี่ยนแปลง ${formatSigned(delta, "")}`,
        en: `Change ${formatSigned(delta, "")}`
      },
      tone: delta <= 0 ? "neutral" : "warning"
    });
  }

  // Add SET stock tickers
  items.push(...setStocks);

  if (items.length === 0) {
    return buildResult({
      sourceId: "market-context",
      status: "stale",
      message: "Market context endpoints are unavailable right now. Retaining cached macro signals.",
      sourceUrl: "https://api.coingecko.com"
    });
  }

  return buildResult({
    sourceId: "market-context",
    status: "live",
    message: `Market context refreshed with ${items.length} live macro signal(s).`,
    sourceUrl: "https://api.coingecko.com",
    marketSnapshotPatch: {
      updatedAt: new Date().toISOString(),
      items,
      source: {
        sourceName: "Market Context",
        sourceUrl: "https://api.coingecko.com",
        fetchedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        freshnessStatus: "live",
        confidence: 0.74,
        fallbackMode: "live"
      }
    }
  });
}
