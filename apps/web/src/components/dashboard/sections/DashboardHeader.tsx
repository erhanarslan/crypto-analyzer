import SymbolPicker from "../SymbolPicker";
import type { ScannerSortMode } from "../dashboard-helpers";
import type { Timeframe } from "../../../../../../packages/shared/src";

type DashboardHeaderProps = {
  symbol: string;
  interval: Timeframe;
  minScore: number;
  sortMode: ScannerSortMode;

  symbols: string[];
  symbolsLoading: boolean;

  scoreAlertThreshold: number;
  favoriteDropThreshold: number;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission | "unsupported";

  symbolsError: string | null;
  detailError: string | null;
  scanError: string | null;
  miniError: string | null;

  onSymbolChange: (symbol: string) => void;
  onIntervalChange: (value: Timeframe) => void;
  onMinScoreChange: (value: number) => void;
  onSortModeChange: (value: ScannerSortMode) => void;

  onScoreAlertThresholdChange: (value: number) => void;
  onFavoriteDropThresholdChange: (value: number) => void;
  onNotificationsEnabledChange: (value: boolean) => void;
  onRequestNotificationPermission: () => void;
};

const SCORE_FILTER_OPTIONS = [0, 40, 50, 60, 70, 80, 90];
const TIMEFRAMES: Timeframe[] = ["15m", "30m", "1h", "4h"];
const SORT_OPTIONS: { value: ScannerSortMode; label: string }[] = [
  { value: "score", label: "Sırala: Score" },
  { value: "change24h", label: "Sırala: 24h değişim" },
  { value: "volume", label: "Sırala: Hacim" },
  { value: "spike_first", label: "Sırala: Spike öncelikli" },
];

export default function DashboardHeader({
  symbol,
  interval,
  minScore,
  sortMode,
  symbols,
  symbolsLoading,
  scoreAlertThreshold,
  favoriteDropThreshold,
  notificationsEnabled,
  notificationPermission,
  symbolsError,
  detailError,
  scanError,
  miniError,
  onSymbolChange,
  onIntervalChange,
  onMinScoreChange,
  onSortModeChange,
  onScoreAlertThresholdChange,
  onFavoriteDropThresholdChange,
  onNotificationsEnabledChange,
  onRequestNotificationPermission,
}: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Crypto Analyzer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tekrarsız, karar odaklı teknik analiz paneli
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <SymbolPicker
            symbols={symbols}
            value={symbol}
            loading={symbolsLoading}
            onChange={onSymbolChange}
          />

          <select
            value={interval}
            onChange={(e) => onIntervalChange(e.target.value as Timeframe)}
            className="min-w-[120px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {TIMEFRAMES.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={minScore}
            onChange={(e) => onMinScoreChange(Number(e.target.value))}
            className="min-w-[140px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {SCORE_FILTER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                Min score: {value}+
              </option>
            ))}
          </select>

          <select
            value={sortMode}
            onChange={(e) =>
              onSortModeChange(e.target.value as ScannerSortMode)
            }
            className="min-w-[160px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Score bildirimi
            </span>
            <input
              type="number"
              min={50}
              max={100}
              value={scoreAlertThreshold}
              onChange={(e) =>
                onScoreAlertThresholdChange(Number(e.target.value))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Favori düşüş eşiği %
            </span>
            <input
              type="number"
              value={favoriteDropThreshold}
              onChange={(e) =>
                onFavoriteDropThresholdChange(Number(e.target.value))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => onNotificationsEnabledChange(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">
              Bildirimler
            </span>
          </label>
        </div>

        <div className="flex items-center justify-start md:justify-end">
          <button
            type="button"
            onClick={onRequestNotificationPermission}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            Bildirim izni: {notificationPermission}
          </button>
        </div>
      </div>

      {(symbolsError || detailError || scanError || miniError) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {[symbolsError, detailError, scanError, miniError]
            .filter(Boolean)
            .join(" · ")}
        </div>
      )}
    </header>
  );
}
