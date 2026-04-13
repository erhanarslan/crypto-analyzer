import { useEffect, useRef, useState } from "react";
import {
  buildSnapshotFromCandles,
  buildStructuredAnalysis,
} from "../../../../packages/analysis-core/src";
import type {
  Candle,
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../packages/shared/src";
import { fetchCandles } from "../lib/api";

export type MiniTimeframeItem = {
  timeframe: Timeframe;
  candles: Candle[];
  snapshot: CoinTechnicalSnapshot;
  headline: string;
};

type MiniCacheEntry = {
  items: MiniTimeframeItem[];
  updatedAt: number;
};

const TIMEFRAMES: Timeframe[] = ["15m", "30m", "1h", "4h"];
const MINI_CACHE_TTL_MS = 60_000;

export function useMiniTimeframes(symbol: string) {
  const [items, setItems] = useState<MiniTimeframeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const miniCacheRef = useRef<Map<string, MiniCacheEntry>>(new Map());
  const miniRequestIdRef = useRef(0);

  useEffect(() => {
    const cached = miniCacheRef.current.get(symbol);
    const isFresh = cached && Date.now() - cached.updatedAt < MINI_CACHE_TTL_MS;

    if (cached && isFresh) {
      setItems(cached.items);
      return;
    }

    const run = async () => {
      const requestId = ++miniRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.allSettled(
          TIMEFRAMES.map(async (tf) => {
            const data = await fetchCandles(symbol, tf, 220);
            const builtSnapshot = buildSnapshotFromCandles(
              data.symbol,
              data.interval,
              data.candles,
            );
            const structured = buildStructuredAnalysis(builtSnapshot);

            const item: MiniTimeframeItem = {
              timeframe: tf,
              candles: data.candles,
              snapshot: builtSnapshot,
              headline: structured.headline,
            };

            return item;
          }),
        );

        const nextItems = results
          .filter(
            (result): result is PromiseFulfilledResult<MiniTimeframeItem> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value)
          .sort(
            (a, b) =>
              TIMEFRAMES.indexOf(a.timeframe) - TIMEFRAMES.indexOf(b.timeframe),
          );

        miniCacheRef.current.set(symbol, {
          items: nextItems,
          updatedAt: Date.now(),
        });

        if (requestId === miniRequestIdRef.current) {
          setItems(nextItems);
        }
      } catch (error) {
        console.error(error);

        if (requestId === miniRequestIdRef.current) {
          setItems([]);
          setError("Timeframe görünümü alınamadı.");
        }
      } finally {
        if (requestId === miniRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void run();
  }, [symbol]);

  return {
    items,
    loading,
    error,
  };
}
