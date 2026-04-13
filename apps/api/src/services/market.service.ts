import type { Candle, Timeframe } from "../../../../packages/shared/src";
import { fetchCandles, fetchTradableSymbols } from "../lib/binance";
import { MemoryCache } from "../lib/memory-cache";

const cache = new MemoryCache();

const SYMBOLS_TTL_MS = 10 * 60 * 1000;
const CANDLES_TTL_MS = 30 * 1000;

export async function getSymbols(
  quoteAsset: string,
  limit: number,
): Promise<string[]> {
  const key = `symbols:${quoteAsset}:${limit}`;
  const cached = cache.get<string[]>(key);

  if (cached) return cached;

  const symbols = await fetchTradableSymbols(quoteAsset, limit);
  cache.set(key, symbols, SYMBOLS_TTL_MS);

  return symbols;
}

export async function getCandles(
  symbol: string,
  interval: Timeframe,
  limit: number,
): Promise<Candle[]> {
  const key = `candles:${symbol}:${interval}:${limit}`;
  const cached = cache.get<Candle[]>(key);

  if (cached) return cached;

  const candles = await fetchCandles(symbol, interval, limit);
  cache.set(key, candles, CANDLES_TTL_MS);

  return candles;
}
