import type {
  Candle,
  CoinTechnicalSnapshot,
  DecisionTone,
  MarketState,
  PriceZone,
  ScoreBand,
  StructuredAnalysisView,
  StructuredDecision,
  StructuredLevels,
  Timeframe,
} from "../../shared/src";

const clampScore = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const average = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const pctFrom = (value: number, base: number): number => {
  if (!base) return 0;
  return ((value - base) / base) * 100;
};

const zoneMid = (zone?: PriceZone | null): number | null => {
  if (!zone) return null;
  return (zone.low + zone.high) / 2;
};

const isInsideZone = (price: number, zone?: PriceZone | null): boolean => {
  if (!zone) return false;
  return price >= zone.low && price <= zone.high;
};

const isNearLevel = (
  price: number,
  level?: number | null,
  thresholdPct = 1.2,
): boolean => {
  if (!level) return false;
  return Math.abs(((price - level) / level) * 100) <= thresholdPct;
};

export const calculateEMA = (values: number[], period: number): number[] => {
  if (!values.length) return [];
  const multiplier = 2 / (period + 1);
  const emaValues: number[] = [];
  let ema = values[0];

  for (let i = 0; i < values.length; i += 1) {
    if (i === 0) {
      ema = values[i];
    } else {
      ema = values[i] * multiplier + ema * (1 - multiplier);
    }
    emaValues.push(ema);
  }

  return emaValues;
};

