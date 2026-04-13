import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSnapshotFromCandles,
  calculateEMA,
} from "../../../../packages/analysis-core/src";
import type {
  Candle,
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../packages/shared/src";
import { fetchCandles } from "../lib/api";
import { zoneToChartZone } from "../components/dashboard/dashboard-helpers";

type DetailCacheEntry = {
  candles: Candle[];
  snapshot: CoinTechnicalSnapshot;
  updatedAt: number;
};

type LinePoint = {
  time: number;
  value: number;
};

const DETAIL_REFRESH_MS = 10_000;

function buildLineSeries(candles: Candle[], period: number): LinePoint[] {
  const closes = candles.map((item) => item.close);
  const emaValues = calculateEMA(closes, period);

  return candles.map((item, index) => ({
    time: item.time,
    value: emaValues[index],
  }));
}

export function useCoinDetail(symbol: string, interval: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [snapshot, setSnapshot] = useState<CoinTechnicalSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailCacheRef = useRef<Map<string, DetailCacheEntry>>(new Map());
  const detailRequestIdRef = useRef(0);

  const detailKey = `${symbol}:${interval}`;

  useEffect(() => {
    const applyDetailCacheIfExists = () => {
      const cached = detailCacheRef.current.get(detailKey);
      if (!cached) return false;

      setCandles(cached.candles);
      setSnapshot(cached.snapshot);
      return true;
    };

    const fetchAndStoreDetail = async (silently = false) => {
      const requestId = ++detailRequestIdRef.current;

      if (!silently) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await fetchCandles(symbol, interval, 300);
        const builtSnapshot = buildSnapshotFromCandles(
          data.symbol,
          data.interval,
          data.candles,
        );

        const cacheValue: DetailCacheEntry = {
          candles: data.candles,
          snapshot: builtSnapshot,
          updatedAt: Date.now(),
        };

        detailCacheRef.current.set(detailKey, cacheValue);

        if (requestId === detailRequestIdRef.current) {
          setCandles(data.candles);
          setSnapshot(builtSnapshot);
        }
      } catch (error) {
        console.error(error);

        if (requestId === detailRequestIdRef.current) {
          setError("Coin analizi alınamadı.");
        }
      } finally {
        if (!silently && requestId === detailRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    const hasCache = applyDetailCacheIfExists();
    void fetchAndStoreDetail(hasCache);

    const timer = window.setInterval(() => {
      void fetchAndStoreDetail(true);
    }, DETAIL_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [detailKey, interval, symbol]);

  const ema20 = useMemo(() => buildLineSeries(candles, 20), [candles]);
  const ema50 = useMemo(() => buildLineSeries(candles, 50), [candles]);
  const ema200 = useMemo(() => buildLineSeries(candles, 200), [candles]);

  const supportZones = useMemo(
    () => zoneToChartZone(snapshot?.supportZone),
    [snapshot],
  );

  const resistanceZones = useMemo(
    () => zoneToChartZone(snapshot?.resistanceZone),
    [snapshot],
  );

  return {
    candles,
    snapshot,
    loading,
    error,
    ema20,
    ema50,
    ema200,
    supportZones,
    resistanceZones,
  };
}
