import type { Candle, Timeframe } from "../../../../packages/shared/src";

const BINANCE_BASE_URL = "https://data-api.binance.vision";

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

type ExchangeInfoResponse = {
  symbols: Array<{
    symbol: string;
    status: string;
    quoteAsset: string;
    isSpotTradingAllowed: boolean;
  }>;
};

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Binance request failed: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTradableSymbols(
  quoteAsset: string,
  limit: number,
): Promise<string[]> {
  const data = await fetchJson<ExchangeInfoResponse>(
    `${BINANCE_BASE_URL}/api/v3/exchangeInfo`,
  );

  return data.symbols
    .filter(
      (item) =>
        item.status === "TRADING" &&
        item.quoteAsset === quoteAsset &&
        item.isSpotTradingAllowed,
    )
    .map((item) => item.symbol)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit);
}

export async function fetchCandles(
  symbol: string,
  interval: Timeframe,
  limit: number,
): Promise<Candle[]> {
  const url =
    `${BINANCE_BASE_URL}/api/v3/klines` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&limit=${encodeURIComponent(limit)}`;

  const data = await fetchJson<BinanceKline[]>(url);

  return data.map((item) => ({
    time: Math.floor(item[0] / 1000),
    open: toNumber(item[1]),
    high: toNumber(item[2]),
    low: toNumber(item[3]),
    close: toNumber(item[4]),
    volume: toNumber(item[5]),
  }));
}