export const calculateRSI = (values: number[], period = 14): number[] => {
  if (values.length <= period) {
    return values.map(() => 50);
  }

  const rsi: number[] = new Array(values.length).fill(50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
};

export const calculateMACDHistogram = (
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number[] => {
  if (values.length < slowPeriod) {
    return values.map(() => 0);
  }

  const emaFast = calculateEMA(values, fastPeriod);
  const emaSlow = calculateEMA(values, slowPeriod);
  const macdLine = values.map((_, index) => emaFast[index] - emaSlow[index]);
  const signalLine = calculateEMA(macdLine, signalPeriod);

  return macdLine.map((value, index) => value - signalLine[index]);
};

export const getScoreBand = (scoreInput: number): ScoreBand => {
  const score = clampScore(scoreInput);

  if (score <= 34) {
    return {
      key: "weak",
      label: "Zayıf yapı",
      rangeLabel: "0–34",
      tone: "bearish",
      description: "Trend ve yapı yeni pozisyon için zayıf.",
    };
  }

  if (score <= 49) {
    return {
      key: "watchlist",
      label: "İzlenebilir ama zayıf",
      rangeLabel: "35–49",
      tone: "cautious",
      description: "Takip edilebilir ama teyit eksik.",
    };
  }

  if (score <= 64) {
    return {
      key: "developing",
      label: "Gelişen setup",
      rangeLabel: "50–64",
      tone: "neutral",
      description: "Yapı kuruluyor ama henüz tam olgun değil.",
    };
  }

  if (score <= 79) {
    return {
      key: "strong",
      label: "Güçlü takip",
      rangeLabel: "65–79",
      tone: "bullish",
      description: "Kurulum güçlü, seviyeler kritik.",
    };
  }

  return {
    key: "very_strong",
    label: "Çok güçlü setup",
    rangeLabel: "80–100",
    tone: "bullish",
    description: "Trend ve yapı güçlü; yine de seviyesiz işlem yapılmaz.",
  };
};

export const detectMarketState = (
  snapshot: CoinTechnicalSnapshot,
): MarketState => {
  const { currentPrice, ema20, ema50, ema200 } = snapshot;

  const emaStackBullish = ema20 > ema50 && ema50 > ema200;
  const emaStackBearish = ema20 < ema50 && ema50 < ema200;

  const priceAbove20 = currentPrice > ema20;
  const priceAbove50 = currentPrice > ema50;
  const priceAbove200 = currentPrice > ema200;

  if (emaStackBullish && priceAbove20 && priceAbove50 && priceAbove200) {
    return "trend_up";
  }

  if (emaStackBearish && !priceAbove20 && !priceAbove50 && !priceAbove200) {
    return "trend_down";
  }

  const distance20 = Math.abs(pctFrom(currentPrice, ema20));
  const distance50 = Math.abs(pctFrom(currentPrice, ema50));

  if (distance20 < 1.8 && distance50 < 2.4) {
    return "range";
  }

  return "transition";
};

const toneByState = (state: MarketState): DecisionTone => {
  switch (state) {
    case "trend_up":
      return "bullish";
    case "trend_down":
      return "bearish";
    case "range":
      return "neutral";
    default:
      return "cautious";
  }
};

const buildHeadline = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
  scoreBand: ScoreBand,
): string => {
  const { currentPrice, breakoutLevel, resistanceZone, supportZone } = snapshot;

  const nearBreakout = isNearLevel(currentPrice, breakoutLevel, 1.2);
  const insideResistance = isInsideZone(currentPrice, resistanceZone);
  const insideSupport = isInsideZone(currentPrice, supportZone);

  if (state === "trend_up" && (insideResistance || nearBreakout)) {
    return "Trend yukarı ama direnç altında; yeni giriş için breakout teyidi veya sağlıklı pullback daha mantıklı.";
  }

  if (state === "trend_up" && insideSupport) {
    return "Trend yukarı ve fiyat destek bölgesine yakın; kontrol kaybolmadıkça pullback senaryosu izlenebilir.";
  }

  if (state === "range") {
    return "Yapı yatay; net yön oluşmadan agresif pozisyon kalitesi düşük.";
  }

  if (state === "trend_down") {
    return "Ana yapı zayıf; long tarafında acele giriş yerine bozulmanın durması beklenmeli.";
  }

  return `${scoreBand.label}; fiyat kritik seviyeler arasında, teyitsiz kovalamak doğru değil.`;
};

const buildNewPositionDecision = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
  scoreBand: ScoreBand,
): StructuredDecision => {
  const { currentPrice, breakoutLevel, supportZone, resistanceZone } = snapshot;

  const insideResistance = isInsideZone(currentPrice, resistanceZone);
  const insideSupport = isInsideZone(currentPrice, supportZone);
  const nearBreakout = isNearLevel(currentPrice, breakoutLevel, 1.2);

  if (state === "trend_up" && insideSupport && scoreBand.key !== "weak") {
    return {
      title: "Yeni pozisyon",
      verdict: "Pullback beklenmeli",
      description:
        "Trend korunuyor. Destek bölgesine yakın kontrollü giriş, tepe kovalamaktan daha sağlıklı.",
      tone: "bullish",
    };
  }

  if (state === "trend_up" && (insideResistance || nearBreakout)) {
    return {
      title: "Yeni pozisyon",
      verdict: "Breakout teyidi beklenmeli",
      description:
        "Direnç altında erken giriş yerine, seviye üstünde kabul görmek daha temiz senaryo üretir.",
      tone: "cautious",
    };
  }

  if (state === "trend_up" && scoreBand.key === "very_strong") {
    return {
      title: "Yeni pozisyon",
      verdict: "Alınabilir",
      description:
        "Trend güçlü. Yine de girişin bozulma seviyesi net tanımlanmalı; kör alım yapılmamalı.",
      tone: "bullish",
    };
  }

  if (state === "range") {
    return {
      title: "Yeni pozisyon",
      verdict: "Yeni pozisyon zayıf",
      description:
        "Yön net değil. Range içinde rastgele giriş yerine sınır seviyeleri beklemek daha mantıklı.",
      tone: "cautious",
    };
  }

  if (state === "trend_down") {
    return {
      title: "Yeni pozisyon",
      verdict: "Uzak durulmalı",
      description:
        "Ana yapı aşağı yönlü. Long giriş için henüz yeterli teknik zemin yok.",
      tone: "bearish",
    };
  }

  return {
    title: "Yeni pozisyon",
    verdict: "Breakout teyidi beklenmeli",
    description:
      "Yapı geçiş bölgesinde. Netleşmemiş harekete değil, teyide işlem açmak daha doğru.",
    tone: toneByState(state),
  };
};

