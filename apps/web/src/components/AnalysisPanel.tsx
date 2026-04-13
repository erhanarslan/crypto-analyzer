import { useMemo } from "react";
import { buildStructuredAnalysis } from "../../../../packages/analysis-core/src";
import type {
  CoinTechnicalSnapshot,
  Timeframe,
} from "../../../../packages/shared/src";

type TimeframeSummaryItem = {
  timeframe: Timeframe;
  score: number;
  verdict: string;
  tone: "bullish" | "cautious" | "neutral" | "bearish";
};

type AnalysisPanelProps = {
  snapshot: CoinTechnicalSnapshot;
  timeframeSummary?: TimeframeSummaryItem[];
};

type ScoreBreakdownItem = {
  label: string;
  value: number;
  tone: "positive" | "negative" | "neutral";
};

function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value == null || Number.isNaN(value)) return "-";

  if (value >= 1000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  if (value >= 1) {
    return value.toFixed(Math.min(digits, 4));
  }

  if (value >= 0.01) {
    return value.toFixed(5);
  }

  return value.toFixed(8);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function toneClasses(tone: "bullish" | "cautious" | "neutral" | "bearish") {
  switch (tone) {
    case "bullish":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "bearish":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "cautious":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function scoreToneClasses(score: number) {
  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (score >= 65) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (score >= 50) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function breakdownToneClasses(tone: "positive" | "negative" | "neutral") {
  switch (tone) {
    case "positive":
      return "text-emerald-600";
    case "negative":
      return "text-rose-600";
    default:
      return "text-slate-600";
  }
}

function buildScoreBreakdown(
  snapshot: CoinTechnicalSnapshot,
): ScoreBreakdownItem[] {
  const items: ScoreBreakdownItem[] = [];

  const emaStackBullish =
    snapshot.ema20 > snapshot.ema50 && snapshot.ema50 > snapshot.ema200;
  const emaStackBearish =
    snapshot.ema20 < snapshot.ema50 && snapshot.ema50 < snapshot.ema200;

  if (emaStackBullish) {
    items.push({
      label: "Trend yapısı",
      value: 25,
      tone: "positive",
    });
  } else if (emaStackBearish) {
    items.push({
      label: "Trend yapısı",
      value: -10,
      tone: "negative",
    });
  } else {
    items.push({
      label: "Trend yapısı",
      value: 0,
      tone: "neutral",
    });
  }

  const priceVsEma =
    (snapshot.currentPrice > snapshot.ema20 ? 1 : 0) +
    (snapshot.currentPrice > snapshot.ema50 ? 1 : 0) +
    (snapshot.currentPrice > snapshot.ema200 ? 1 : 0);

  items.push({
    label: "EMA üstünde kalış",
    value: priceVsEma * 10,
    tone:
      priceVsEma >= 2 ? "positive" : priceVsEma === 1 ? "neutral" : "negative",
  });

  const rv = snapshot.relativeVolume ?? 0;
  if (rv >= 1.4) {
    items.push({
      label: "Hacim desteği",
      value: 10,
      tone: "positive",
    });
  } else if (rv >= 1.1) {
    items.push({
      label: "Hacim desteği",
      value: 6,
      tone: "positive",
    });
  } else if (rv < 0.85) {
    items.push({
      label: "Hacim desteği",
      value: -8,
      tone: "negative",
    });
  } else {
    items.push({
      label: "Hacim desteği",
      value: 0,
      tone: "neutral",
    });
  }

  const rsi = snapshot.rsi ?? 50;
  if (rsi >= 55 && rsi <= 70) {
    items.push({
      label: "Momentum (RSI)",
      value: 12,
      tone: "positive",
    });
  } else if (rsi >= 50 && rsi < 55) {
    items.push({
      label: "Momentum (RSI)",
      value: 6,
      tone: "positive",
    });
  } else if (rsi < 42) {
    items.push({
      label: "Momentum (RSI)",
      value: -10,
      tone: "negative",
    });
  } else if (rsi > 75) {
    items.push({
      label: "Momentum (RSI)",
      value: -4,
      tone: "negative",
    });
  } else {
    items.push({
      label: "Momentum (RSI)",
      value: 0,
      tone: "neutral",
    });
  }

  const insideSupport =
    snapshot.supportZone != null &&
    snapshot.currentPrice >= snapshot.supportZone.low &&
    snapshot.currentPrice <= snapshot.supportZone.high;

  const insideResistance =
    snapshot.resistanceZone != null &&
    snapshot.currentPrice >= snapshot.resistanceZone.low &&
    snapshot.currentPrice <= snapshot.resistanceZone.high;

  if (insideSupport) {
    items.push({
      label: "Destek bölgesi",
      value: 6,
      tone: "positive",
    });
  } else if (insideResistance) {
    items.push({
      label: "Direnç bölgesi",
      value: -4,
      tone: "negative",
    });
  } else {
    items.push({
      label: "Seviye konumu",
      value: 0,
      tone: "neutral",
    });
  }

  return items;
}

function buildDecisionSentence(
  newVerdict: string,
  existingVerdict: string,
  shortVerdict: string,
) {
  return `Yeni pozisyon: ${newVerdict}. Elde varsa: ${existingVerdict}. Short tarafı: ${shortVerdict}.`;
}

function timeframeToneClasses(
  tone: "bullish" | "cautious" | "neutral" | "bearish",
) {
  switch (tone) {
    case "bullish":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "bearish":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "cautious":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function AnalysisPanel({
  snapshot,
  timeframeSummary = [],
}: AnalysisPanelProps) {
  const analysis = useMemo(() => buildStructuredAnalysis(snapshot), [snapshot]);

  const scoreBreakdown = useMemo(
    () => buildScoreBreakdown(snapshot),
    [snapshot],
  );

  const decisionSentence = useMemo(
    () =>
      buildDecisionSentence(
        analysis.newPosition.verdict,
        analysis.existingPosition.verdict,
        analysis.shortPlan.verdict,
      ),
    [analysis],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Analiz özeti
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {snapshot.symbol} · {snapshot.timeframe.toUpperCase()}
            </h2>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${scoreToneClasses(
              snapshot.score,
            )}`}
          >
            Score {snapshot.score}
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {decisionSentence}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {analysis.headline}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Tek cümle karar
        </div>
        <div className="mt-4 grid gap-3">
          <div
            className={`rounded-2xl border px-4 py-3 ${toneClasses(
              analysis.newPosition.tone,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.14em] opacity-70">
              Yeni pozisyon
            </div>
            <div className="mt-1 text-sm font-semibold">
              {analysis.newPosition.verdict}
            </div>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 ${toneClasses(
              analysis.existingPosition.tone,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.14em] opacity-70">
              Elde varsa
            </div>
            <div className="mt-1 text-sm font-semibold">
              {analysis.existingPosition.verdict}
            </div>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 ${toneClasses(
              analysis.shortPlan.tone,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.14em] opacity-70">
              Short tarafı
            </div>
            <div className="mt-1 text-sm font-semibold">
              {analysis.shortPlan.verdict}
            </div>
          </div>
        </div>
      </div>

      {timeframeSummary.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Timeframe uyumu
          </div>

          <div className="mt-4 grid gap-3">
            {timeframeSummary.map((item) => (
              <div
                key={item.timeframe}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {item.timeframe}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {item.verdict}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${timeframeToneClasses(
                      item.tone,
                    )}`}
                  >
                    {item.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Score breakdown
        </div>

        <div className="mt-4 space-y-3">
          {scoreBreakdown.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="text-sm text-slate-700">{item.label}</div>
              <div
                className={`text-sm font-semibold ${breakdownToneClasses(
                  item.tone,
                )}`}
              >
                {item.value > 0 ? `+${item.value}` : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Kritik seviyeler
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Fiyat
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(snapshot.currentPrice)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              24h değişim
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatPercent(snapshot.changePercent24h)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Üstü teyit
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              {formatNumber(analysis.levels.confirmAbove)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Altı bozulma
            </div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              {formatNumber(analysis.levels.invalidationBelow)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              Relative volume
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {snapshot.relativeVolume == null
                ? "-"
                : snapshot.relativeVolume.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
              RSI
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {snapshot.rsi == null ? "-" : snapshot.rsi.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Güçlü yanlar
        </div>

        <div className="mt-4 space-y-3">
          {analysis.drivers.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Riskler
        </div>

        <div className="mt-4 space-y-3">
          {analysis.risks.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
