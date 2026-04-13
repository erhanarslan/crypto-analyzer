import type { Timeframe } from "../../../../../../packages/shared/src";
import type { MiniTimeframeItem } from "../../../hooks/useMiniTimeframes";
import MiniTimeframeCard from "../MiniTimeframeCard";

type MiniTimeframesSectionProps = {
  items: MiniTimeframeItem[];
  activeInterval: Timeframe;
  loading: boolean;
  onSelect: (timeframe: Timeframe) => void;
};

export default function MiniTimeframesSection({
  items,
  activeInterval,
  loading,
  onSelect,
}: MiniTimeframesSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Mini timeframe görünümü
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Hızlı çoklu bakış
          </h3>
        </div>

        {loading && (
          <div className="text-sm text-slate-500">Güncelleniyor...</div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <MiniTimeframeCard
            key={item.timeframe}
            item={item}
            active={item.timeframe === activeInterval}
            onSelect={() => onSelect(item.timeframe)}
          />
        ))}
      </div>
    </div>
  );
}