const buildExistingPositionDecision = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
  scoreBand: ScoreBand,
): StructuredDecision => {
  const { currentPrice, ema20, supportZone, resistanceZone } = snapshot;

  const belowEma20 = currentPrice < ema20;
  const insideResistance = isInsideZone(currentPrice, resistanceZone);
  const insideSupport = isInsideZone(currentPrice, supportZone);

  if (state === "trend_up" && !belowEma20 && !insideResistance) {
    return {
      title: "Elde varsa",
      verdict: "Tutulur",
      description:
        "Trend yapısı korunuyor. Pozisyon tutulabilir ama bozulma seviyesi aşağıda net olmalı.",
      tone: "bullish",
    };
  }

  if (state === "trend_up" && insideResistance) {
    return {
      title: "Elde varsa",
      verdict: "Kâr korunur",
      description:
        "Direnç bölgesinde momentum zayıflarsa kârın bir kısmını korumak daha doğru olabilir.",
      tone: "cautious",
    };
  }

  if (belowEma20 || state === "transition") {
    return {
      title: "Elde varsa",
      verdict: "Risk azaltılır",
      description:
        "Yapı gevşiyor. Tam ters dönüş olmadan agresif ekleme yerine risk kontrolü öne çıkar.",
      tone: "cautious",
    };
  }

  if (state === "trend_down" || scoreBand.key === "weak") {
    return {
      title: "Elde varsa",
      verdict: "Agresif ekleme yapılmaz",
      description:
        "Aşağı yapı içinde ortalama düşürme veya ekleme kaliteyi bozabilir.",
      tone: "bearish",
    };
  }

  if (insideSupport) {
    return {
      title: "Elde varsa",
      verdict: "Tutulur",
      description:
        "Destek bölgesi çalıştığı sürece elde tutma senaryosu masada kalır.",
      tone: "neutral",
    };
  }

  return {
    title: "Elde varsa",
    verdict: "Kâr korunur",
    description: "Yapı tamamen bozulmuş değil ama takip gevşememeli.",
    tone: "neutral",
  };
};

const buildShortDecision = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
): StructuredDecision => {
  const { currentPrice, resistanceZone, breakdownLevel } = snapshot;

  const insideResistance = isInsideZone(currentPrice, resistanceZone);
  const nearBreakdown = isNearLevel(currentPrice, breakdownLevel, 1.2);

  if (state === "trend_up") {
    return {
      title: "Short tarafı",
      verdict: "Short uygun değil",
      description:
        "Ana akış yukarı. Karşı-trend short ancak istisnai ve çok agresif bir senaryo olur.",
      tone: "bullish",
    };
  }

  if (state === "range" && insideResistance) {
    return {
      title: "Short tarafı",
      verdict: "Short izlenebilir",
      description:
        "Yatay yapı dirençte reddedilirse kısa vadeli short senaryosu takip edilebilir.",
      tone: "neutral",
    };
  }

  if (state === "transition" && nearBreakdown) {
    return {
      title: "Short tarafı",
      verdict: "Short yalnız agresif senaryo",
      description:
        "Bozulma seviyesi test ediliyor. Net kayıp olmadan short tarafı erken kalır.",
      tone: "cautious",
    };
  }

  if (state === "trend_down") {
    return {
      title: "Short tarafı",
      verdict: "Short izlenebilir",
      description:
        "Aşağı yönlü yapı short tarafını teknik olarak daha anlamlı hale getiriyor.",
      tone: "bearish",
    };
  }

  return {
    title: "Short tarafı",
    verdict: "Short yalnız agresif senaryo",
    description:
      "Net aşağı teyit yok. Erken short yerine seviye kaybı beklenmeli.",
    tone: "cautious",
  };
};

