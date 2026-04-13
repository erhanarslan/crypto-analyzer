import FavoriteCompactRow from "../FavoriteCompactRow";
import type { ScanCardItem } from "../dashboard-helpers";

type FavoritesSectionProps = {
  items: ScanCardItem[];
  activeSymbol: string;
  favoriteSymbols: string[];
  favoriteDropThreshold: number;
  onOpen: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
};

export default function FavoritesSection({
  items,
  activeSymbol,
  favoriteSymbols,
  favoriteDropThreshold,
  onOpen,
  onToggleFavorite,
}: FavoritesSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Favoriler
        </div>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          Yakın takip
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isFavoriteDrop =
            (item.snapshot.changePercent24h ?? 0) <= favoriteDropThreshold;

          return (
            <FavoriteCompactRow
              key={`favorite-${item.symbol}`}
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
    </div>
  );
}
