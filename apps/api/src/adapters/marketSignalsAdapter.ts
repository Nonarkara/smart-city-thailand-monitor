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

export async function syncMarketSignals() {
  const [btcPayload, fxPayload, goldPayload] = await Promise.all([
    fetchJsonOrNull<CoinGeckoPayload>(config.marketBtcEndpoint),
    fetchJsonOrNull<FrankfurterPayload>(config.marketUsdThbEndpoint),
    fetchJsonOrNull<GoldApiPayload>(config.marketGoldEndpoint)
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
