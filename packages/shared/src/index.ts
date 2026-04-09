export type Timeframe = "1h" | "4h";

export type Trend = "uptrend" | "downtrend" | "range";

export type Signal =
  | "possible_buy_zone"
  | "breakout_watch"
  | "pullback_entry"
  | "no_trade";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LinePoint = {
  time: number;
  value: number;
};

export type Zone = {
  low: number;
  high: number;
  touches: number;
};

export type VolumeState = "weak" | "normal" | "strong";

export type NewsState = "not_connected" | "positive" | "negative" | "mixed";

export type TradePlan = {
  bias: "long_watch" | "short_risk" | "wait";
  entryHint: string;
  breakoutAbove: number | null;
  breakdownBelow: number | null;
  invalidationHint: string;
  takeProfitHint: string;
  actionComment: string;
};

export type AnalysisReport = {
  symbol: string;
  interval: Timeframe;
  trend: Trend;
  supportZones: Zone[];
  resistanceZones: Zone[];
  score: number;
  signal: Signal;
  reasons: string[];
  summary: string;
  ema20: LinePoint[];
  ema50: LinePoint[];
  ema200: LinePoint[];

  volumeState: VolumeState;
  volumeComment: string;
  orderFlowComment: string;
  marketContext: string;
  expertCommentary: string;

  newsState: NewsState;
  newsComment: string;

  tradePlan: TradePlan;
};
