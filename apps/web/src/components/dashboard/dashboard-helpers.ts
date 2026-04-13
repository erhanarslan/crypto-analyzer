import type {
  CoinTechnicalSnapshot,
  PriceZone,
  Timeframe,
} from "../../../../../packages/shared/src";

export type SpikeClassification =
  | "none"
  | "momentum"
  | "breakout"
  | "overheated";

export type ScannerSortMode = "score" | "change24h" | "volume" | "spike_first";

export type ScanCardItem = {
  symbol: string;
  timeframe: Timeframe;
  snapshot: CoinTechnicalSnapshot;
  headline: string;
  marketStateLabel: string;
  confirmAbove: number | null;
  invalidationBelow: number | null;
  spikeClassification: SpikeClassification;
  spikeLabel: string | null;
  spikeNote: string | null;
};

export type ZoneWithTouches = {
  low: number;
  high: number;
  touches: number;
};

export function formatNumber(
  value: number | null | undefined,
  digits = 4,
): string {
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

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function zoneToChartZone(zone?: PriceZone | null): ZoneWithTouches[] {
  if (!zone) return [];
  return [
    {
      low: zone.low,
      high: zone.high,
      touches: 0,
    },
  ];
}

export function scoreToneClasses(score: number): string {
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

export function changeToneClasses(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-slate-500";
  if (value >= 6) return "text-emerald-600";
  if (value >= 0) return "text-sky-600";
  if (value <= -8) return "text-rose-600";
  return "text-slate-700";
}

export function spikeToneClasses(type: SpikeClassification): string {
  switch (type) {
    case "breakout":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "momentum":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "overheated":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

export function spikeCardAccentClasses(type: SpikeClassification): string {
  switch (type) {
    case "breakout":
      return "border-emerald-300 bg-emerald-50/50";
    case "momentum":
      return "border-sky-300 bg-sky-50/50";
    case "overheated":
      return "border-amber-300 bg-amber-50/50";
    default:
      return "border-slate-200 bg-white";
  }
}

export function spikeRank(type: SpikeClassification): number {
  switch (type) {
    case "breakout":
      return 3;
    case "momentum":
      return 2;
    case "overheated":
      return 1;
    default:
      return 0;
  }
}

export function sortScannerItems(
  items: ScanCardItem[],
  mode: ScannerSortMode,
): ScanCardItem[] {
  const next = [...items];

  next.sort((a, b) => {
    if (mode === "change24h") {
      return (
        (b.snapshot.changePercent24h ?? -Infinity) -
        (a.snapshot.changePercent24h ?? -Infinity)
      );
    }

    if (mode === "volume") {
      return (
        (b.snapshot.relativeVolume ?? -Infinity) -
        (a.snapshot.relativeVolume ?? -Infinity)
      );
    }

    if (mode === "spike_first") {
      const spikeDiff =
        spikeRank(b.spikeClassification) - spikeRank(a.spikeClassification);

      if (spikeDiff !== 0) return spikeDiff;

      const scoreDiff = b.snapshot.score - a.snapshot.score;
      if (scoreDiff !== 0) return scoreDiff;

      return (
        (b.snapshot.changePercent24h ?? -Infinity) -
        (a.snapshot.changePercent24h ?? -Infinity)
      );
    }

    const scoreDiff = b.snapshot.score - a.snapshot.score;
    if (scoreDiff !== 0) return scoreDiff;

    return (
      (b.snapshot.changePercent24h ?? -Infinity) -
      (a.snapshot.changePercent24h ?? -Infinity)
    );
  });

  return next;
}