const buildLevels = (snapshot: CoinTechnicalSnapshot): StructuredLevels => {
  const confirmAbove =
    snapshot.breakoutLevel ??
    snapshot.resistanceZone?.high ??
    zoneMid(snapshot.resistanceZone) ??
    null;

  const invalidationBelow =
    snapshot.breakdownLevel ??
    snapshot.supportZone?.low ??
    zoneMid(snapshot.supportZone) ??
    null;

  return {
    confirmAbove,
    invalidationBelow,
    nearestSupport: snapshot.supportZone ?? null,
    nearestResistance: snapshot.resistanceZone ?? null,
  };
};

const buildDrivers = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
): string[] => {
  const drivers: string[] = [];
  const {
    currentPrice,
    ema20,
    ema50,
    ema200,
    relativeVolume,
    rsi,
    resistanceZone,
    supportZone,
  } = snapshot;

  const emaStackBullish = ema20 > ema50 && ema50 > ema200;
  const emaStackBearish = ema20 < ema50 && ema50 < ema200;
  const above20 = currentPrice > ema20;
  const above50 = currentPrice > ema50;
  const above200 = currentPrice > ema200;

  if (emaStackBullish && above20 && above50 && above200) {
    drivers.push(
      "EMA 20/50/200 dizilimi yukarı yönlü ve fiyat bu ortalamaların üstünde.",
    );
  } else if (emaStackBearish && !above20 && !above50 && !above200) {
    drivers.push(
      "EMA dizilimi aşağı yönlü; fiyat ana ortalamaların altında kalıyor.",
    );
  } else {
    drivers.push(
      "Fiyat ve EMA yapısı karışık; yön var ama henüz tam temiz değil.",
    );
  }

  if (typeof relativeVolume === "number") {
    if (relativeVolume >= 1.2) {
      drivers.push(
        "Hacim ortalamanın üstünde; hareketin taşıyıcılığı zayıf değil.",
      );
    } else if (relativeVolume <= 0.85) {
      drivers.push("Hacim düşük; hareket var ama taşıma kalitesi sınırlı.");
    }
  }

  if (typeof rsi === "number") {
    if (rsi >= 58 && rsi <= 72 && state !== "trend_down") {
      drivers.push(
        "Momentum pozitif bölgede; aşırı taşma seviyesine tam girmeden güçlü duruyor.",
      );
    } else if (rsi < 45) {
      drivers.push("Momentum zayıf; yukarı tepkinin kalıcılığı sorgulanmalı.");
    }
  }

  if (isInsideZone(currentPrice, supportZone)) {
    drivers.push(
      "Fiyat destek bölgesine yakın; savunma gelirse pullback senaryosu güçlenir.",
    );
  }

  if (isInsideZone(currentPrice, resistanceZone)) {
    drivers.push(
      "Fiyat direnç bölgesinde; bu alanın aşılması hareket kalitesini artırır.",
    );
  }

  return drivers.slice(0, 3);
};

const buildRisks = (
  snapshot: CoinTechnicalSnapshot,
  state: MarketState,
): string[] => {
  const risks: string[] = [];
  const {
    currentPrice,
    ema20,
    relativeVolume,
    resistanceZone,
    supportZone,
    rsi,
  } = snapshot;

  if (isInsideZone(currentPrice, resistanceZone)) {
    risks.push(
      "Direnç bölgesinde satış baskısı gelirse yukarı deneme sönümlenebilir.",
    );
  }

  if (currentPrice < ema20) {
    risks.push(
      "Fiyat EMA20 altında; kısa vadeli momentum zayıflaması başladı.",
    );
  }

  if (typeof relativeVolume === "number" && relativeVolume < 0.9) {
    risks.push("Düşük hacim, kırılım denemelerini sahte harekete çevirebilir.");
  }

  if (state === "range") {
    risks.push(
      "Yatay yapı, net yön oluşmadan iki tarafı da hataya zorlayabilir.",
    );
  }

  if (isInsideZone(currentPrice, supportZone) && state === "trend_down") {
    risks.push("Destek bölgesi altında kabul gelirse bozulma hızlanabilir.");
  }

  if (typeof rsi === "number" && rsi > 74) {
    risks.push(
      "Momentum aşırı ısınmış; devam gelse bile düzeltme riski artıyor.",
    );
  }

  return risks.slice(0, 3);
};

