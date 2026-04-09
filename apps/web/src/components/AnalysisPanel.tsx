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

type Props = {
  symbol: string;
  interval: string;
  trend: "uptrend" | "downtrend" | "range";
  score: number;
  signal:
    | "possible_buy_zone"
    | "breakout_watch"
    | "pullback_entry"
    | "no_trade";
  summary: string;
  reasons: string[];
  supportZones: Zone[];
  resistanceZones: Zone[];
  volumeState: "weak" | "normal" | "strong";
  volumeComment: string;
  orderFlowComment: string;
  marketContext: string;
  expertCommentary: string;
  newsState: "not_connected" | "positive" | "negative" | "mixed";
  newsComment: string;
  tradePlan: TradePlan;
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

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 55) return "text-sky-600";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

function formatZone(zone?: Zone) {
  if (!zone) return tr.panel.notAvailable;
  return `${zone.low} - ${zone.high} (${zone.touches} temas)`;
}

function formatValue(value: number | null) {
  if (value == null) return tr.panel.notAvailable;
  return String(value);
}

export default function AnalysisPanel({
  symbol,
  interval,
  trend,
  score,
  signal,
  summary,
  reasons,
  supportZones,
  resistanceZones,
  volumeState,
  volumeComment,
  orderFlowComment,
  marketContext,
  expertCommentary,
  newsState,
  newsComment,
  tradePlan,
}: Props) {
  const support = supportZones[0];
  const resistance = resistanceZones[0];

  return (
    <aside className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {symbol} / {interval}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tr.panel.technicalSummary}
          </p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            trendBadgeMap[trend] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {tr.trend[trend]}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {tr.panel.signal}
            </div>
            <div
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                signalBadgeMap[signal] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {tr.signal[signal]}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {tr.panel.score}
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
              <span className="ml-1 text-sm font-medium text-slate-500">
                /100
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr.panel.support}
              </div>
              <div className="text-sm font-medium text-slate-800">
                {formatZone(support)}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr.panel.resistance}
              </div>
              <div className="text-sm font-medium text-slate-800">
                {formatZone(resistance)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {tr.panel.summary}
          </div>
          <p className="text-sm leading-6 text-slate-700">{summary}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {tr.panel.marketContext}
          </div>
          <p className="text-sm leading-6 text-slate-700">{marketContext}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {tr.panel.volumeState}
            </div>
            <div className="mb-2 text-sm font-semibold text-slate-800">
              {tr.volumeState[volumeState]}
            </div>
            <p className="text-sm leading-6 text-slate-700">{volumeComment}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              {tr.panel.orderFlow}
            </div>
            <p className="text-sm leading-6 text-slate-700">
              {orderFlowComment}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {tr.panel.tradePlan}
            </div>

            <div
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                biasBadgeMap[tradePlan.bias] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {tr.tradeBias[tradePlan.bias]}
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.entryHint}:{" "}
              </span>
              {tradePlan.entryHint}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.breakoutAbove}:{" "}
              </span>
              {formatValue(tradePlan.breakoutAbove)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.breakdownBelow}:{" "}
              </span>
              {formatValue(tradePlan.breakdownBelow)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.invalidation}:{" "}
              </span>
              {tradePlan.invalidationHint}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.takeProfit}:{" "}
              </span>
              {tradePlan.takeProfitHint}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {tr.panel.action}:{" "}
              </span>
              {tradePlan.actionComment}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {tr.panel.expertCommentary}
          </div>
          <p className="text-sm leading-6 text-slate-700">{expertCommentary}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {tr.panel.news}
          </div>
          <div className="mb-2 text-sm font-semibold text-slate-800">
            {tr.newsState[newsState]}
          </div>
          <p className="text-sm leading-6 text-slate-700">{newsComment}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {tr.panel.reasons}
          </div>

          {reasons.length ? (
            <ul className="space-y-2">
              {reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>
                    {tr.reasons[reason as keyof typeof tr.reasons] ?? reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Açıklayıcı neden bulunmadı.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
