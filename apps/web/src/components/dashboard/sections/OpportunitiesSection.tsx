import CoinCard from "../CoinCard";
import type { ScanCardItem } from "../dashboard-helpers";

type OpportunitiesSectionProps = {
  items: ScanCardItem[];
  favoriteSymbols: string[];
  favoriteDropThreshold: number;
  activeSymbol: string;
  loading: boolean;
  hasMore: boolean;
  onOpen: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onLoadMore: () => void;
};

export default function OpportunitiesSection({
  items,
  favoriteSymbols,
  favoriteDropThreshold,
  activeSymbol,
  loading,
  hasMore,
  onOpen,
  onToggleFavorite,
  onLoadMore,
}: OpportunitiesSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Öne çıkanlar
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Score filtresine göre fırsatlar
          </h3>
        </div>

        <div className="text-sm text-slate-500">{items.length} coin</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const isFavoriteDrop =
            favoriteSymbols.includes(item.symbol) &&
            (item.snapshot.changePercent24h ?? 0) <= favoriteDropThreshold;

          return (
            <CoinCard
              key={item.symbol}
              item={item}
              isFavorite={favoriteSymbols.includes(item.symbol)}
              isActive={item.symbol === activeSymbol}
              isFavoriteDrop={isFavoriteDrop}
              onOpen={() => onOpen(item.symbol)}
              onToggleFavorite={() => onToggleFavorite(item.symbol)}
            />
          );
        })}
      </div>

      {loading && (
        <div className="mt-4 text-sm text-slate-500">
          Yeni coinler yükleniyor...
        </div>
      )}

      {!hasMore && !loading && (
        <div className="mt-4 text-sm text-slate-400">
          Taranacak ek coin kalmadı.
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            Daha fazla yükle
          </button>
        </div>
      )}
    </div>
  );
}