export const buildStructuredAnalysis = (
  snapshot: CoinTechnicalSnapshot,
): StructuredAnalysisView => {
  const score = clampScore(snapshot.score);
  const scoreBand = getScoreBand(score);
  const marketState = detectMarketState(snapshot);

  const priceVsEma20Pct = pctFrom(snapshot.currentPrice, snapshot.ema20);
  const priceVsEma50Pct = pctFrom(snapshot.currentPrice, snapshot.ema50);
  const priceVsEma200Pct = pctFrom(snapshot.currentPrice, snapshot.ema200);

  return {
    symbol: snapshot.symbol,
    timeframe: snapshot.timeframe,
    score,
    scoreBand,
    marketState,
    headline: buildHeadline(snapshot, marketState, scoreBand),

    newPosition: buildNewPositionDecision(snapshot, marketState, scoreBand),
    existingPosition: buildExistingPositionDecision(
      snapshot,
      marketState,
      scoreBand,
    ),
    shortPlan: buildShortDecision(snapshot, marketState),

    levels: buildLevels(snapshot),

    drivers: buildDrivers(snapshot, marketState),
    risks: buildRisks(snapshot, marketState),

    meta: {
      price: snapshot.currentPrice,
      priceVsEma20Pct,
      priceVsEma50Pct,
      priceVsEma200Pct,
      emaStackBullish:
        snapshot.ema20 > snapshot.ema50 && snapshot.ema50 > snapshot.ema200,
      emaStackBearish:
        snapshot.ema20 < snapshot.ema50 && snapshot.ema50 < snapshot.ema200,
      relativeVolume: snapshot.relativeVolume ?? null,
      rsi: snapshot.rsi ?? null,
    },
  };
};

const calculateZone = (
  candles: Candle[],
  mode: "support" | "resistance",
  windowSize: number,
): PriceZone | null => {
  if (candles.length < windowSize) return null;
  const slice = candles.slice(-windowSize);

  if (mode === "support") {
    const lows = slice.map((item) => item.low);
    const sorted = [...lows].sort((a, b) => a - b);
    const base = sorted.slice(0, Math.max(2, Math.floor(sorted.length * 0.2)));
    return {
      low: Math.min(...base),
      high: Math.max(...base),
    };
  }

  const highs = slice.map((item) => item.high);
  const sorted = [...highs].sort((a, b) => b - a);
  const base = sorted.slice(0, Math.max(2, Math.floor(sorted.length * 0.2)));
  return {
    low: Math.min(...base),
    high: Math.max(...base),
  };
};

