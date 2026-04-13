export type Timeframe = "15m" | "30m" | "1h" | "4h";

export type MarketState = "trend_up" | "range" | "trend_down" | "transition";

export type ScoreBandKey =
  | "weak"
  | "watchlist"
  | "developing"
  | "strong"
  | "very_strong";

export type DecisionTone = "bullish" | "neutral" | "cautious" | "bearish";

export type DecisionVerdict =
  | "Alınabilir"
  | "Breakout teyidi beklenmeli"
  | "Pullback beklenmeli"
  | "Yeni pozisyon zayıf"
  | "Uzak durulmalı"
  | "Tutulur"
  | "Kâr korunur"
  | "Risk azaltılır"
  | "Agresif ekleme yapılmaz"
  | "Short uygun değil"
  | "Short izlenebilir"
  | "Short yalnız agresif senaryo";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceZone {
  low: number;
  high: number;
}

export interface ScoreBand {
  key: ScoreBandKey;
  label: string;
  rangeLabel: string;
  tone: DecisionTone;
  description: string;
}

export interface CoinTechnicalSnapshot {
  symbol: string;
  timeframe: Timeframe;
  currentPrice: number;
  score: number;

  ema20: number;
  ema50: number;
  ema200: number;

  supportZone?: PriceZone | null;
  resistanceZone?: PriceZone | null;

  breakoutLevel?: number | null;
  breakdownLevel?: number | null;

  relativeVolume?: number | null;
  rsi?: number | null;
  macdHistogram?: number | null;
  changePercent24h?: number | null;

  hasBullishBreakout?: boolean;
  hasBearishBreakdown?: boolean;
}

export interface StructuredDecision {
  title: string;
  verdict: DecisionVerdict;
  description: string;
  tone: DecisionTone;
}

export interface StructuredLevels {
  confirmAbove: number | null;
  invalidationBelow: number | null;
  nearestSupport: PriceZone | null;
  nearestResistance: PriceZone | null;
}

export interface StructuredAnalysisView {
  symbol: string;
  timeframe: Timeframe;
  score: number;
  scoreBand: ScoreBand;
  marketState: MarketState;
  headline: string;

  newPosition: StructuredDecision;
  existingPosition: StructuredDecision;
  shortPlan: StructuredDecision;

  levels: StructuredLevels;

  drivers: string[];
  risks: string[];

  meta: {
    price: number;
    priceVsEma20Pct: number;
    priceVsEma50Pct: number;
    priceVsEma200Pct: number;
    emaStackBullish: boolean;
    emaStackBearish: boolean;
    relativeVolume: number | null;
    rsi: number | null;
  };
}

export interface AnalyzeResponse {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  snapshot: CoinTechnicalSnapshot;
}

export interface ScanItem {
  symbol: string;
  timeframe: Timeframe;
  price: number;
  score: number;
  scoreBandLabel: string;
  marketState: MarketState;
  headline: string;
  confirmAbove: number | null;
  invalidationBelow: number | null;
}

export interface ScanResponse {
  timeframe: Timeframe;
  items: ScanItem[];
}
