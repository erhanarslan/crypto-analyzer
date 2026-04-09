import { tr } from "../i18n/tr";

type Zone = {
  low: number;
  high: number;
  touches: number;
};

type TradePlan = {
  bias: "long_watch" | "short_risk" | "wait";
  entryHint: string;
  breakoutAbove: number | null;
  breakdownBelow: number | null;
  invalidationHint: string;
  takeProfitHint: string;
  actionComment: string;
};

type ScannerItem = {
  symbol: string;
  interval: "1h" | "4h";
  trend: "uptrend" | "downtrend" | "range";
  score: number;
  signal:
    | "possible_buy_zone"
    | "breakout_watch"
    | "pullback_entry"
    | "no_trade";
  summary: string;
  supportZones?: Zone[];
  resistanceZones?: Zone[];
  reasons?: string[];
  tradePlan?: TradePlan;
};

type Props = {
  items: ScannerItem[];
  loading: boolean;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
};

const trendBadgeMap: Record<string, string> = {
  uptrend: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  downtrend: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  range: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
};

const signalBadgeMap: Record<string, string> = {
  pullback_entry: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  breakout_watch: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  possible_buy_zone: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  no_trade: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

const biasBadgeMap: Record<string, string> = {
  long_watch: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  short_risk: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  wait: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

function getScoreTone(score: number) {
  if (score >= 70) {
    return "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200";
  }

  if (score >= 55) {
    return "text-sky-600 bg-sky-50 ring-1 ring-sky-200";
  }

  if (score >= 40) {
    return "text-amber-600 bg-amber-50 ring-1 ring-amber-200";
  }

  return "text-rose-600 bg-rose-50 ring-1 ring-rose-200";
}

function formatValue(value: number | null | undefined) {
  if (value == null) return tr.panel.notAvailable;
  return String(value);
}

function getFallbackBias(
  signal: ScannerItem["signal"],
): "long_watch" | "short_risk" | "wait" {
  if (signal === "pullback_entry" || signal === "breakout_watch") {
    return "long_watch";
  }

  if (signal === "possible_buy_zone") {
    return "wait";
  }

  return "wait";
}

function getFallbackEntryHint(item: ScannerItem) {
  if (item.signal === "pullback_entry") {
    return "Destek bölgesinde alıcı tepkisi yeniden izlenebilir.";
  }

  if (item.signal === "breakout_watch") {
    return "Direnç üzeri kalıcılık ve hacim teyidi izlenmeli.";
  }

  if (item.signal === "possible_buy_zone") {
    return "Yapı olumlu ama giriş kalitesi için ek teyit daha sağlıklı.";
  }

  return "Net işlem avantajı oluşmadan beklemek daha doğru.";
}

export default function ScannerPanel({
  items,
  loading,
  activeSymbol,
  onSelectSymbol,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {tr.scanner.title}
          </h2>
          <p className="text-sm text-slate-500">{tr.scanner.subtitle}</p>
        </div>

        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {tr.scanner.sortedByScore}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {tr.scanner.loading}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {tr.scanner.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const isActive = item.symbol === activeSymbol;
            const tradePlan = item.tradePlan;
            const bias = tradePlan?.bias ?? getFallbackBias(item.signal);
            const entryHint =
              tradePlan?.entryHint ?? getFallbackEntryHint(item);
            const breakoutAbove = tradePlan?.breakoutAbove;
            const breakdownBelow = tradePlan?.breakdownBelow;

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => onSelectSymbol(item.symbol)}
                className={[
                  "rounded-2xl border p-4 text-left shadow-sm transition",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900",
                ].join(" ")}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold">{item.symbol}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : (trendBadgeMap[item.trend] ??
                              "bg-slate-100 text-slate-700")
                        }`}
                      >
                        {tr.trend[item.trend]}
                      </div>

                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : (signalBadgeMap[item.signal] ??
                              "bg-slate-100 text-slate-700")
                        }`}
                      >
                        {tr.signal[item.signal]}
                      </div>
                    </div>
                  </div>

                  <div
                    className={[
                      "rounded-xl px-3 py-2 text-right",
                      isActive
                        ? "bg-white/10 ring-1 ring-white/15"
                        : getScoreTone(item.score),
                    ].join(" ")}
                  >
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                      {tr.panel.score}
                    </div>
                    <div className="text-lg font-bold">{item.score}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                    {tr.scanner.bias}
                  </div>
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive
                        ? "bg-white/15 text-white ring-1 ring-white/20"
                        : (biasBadgeMap[bias] ?? "bg-slate-100 text-slate-700")
                    }`}
                  >
                    {tr.tradeBias[bias]}
                  </div>
                </div>

                <div className="mb-3 space-y-2 text-sm">
                  <p className={isActive ? "text-slate-100" : "text-slate-700"}>
                    <span className="font-semibold">
                      {tr.scanner.trigger}:{" "}
                    </span>
                    {entryHint}
                  </p>

                  <p className={isActive ? "text-slate-100" : "text-slate-700"}>
                    <span className="font-semibold">
                      {tr.panel.breakoutAbove}:{" "}
                    </span>
                    {formatValue(breakoutAbove)}
                  </p>

                  <p className={isActive ? "text-slate-100" : "text-slate-700"}>
                    <span className="font-semibold">
                      {tr.panel.breakdownBelow}:{" "}
                    </span>
                    {formatValue(breakdownBelow)}
                  </p>
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                    {tr.panel.summary}
                  </div>
                  <p
                    className={`text-sm leading-6 ${
                      isActive ? "text-slate-100" : "text-slate-600"
                    }`}
                  >
                    {item.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
