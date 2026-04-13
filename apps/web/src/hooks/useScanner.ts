import { useEffect, useMemo, useRef, useState } from "react";
import type { Timeframe } from "../../../../packages/shared/src";
import type { ScanCardItem } from "../components/dashboard/dashboard-helpers";
import { fetchScanBatch, refreshScanItems } from "../lib/api";

type ScannerCacheEntry = {
  items: ScanCardItem[];
  loadedSymbols: string[];
  updatedAt: number;
};

const SCAN_VISIBLE_STEP = 20;
const SCANNER_REFRESH_MS = 5 * 60 * 1000;

export function useScanner(interval: Timeframe, availableSymbols: string[]) {
  const [items, setItems] = useState<ScanCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loadedBatchCount, setLoadedBatchCount] = useState(1);

  const scannerCacheRef = useRef<Map<Timeframe, ScannerCacheEntry>>(new Map());
  const scannerRequestIdRef = useRef(0);

  useEffect(() => {
    setLoadedBatchCount(1);

    const cached = scannerCacheRef.current.get(interval);
    if (cached) {
      setItems(cached.items);
    } else {
      setItems([]);
    }
  }, [interval]);

  useEffect(() => {
    const cached = scannerCacheRef.current.get(interval);
    const loadedCount = cached?.loadedSymbols.length ?? 0;
    const targetCount = Math.min(
      loadedBatchCount * SCAN_VISIBLE_STEP,
      availableSymbols.length,
    );

    if (targetCount <= loadedCount) return;
    if (availableSymbols.length === 0) return;

    const requestId = ++scannerRequestIdRef.current;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchScanBatch(
          interval,
          loadedCount,
          SCAN_VISIBLE_STEP,
        );

        const previous = scannerCacheRef.current.get(interval);

        const mergedMap = new Map<string, ScanCardItem>();
        previous?.items.forEach((item) => mergedMap.set(item.symbol, item));
        data.items.forEach((item) => mergedMap.set(item.symbol, item));

        const mergedItems = Array.from(mergedMap.values());

        const mergedLoadedSymbols = [
          ...(previous?.loadedSymbols ?? []),
          ...data.items.map((item) => item.symbol),
        ].filter((item, index, arr) => arr.indexOf(item) === index);

        const nextCache: ScannerCacheEntry = {
          items: mergedItems,
          loadedSymbols: mergedLoadedSymbols,
          updatedAt: Date.now(),
        };

        scannerCacheRef.current.set(interval, nextCache);

        if (requestId === scannerRequestIdRef.current) {
          setItems(nextCache.items);
        }
      } catch (error) {
        console.error(error);

        if (requestId === scannerRequestIdRef.current) {
          setError("Tarama verisi alınamadı.");
        }
      } finally {
        if (requestId === scannerRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void run();
  }, [availableSymbols.length, interval, loadedBatchCount]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const cache = scannerCacheRef.current.get(interval);
      if (!cache || cache.loadedSymbols.length === 0) return;

      const requestId = ++scannerRequestIdRef.current;

      void (async () => {
        try {
          const data = await refreshScanItems(interval, cache.loadedSymbols);

          const nextCache: ScannerCacheEntry = {
            items: data.items,
            loadedSymbols: cache.loadedSymbols,
            updatedAt: Date.now(),
          };

          scannerCacheRef.current.set(interval, nextCache);

          if (requestId === scannerRequestIdRef.current) {
            setItems(nextCache.items);
          }
        } catch (error) {
          console.error(error);
        }
      })();
    }, SCANNER_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [interval]);

  const hasMore = useMemo(() => {
    const cache = scannerCacheRef.current.get(interval);
    const loadedCount = cache?.loadedSymbols.length ?? 0;
    return loadedCount < availableSymbols.length;
  }, [availableSymbols.length, interval, items]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore: () => setLoadedBatchCount((current) => current + 1),
  };
}
