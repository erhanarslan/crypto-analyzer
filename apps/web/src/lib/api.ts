import type {
  Candle,
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../packages/shared/src";

export type MarketCandlesResponse = {
  symbol: string;
  interval: Timeframe;
  candles: Candle[];
};

export type MarketSymbolsResponse = {
  quoteAsset: string;
  count: number;
  symbols: string[];
};

export type SpikeClassification =
  | "none"
  | "momentum"
  | "breakout"
  | "overheated";

export type ScanCardItem = {
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

export type ScanResponse = {
  interval: Timeframe;
  offset: number;
  limit: number;
  total: number;
  count: number;
  nextOffset: number | null;
  items: ScanCardItem[];
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchSymbols(limit = 300) {
  return getJson<MarketSymbolsResponse>(
    `/api/market/symbols?quoteAsset=USDT&limit=${limit}`,
  );
}

export function fetchCandles(symbol: string, interval: Timeframe, limit = 300) {
  return getJson<MarketCandlesResponse>(
    `/api/market/candles?symbol=${symbol}&interval=${interval}&limit=${limit}`,
  );
}

export function fetchScanBatch(
  interval: Timeframe,
  offset: number,
  limit: number,
) {
  return getJson<ScanResponse>(
    `/api/scan?interval=${interval}&offset=${offset}&limit=${limit}&quoteAsset=USDT`,
  );
}

export function refreshScanItems(interval: Timeframe, symbols: string[]) {
  return getJson<ScanResponse>(
    `/api/scan?interval=${interval}&symbols=${encodeURIComponent(symbols.join(","))}`,
  );
}
