import Chart from "../../Chart";
import type {
  Candle,
  CoinTechnicalSnapshot,
} from "../../../../../../packages/shared/src";

type LinePoint = {
  time: number;
  value: number;
};

type ZoneWithTouches = {
  low: number;
  high: number;
  touches: number;
};

type MainChartSectionProps = {
  symbol: string;
  intervalLabel: string;
  snapshot: CoinTechnicalSnapshot | null;
  candles: Candle[];
  ema20: LinePoint[];
  ema50: LinePoint[];
  ema200: LinePoint[];
  supportZones: ZoneWithTouches[];
  resistanceZones: ZoneWithTouches[];
  detailLoading: boolean;
};

export default function MainChartSection({
  symbol,
  intervalLabel,
  snapshot,
  candles,
  ema20,
  ema50,
  ema200,
  supportZones,
  resistanceZones,
  detailLoading,
}: MainChartSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Ana grafik
          </div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {symbol} · {intervalLabel}
          </h2>
        </div>

        {snapshot && (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
            Score {snapshot.score}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <Chart
          data={candles}
          ema20={ema20}
          ema50={ema50}
          ema200={ema200}
          supportZones={supportZones}
          resistanceZones={resistanceZones}
          height={440}
        />
      </div>

      {detailLoading && candles.length === 0 && (
        <div className="mt-3 text-sm text-slate-500">Grafik yükleniyor...</div>
      )}
    </div>
  );
}
