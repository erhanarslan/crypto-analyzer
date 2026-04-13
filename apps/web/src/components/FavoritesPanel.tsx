import { tr } from "../i18n/tr";

type TradePlan = {
  bias: "long_watch" | "short_risk" | "wait";
  entryHint: string;
  breakoutAbove: number | null;
  breakdownBelow: number | null;
  invalidationHint: string;
  takeProfitHint: string;
  actionComment: string;
  newPositionAction: "buy_watch" | "breakout_watch" | "wait" | "avoid";
  holderAction: "hold" | "protect_profit" | "reduce_risk" | "wait";
  shortAction: "not_ready" | "watch" | "aggressive_only";
};

type FavoriteItem = {
  symbol: string;
  trend: "uptrend" | "downtrend" | "range";
  signal:
    | "possible_buy_zone"
    | "breakout_watch"
    | "pullback_entry"
    | "no_trade";
  score: number;
  summary: string;
  volumeState: "weak" | "normal" | "strong";
  tradePlan?: TradePlan;
};

type Props = {
  items: FavoriteItem[];
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
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

export default function FavoritesPanel({
  items,
  activeSymbol,
  onSelect,
  onRemove,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {tr.favorites.title}
        </h2>
        <p className="text-sm text-slate-500">{tr.favorites.subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {tr.favorites.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const isActive = item.symbol === activeSymbol;

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => onSelect(item.symbol)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold">{item.symbol}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : trendBadgeMap[item.trend]
                        }`}
                      >
                        {tr.trend[item.trend]}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : signalBadgeMap[item.signal]
                        }`}
                      >
                        {tr.signal[item.signal]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div
                      className={`rounded-xl px-3 py-2 text-right ${
                        isActive
                          ? "bg-white/10 ring-1 ring-white/15"
                          : getScoreTone(item.score)
                      }`}
                    >
                      <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                        {tr.panel.score}
                      </div>
                      <div className="text-lg font-bold">{item.score}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(item.symbol);
                      }}
                      className={`rounded-full p-2 ${
                        isActive
                          ? "bg-white/10 text-white ring-1 ring-white/15"
                          : "bg-slate-100 text-rose-500"
                      }`}
                      aria-label={tr.favorites.remove}
                    >
                      ❤
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className={isActive ? "text-slate-100" : "text-slate-700"}>
                    <span className="font-semibold">
                      {tr.panel.entryHint}:{" "}
                    </span>
                    {item.tradePlan
                      ? tr.newPositionAction[item.tradePlan.newPositionAction]
                      : tr.panel.notAvailable}
                  </p>

                  <p className={isActive ? "text-slate-100" : "text-slate-700"}>
                    <span className="font-semibold">{tr.panel.action}: </span>
                    {item.tradePlan
                      ? tr.holderAction[item.tradePlan.holderAction]
                      : tr.panel.notAvailable}
                  </p>

                  <p
                    className={`leading-6 ${
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
