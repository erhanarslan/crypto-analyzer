import { useEffect, useMemo, useState } from "react";
import AnalysisPanel from "./components/AnalysisPanel";
import DashboardHeader from "./components/dashboard/sections/DashboardHeader";
import MainChartSection from "./components/dashboard/sections/MainChartSection";
import MiniTimeframesSection from "./components/dashboard/sections/MiniTimeFrameSection";
import SpikeShowcaseSection from "./components/dashboard/sections/SpikeShowcaseSection";
import FavoritesSection from "./components/dashboard/sections/FavoritesSection";
import OpportunitiesSection from "./components/dashboard/sections/OpportunitiesSection";
import {
  sortScannerItems,
  type ScannerSortMode,
} from "./components/dashboard/dashboard-helpers";
import { buildStructuredAnalysis } from "../../../packages/analysis-core/src";
import type { Timeframe } from "../../../packages/shared/src";
import { useMarketSymbols } from "./hooks/useMarketSymbols";
import { useScanner } from "./hooks/useScanner";
import { useCoinDetail } from "./hooks/useCoinDetail";
import { useMiniTimeframes } from "./hooks/useMiniTimeframes";
import { useNotifications } from "./hooks/useNotifications";

type TimeframeSummaryItem = {
  timeframe: Timeframe;
  score: number;
  verdict: string;
  tone: "bullish" | "cautious" | "neutral" | "bearish";
};

const FAVORITES_STORAGE_KEY = "crypto-analyzer-favorites";
const NOTIFICATIONS_ENABLED_KEY = "crypto-analyzer-notifications-enabled";
const SCORE_ALERT_THRESHOLD_KEY = "crypto-analyzer-score-alert-threshold";
const FAVORITE_DROP_THRESHOLD_KEY = "crypto-analyzer-favorite-drop-threshold";

function loadFavoriteSymbols(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return ["BTCUSDT", "ETHUSDT"];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ["BTCUSDT", "ETHUSDT"];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return ["BTCUSDT", "ETHUSDT"];
  }
}

function loadBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function loadNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<Timeframe>("4h");
  const [minScore, setMinScore] = useState(60);
  const [sortMode, setSortMode] = useState<ScannerSortMode>("score");

  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() =>
    loadFavoriteSymbols(),
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => loadBoolean(NOTIFICATIONS_ENABLED_KEY, false),
  );
  const [scoreAlertThreshold, setScoreAlertThreshold] = useState<number>(() =>
    loadNumber(SCORE_ALERT_THRESHOLD_KEY, 90),
  );
  const [favoriteDropThreshold, setFavoriteDropThreshold] = useState<number>(
    () => loadNumber(FAVORITE_DROP_THRESHOLD_KEY, -8),
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  const {
    symbols,
    loading: symbolsLoading,
    error: symbolsError,
  } = useMarketSymbols();

  const {
    candles,
    snapshot,
    loading: detailLoading,
    error: detailError,
    ema20,
    ema50,
    ema200,
    supportZones,
    resistanceZones,
  } = useCoinDetail(symbol, interval);

  const {
    items: miniTimeframes,
    loading: miniLoading,
    error: miniError,
  } = useMiniTimeframes(symbol);

  const {
    items: scannerItems,
    loading: scanLoading,
    error: scanError,
    hasMore,
    loadMore,
  } = useScanner(interval, symbols);

  useNotifications({
    items: scannerItems,
    favoriteSymbols,
    notificationsEnabled,
    notificationPermission,
    scoreAlertThreshold,
    favoriteDropThreshold,
  });

  useEffect(() => {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteSymbols),
    );
  }, [favoriteSymbols]);

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_ENABLED_KEY,
      String(notificationsEnabled),
    );
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem(
      SCORE_ALERT_THRESHOLD_KEY,
      String(scoreAlertThreshold),
    );
  }, [scoreAlertThreshold]);

  useEffect(() => {
    localStorage.setItem(
      FAVORITE_DROP_THRESHOLD_KEY,
      String(favoriteDropThreshold),
    );
  }, [favoriteDropThreshold]);

  const sortedScannerItems = useMemo(() => {
    return sortScannerItems(scannerItems, sortMode);
  }, [scannerItems, sortMode]);

  const spikeShowcaseItems = useMemo(() => {
    return sortedScannerItems
      .filter((item) => item.spikeClassification !== "none")
      .slice(0, 6);
  }, [sortedScannerItems]);

  const favoriteItems = useMemo(() => {
    return favoriteSymbols
      .map((favoriteSymbol) =>
        scannerItems.find((item) => item.symbol === favoriteSymbol),
      )
      .filter(Boolean);
  }, [favoriteSymbols, scannerItems]);

  const opportunityItems = useMemo(() => {
    return sortedScannerItems.filter(
      (item) =>
        item.snapshot.score >= minScore &&
        !favoriteSymbols.includes(item.symbol),
    );
  }, [sortedScannerItems, minScore, favoriteSymbols]);

  const timeframeSummary = useMemo<TimeframeSummaryItem[]>(() => {
    return miniTimeframes.map((item) => {
      const structured = buildStructuredAnalysis(item.snapshot);

      return {
        timeframe: item.timeframe,
        score: item.snapshot.score,
        verdict: structured.newPosition.verdict,
        tone: structured.newPosition.tone,
      };
    });
  }, [miniTimeframes]);

  const toggleFavorite = (targetSymbol: string) => {
    setFavoriteSymbols((current) => {
      if (current.includes(targetSymbol)) {
        return current.filter((item) => item !== targetSymbol);
      }

      return [targetSymbol, ...current];
    });
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const result = await Notification.requestPermission();
    setNotificationPermission(result);

    if (result === "granted") {
      setNotificationsEnabled(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          symbol={symbol}
          interval={interval}
          minScore={minScore}
          sortMode={sortMode}
          symbols={symbols}
          symbolsLoading={symbolsLoading}
          scoreAlertThreshold={scoreAlertThreshold}
          favoriteDropThreshold={favoriteDropThreshold}
          notificationsEnabled={notificationsEnabled}
          notificationPermission={notificationPermission}
          symbolsError={symbolsError}
          detailError={detailError}
          scanError={scanError}
          miniError={miniError}
          onSymbolChange={setSymbol}
          onIntervalChange={setInterval}
          onMinScoreChange={setMinScore}
          onSortModeChange={setSortMode}
          onScoreAlertThresholdChange={setScoreAlertThreshold}
          onFavoriteDropThresholdChange={setFavoriteDropThreshold}
          onNotificationsEnabledChange={setNotificationsEnabled}
          onRequestNotificationPermission={requestNotificationPermission}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
          <section className="space-y-6">
            <MainChartSection
              symbol={symbol}
              intervalLabel={interval.toUpperCase()}
              snapshot={snapshot}
              candles={candles}
              ema20={ema20}
              ema50={ema50}
              ema200={ema200}
              supportZones={supportZones}
              resistanceZones={resistanceZones}
              detailLoading={detailLoading}
            />

            <MiniTimeframesSection
              items={miniTimeframes}
              activeInterval={interval}
              loading={miniLoading}
              onSelect={setInterval}
            />

            <SpikeShowcaseSection
              items={spikeShowcaseItems}
              favoriteSymbols={favoriteSymbols}
              favoriteDropThreshold={favoriteDropThreshold}
              activeSymbol={symbol}
              onOpen={setSymbol}
              onToggleFavorite={toggleFavorite}
            />

            <FavoritesSection
              items={favoriteItems}
              activeSymbol={symbol}
              favoriteSymbols={favoriteSymbols}
              favoriteDropThreshold={favoriteDropThreshold}
              onOpen={setSymbol}
              onToggleFavorite={toggleFavorite}
            />

            <OpportunitiesSection
              items={opportunityItems}
              favoriteSymbols={favoriteSymbols}
              favoriteDropThreshold={favoriteDropThreshold}
              activeSymbol={symbol}
              loading={scanLoading}
              hasMore={hasMore}
              onOpen={setSymbol}
              onToggleFavorite={toggleFavorite}
              onLoadMore={loadMore}
            />
          </section>

          <aside>
            {snapshot && (
              <AnalysisPanel
                snapshot={snapshot}
                timeframeSummary={timeframeSummary}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
