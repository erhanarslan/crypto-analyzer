import type { MouseEvent as ReactMouseEvent } from "react";
import {
  changeToneClasses,
  formatNumber,
  formatPercent,
  spikeToneClasses,
  type ScanCardItem,
} from "./dashboard-helpers";

function FavoriteButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-sm transition ${
        active
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
      aria-label="Toggle favorite"
    >
      {active ? "♥" : "♡"}
    </button>
  );
}

type FavoriteCompactRowProps = {
  item: ScanCardItem;
  isFavorite: boolean;
  isActive: boolean;
  isFavoriteDrop: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
};

export default function FavoriteCompactRow({
  item,
  isFavorite,
  isActive,
  isFavoriteDrop,
  onOpen,
  onToggleFavorite,
}: FavoriteCompactRowProps) {
  return (
    <div
      className={`grid grid-cols-[1.2fr_repeat(5,minmax(0,1fr))_auto] items-center gap-3 rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-sky-300 bg-sky-50"
          : isFavoriteDrop
            ? "border-rose-300 bg-rose-50"
            : "border-slate-200 bg-white"
      }`}
    >
      <button type="button" onClick={onOpen} className="contents text-left">
        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-semibold text-slate-900">
            {item.symbol}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              {item.timeframe}
            </span>
            {item.spikeLabel && (
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${spikeToneClasses(
                  item.spikeClassification,
                )}`}
              >
                {item.spikeLabel}
              </span>
            )}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Fiyat
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {formatNumber(item.snapshot.currentPrice)}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            24h
          </div>
          <div
            className={`mt-1 text-sm font-semibold ${changeToneClasses(
              item.snapshot.changePercent24h,
            )}`}
          >
            {formatPercent(item.snapshot.changePercent24h)}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Score
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {item.snapshot.score}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Üstü teyit
          </div>
          <div className="mt-1 text-sm font-semibold text-emerald-600">
            {formatNumber(item.confirmAbove)}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Altı bozulma
          </div>
          <div className="mt-1 text-sm font-semibold text-rose-600">
            {formatNumber(item.invalidationBelow)}
          </div>
        </div>
      </button>

      <div className="flex justify-end">
        <FavoriteButton
          active={isFavorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
        />
      </div>
    </div>
  );
}
