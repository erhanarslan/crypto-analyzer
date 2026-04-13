import type { MouseEvent as ReactMouseEvent } from "react";
import {
  changeToneClasses,
  formatNumber,
  formatPercent,
  scoreToneClasses,
  spikeCardAccentClasses,
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

type CoinCardProps = {
  item: ScanCardItem;
  isFavorite: boolean;
  isActive: boolean;
  isFavoriteDrop: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
};

export default function CoinCard({
  item,
  isFavorite,
  isActive,
  isFavoriteDrop,
  onOpen,
  onToggleFavorite,
}: CoinCardProps) {
  const baseClasses = isActive
    ? "border-sky-300 bg-sky-50"
    : isFavoriteDrop
      ? "border-rose-300 bg-rose-50"
      : spikeCardAccentClasses(item.spikeClassification);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:border-slate-300 ${baseClasses}`}
      >
        <div className="mb-3 flex items-start justify-between gap-4 pr-10">
          <div>
            <div className="text-base font-semibold text-slate-900">
              {item.symbol}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
              {item.timeframe} · {item.marketStateLabel}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {item.spikeLabel && (
                <div
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${spikeToneClasses(
                    item.spikeClassification,
                  )}`}
                >
                  {item.spikeLabel}
                </div>
              )}

              {isFavoriteDrop && (
                <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  Sert düşüşte
                </div>
              )}
            </div>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${scoreToneClasses(
              item.snapshot.score,
            )}`}
          >
            {item.snapshot.score}
          </div>
        </div>

        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-700">
          {item.headline}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Price
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(item.snapshot.currentPrice)}
            </div>
          </div>

          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Üstü teyit
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              {formatNumber(item.confirmAbove)}
            </div>
          </div>

          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Altı bozulma
            </div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              {formatNumber(item.invalidationBelow)}
            </div>
          </div>

          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
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
        </div>
      </button>

      <div className="absolute right-3 top-3">
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
