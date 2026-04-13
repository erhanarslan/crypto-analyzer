import Chart from "../Chart";
import { calculateEMA } from "../../../../../packages/analysis-core/src";
import type {
  Candle,
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../../packages/shared/src";
import { scoreToneClasses, zoneToChartZone } from "./dashboard-helpers";

type LinePoint = {
  time: number;
  value: number;
};

type MiniTimeframeItem = {
  timeframe: Timeframe;
  candles: Candle[];
  snapshot: CoinTechnicalSnapshot;
  headline: string;
};

function buildLineSeries(candles: Candle[], period: number): LinePoint[] {
  const closes = candles.map((item) => item.close);
  const emaValues = calculateEMA(closes, period);

  return candles.map((item, index) => ({
    time: item.time,
    value: emaValues[index],
  }));
}

type MiniTimeframeCardProps = {
  item: MiniTimeframeItem;
  active: boolean;
  onSelect: () => void;
};

export default function MiniTimeframeCard({
  item,
  active,
  onSelect,
}: MiniTimeframeCardProps) {
  const ema20 = buildLineSeries(item.candles, 20);
  const ema50 = buildLineSeries(item.candles, 50);
  const ema200 = buildLineSeries(item.candles, 200);

  const supportZones = zoneToChartZone(item.snapshot.supportZone);
  const resistanceZones = zoneToChartZone(item.snapshot.resistanceZone);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            {item.timeframe}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {item.snapshot.symbol}
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreToneClasses(
            item.snapshot.score,
          )}`}
        >
          {item.snapshot.score}
        </div>
      </div>

      <div className="mb-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <Chart
          data={item.candles}
          ema20={ema20}
          ema50={ema50}
          ema200={ema200}
          supportZones={supportZones}
          resistanceZones={resistanceZones}
          height={140}
          compact
        />
      </div>

      <p className="line-clamp-2 text-xs leading-5 text-slate-600">
        {item.headline}
      </p>
    </button>
  );
}
