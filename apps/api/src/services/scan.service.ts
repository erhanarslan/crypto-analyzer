import {
  buildSnapshotFromCandles,
  buildStructuredAnalysis,
} from "../../../../packages/analysis-core/src";
import type {
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../packages/shared/src";
import { MemoryCache } from "../lib/memory-cache";
import { getCandles, getSymbols } from "./market.service";

export type SpikeClassification =
  | "none"
  | "momentum"
  | "breakout"
  | "overheated";

export type ScanItem = {
  symbol: string;
  timeframe: Timeframe;
  snapshot: CoinTechnicalSnapshot;
  headline: string;
  marketStateLabel: string;
  confirmAbove: number | null;
  invalidationBelow: number | null;
  spikeClassification: SpikeClassification;
  spikeLabel: string | null;
  spikeNote: string | null;
};

const cache = new MemoryCache();

const SCAN_BATCH_TTL_MS = 60 * 1000;
const SCAN_SYMBOL_SET_TTL_MS = 60 * 1000;

function marketStateLabel(
  value: "trend_up" | "range" | "trend_down" | "transition",
): string {
  switch (value) {
    case "trend_up":
      return "Uptrend";
    case "range":
      return "Range";
    case "trend_down":
      return "Downtrend";
    default:
      return "Transition";
  }
}

function classifySpike(
  snapshot: CoinTechnicalSnapshot,
  marketState: "trend_up" | "range" | "trend_down" | "transition",
): {
  spikeClassification: SpikeClassification;
  spikeLabel: string | null;
  spikeNote: string | null;
} {
  const change24h = snapshot.changePercent24h ?? 0;
  const relativeVolume = snapshot.relativeVolume ?? 0;
  const rsi = snapshot.rsi ?? 50;

  const isStrong24hMove = change24h >= 6;
  const isExplosive24hMove = change24h >= 10;

  if (!isStrong24hMove) {
    return {
      spikeClassification: "none",
      spikeLabel: null,
      spikeNote: null,
    };
  }

  if (
    snapshot.hasBullishBreakout &&
    relativeVolume >= 1.2 &&
    marketState !== "trend_down"
  ) {
    return {
      spikeClassification: "breakout",
      spikeLabel: "Breakout destekli",
      spikeNote:
        "24s hareket güçlü ve kırılım teyidi var; yine de seviyesiz kovalanmamalı.",
    };
  }

  if (
    isExplosive24hMove &&
    (rsi >= 74 || relativeVolume < 0.95 || marketState === "range")
  ) {
    return {
      spikeClassification: "overheated",
      spikeLabel: "Şişmiş hareket",
      spikeNote:
        "24s yükseliş sert ama yapı fazla ısınmış olabilir; geç kalan giriş riskli.",
    };
  }

  if (
    change24h >= 6 &&
    relativeVolume >= 1.05 &&
    marketState !== "trend_down" &&
    snapshot.score >= 60
  ) {
    return {
      spikeClassification: "momentum",
      spikeLabel: "Patlayan momentum",
      spikeNote:
        "24s ivme belirgin ve teknik yapı tamamen bozuk değil; momentum takibi yapılabilir.",
    };
  }

  return {
    spikeClassification: "none",
    spikeLabel: null,
    spikeNote: null,
  };
}

async function buildScanItem(
  symbol: string,
  interval: Timeframe,
): Promise<ScanItem> {
  const candles = await getCandles(symbol, interval, 300);
  const snapshot = buildSnapshotFromCandles(symbol, interval, candles);
  const structured = buildStructuredAnalysis(snapshot);
  const spike = classifySpike(snapshot, structured.marketState);

  return {
    symbol,
    timeframe: interval,
    snapshot,
    headline: spike.spikeNote
      ? `${structured.headline} ${spike.spikeNote}`
      : structured.headline,
    marketStateLabel: marketStateLabel(structured.marketState),
    confirmAbove: structured.levels.confirmAbove,
    invalidationBelow: structured.levels.invalidationBelow,
    spikeClassification: spike.spikeClassification,
    spikeLabel: spike.spikeLabel,
    spikeNote: spike.spikeNote,
  };
}

export async function scanByOffset(params: {
  interval: Timeframe;
  offset: number;
  limit: number;
  quoteAsset: string;
  symbolUniverseLimit: number;
}) {
  const { interval, offset, limit, quoteAsset, symbolUniverseLimit } = params;

  const symbols = await getSymbols(quoteAsset, symbolUniverseLimit);
  const targetSymbols = symbols.slice(offset, offset + limit);

  const cacheKey = `scan:offset:${interval}:${quoteAsset}:${offset}:${limit}`;
  const cached = cache.get<{
    items: ScanItem[];
    total: number;
    nextOffset: number | null;
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  const results = await Promise.allSettled(
    targetSymbols.map((symbol) => buildScanItem(symbol, interval)),
  );

  const items = results
    .filter(
      (result): result is PromiseFulfilledResult<ScanItem> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .sort((a, b) => b.snapshot.score - a.snapshot.score);

  const payload = {
    items,
    total: symbols.length,
    nextOffset:
      offset + targetSymbols.length >= symbols.length
        ? null
        : offset + targetSymbols.length,
  };

  cache.set(cacheKey, payload, SCAN_BATCH_TTL_MS);
  return payload;
}

export async function scanBySymbols(params: {
  interval: Timeframe;
  symbols: string[];
}) {
  const { interval, symbols } = params;
  const normalized = [
    ...new Set(
      symbols.map((item) => item.trim().toUpperCase()).filter(Boolean),
    ),
  ];

  const cacheKey = `scan:symbols:${interval}:${normalized.join(",")}`;
  const cached = cache.get<ScanItem[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const results = await Promise.allSettled(
    normalized.map((symbol) => buildScanItem(symbol, interval)),
  );

  const items = results
    .filter(
      (result): result is PromiseFulfilledResult<ScanItem> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .sort((a, b) => b.snapshot.score - a.snapshot.score);

  cache.set(cacheKey, items, SCAN_SYMBOL_SET_TTL_MS);
  return items;
}
