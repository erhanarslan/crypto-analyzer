import CoinCard from "../CoinCard";
import type { ScanCardItem } from "../dashboard-helpers";

type SpikeShowcaseSectionProps = {
  items: ScanCardItem[];
  favoriteSymbols: string[];
  favoriteDropThreshold: number;
  activeSymbol: string;
  onOpen: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
};

export default function SpikeShowcaseSection({
  items,
  favoriteSymbols,
  favoriteDropThreshold,
  activeSymbol,
  onOpen,
  onToggleFavorite,
}: SpikeShowcaseSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Ani hareketler
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Öne çıkan patlamalar
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
              key={`${item.symbol}-spike`}
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