const scoreByStructure = ({
  currentPrice,
  ema20,
  ema50,
  ema200,
  relativeVolume,
  rsi,
  breakoutLevel,
  breakdownLevel,
  supportZone,
  resistanceZone,
}: {
  currentPrice: number;
  ema20: number;
  ema50: number;
  ema200: number;
  relativeVolume: number | null;
  rsi: number | null;
  breakoutLevel: number | null;
  breakdownLevel: number | null;
  supportZone: PriceZone | null;
  resistanceZone: PriceZone | null;
}): number => {
  let score = 0;

  const emaStackBullish = ema20 > ema50 && ema50 > ema200;
  const emaStackBearish = ema20 < ema50 && ema50 < ema200;

  if (emaStackBullish) score += 25;
  if (!emaStackBearish && currentPrice > ema50) score += 10;
  if (currentPrice > ema20) score += 10;
  if (currentPrice > ema50) score += 10;
  if (currentPrice > ema200) score += 10;

  if (relativeVolume != null) {
    if (relativeVolume >= 1.4) score += 10;
    else if (relativeVolume >= 1.1) score += 6;
    else if (relativeVolume < 0.85) score -= 8;
  }

  if (rsi != null) {
    if (rsi >= 55 && rsi <= 70) score += 12;
    else if (rsi >= 50 && rsi < 55) score += 6;
    else if (rsi < 42) score -= 10;
    else if (rsi > 75) score -= 4;
  }

  if (supportZone && isInsideZone(currentPrice, supportZone)) {
    score += 6;
  }

  if (resistanceZone && isInsideZone(currentPrice, resistanceZone)) {
    score -= 4;
  }

  if (breakoutLevel && currentPrice > breakoutLevel) {
    score += 8;
  }

  if (breakdownLevel && currentPrice < breakdownLevel) {
    score -= 12;
  }

  return clampScore(score);
};

export const buildSnapshotFromCandles = (
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
): CoinTechnicalSnapshot => {
  if (candles.length < 220) {
    throw new Error(`${symbol} için yeterli candle yok.`);
  }

  const closes = candles.map((item) => item.close);
  const volumes = candles.map((item) => item.volume);

  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const ema200Series = calculateEMA(closes, 200);
  const rsiSeries = calculateRSI(closes, 14);
  const macdHistogramSeries = calculateMACDHistogram(closes);

  const currentPrice = closes[closes.length - 1];
  const ema20 = ema20Series[ema20Series.length - 1];
  const ema50 = ema50Series[ema50Series.length - 1];
  const ema200 = ema200Series[ema200Series.length - 1];
  const rsi = rsiSeries[rsiSeries.length - 1] ?? null;
  const macdHistogram =
    macdHistogramSeries[macdHistogramSeries.length - 1] ?? null;

  const recentVolume = volumes[volumes.length - 1];
  const averagePrevVolume = average(volumes.slice(-21, -1));
  const relativeVolume =
    averagePrevVolume > 0 ? recentVolume / averagePrevVolume : null;

  const supportZone = calculateZone(candles, "support", 40);
  const resistanceZone = calculateZone(candles, "resistance", 40);

  const breakoutLevel = resistanceZone?.high ?? null;
  const breakdownLevel = supportZone?.low ?? null;

  const score = scoreByStructure({
    currentPrice,
    ema20,
    ema50,
    ema200,
    relativeVolume,
    rsi,
    breakoutLevel,
    breakdownLevel,
    supportZone,
    resistanceZone,
  });

  const lastCandle = candles[candles.length - 1];
  const lastTime = lastCandle?.time ?? 0;
  const target24hAgoTime = lastTime - 24 * 60 * 60;

  const candle24hAgo =
    [...candles].reverse().find((item) => item.time <= target24hAgoTime) ??
    candles[0];

  const base24hPrice = candle24hAgo?.close ?? null;

  const changePercent24h =
    base24hPrice != null && base24hPrice > 0
      ? ((currentPrice - base24hPrice) / base24hPrice) * 100
      : null;

  return {
    symbol,
    timeframe,
    currentPrice,
    score,

    ema20,
    ema50,
    ema200,

    supportZone,
    resistanceZone,

    breakoutLevel,
    breakdownLevel,

    relativeVolume,
    rsi,
    macdHistogram,
    changePercent24h,

    hasBullishBreakout:
      breakoutLevel != null ? currentPrice > breakoutLevel : false,
    hasBearishBreakdown:
      breakdownLevel != null ? currentPrice < breakdownLevel : false,
  };
};

export type {
  Candle,
  CoinTechnicalSnapshot,
  StructuredAnalysisView,
} from "../../shared/src";
