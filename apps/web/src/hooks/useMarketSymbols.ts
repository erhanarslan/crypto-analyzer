import { useEffect, useState } from "react";
import { fetchSymbols } from "../lib/api";

export function useMarketSymbols() {
  const [symbols, setSymbols] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSymbols(300);

        if (cancelled) return;

        if (!Array.isArray(data.symbols) || data.symbols.length === 0) {
          throw new Error("No symbols returned");
        }

        setSymbols(data.symbols);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError("Coin listesi alınamadı.");
          setSymbols(["BTCUSDT", "ETHUSDT"]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    symbols,
    loading,
    error,
  };
}
