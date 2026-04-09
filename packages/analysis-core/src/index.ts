import type {
  AnalysisReport,
  Candle,
  LinePoint,
  NewsState,
  Signal,
  Timeframe,
  Trend,
  TradePlan,
  VolumeState,
  Zone,
} from "@crypto-analyzer/shared";

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateEMA(candles: Candle[], period: number): LinePoint[] {
  if (candles.length < period) return [];

  const multiplier = 2 / (period + 1);
  const closes = candles.map((c) => c.close);
  const result: LinePoint[] = [];

  const firstSlice = closes.slice(0, period);
  const sma = firstSlice.reduce((sum, value) => sum + value, 0) / period;

  let prevEma = sma;

  result.push({
    time: candles[period - 1].time,
    value: round(prevEma),
  });

  for (let i = period; i < candles.length; i++) {
    const ema = closes[i] * multiplier + prevEma * (1 - multiplier);
    result.push({
      time: candles[i].time,
      value: round(ema),
    });
    prevEma = ema;
  }

  return result;
}

function countRecentStructure(candles: Candle[], lookback = 8) {
  const slice = candles.slice(-lookback);
  let bullish = 0;
  let bearish = 0;

  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1];
    const current = slice[i];

    if (current.high > prev.high && current.low > prev.low) bullish++;
    if (current.high < prev.high && current.low < prev.low) bearish++;
  }

  return { bullish, bearish };
}

function detectTrend(
  candles: Candle[],
  ema20: LinePoint[],
  ema50: LinePoint[],
  ema200: LinePoint[],
): Trend {
  if (!candles.length || !ema20.length || !ema50.length || !ema200.length) {
    return "range";
  }

  const lastClosed = candles[candles.length - 2] ?? candles[candles.length - 1];
  const lastClose = lastClosed.close;

  const lastEma20 = ema20[ema20.length - 1].value;
  const lastEma50 = ema50[ema50.length - 1].value;
  const lastEma200 = ema200[ema200.length - 1].value;

  const { bullish, bearish } = countRecentStructure(candles, 8);

  const bullishAlignment =
    lastClose > lastEma20 && lastEma20 > lastEma50 && lastEma50 > lastEma200;

  const bearishAlignment =
    lastClose < lastEma20 && lastEma20 < lastEma50 && lastEma50 < lastEma200;

  if (bullishAlignment && bullish >= 4) return "uptrend";
  if (bearishAlignment && bearish >= 4) return "downtrend";

  return "range";
}

function percentageDistance(value: number, zoneCenter: number): number {
  return Math.abs((value - zoneCenter) / zoneCenter) * 100;
}

function findPivotLows(candles: Candle[]) {
  const pivots: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    if (curr.low < prev.low && curr.low < next.low) {
      pivots.push(curr.low);
    }
  }

  return pivots;
}

function findPivotHighs(candles: Candle[]) {
  const pivots: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    if (curr.high > prev.high && curr.high > next.high) {
      pivots.push(curr.high);
    }
  }

  return pivots;
}

function clusterLevels(levels: number[], tolerance = 0.5): Zone[] {
  const clusters: Zone[] = [];

  for (const level of levels) {
    let matched = false;

    for (const cluster of clusters) {
      const center = (cluster.low + cluster.high) / 2;
      const distance = Math.abs((level - center) / center) * 100;

      if (distance < tolerance) {
        cluster.low = Math.min(cluster.low, level);
        cluster.high = Math.max(cluster.high, level);
        cluster.touches += 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({
        low: level,
        high: level,
        touches: 1,
      });
    }
  }

  return clusters
    .filter((c) => c.touches >= 2)
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 3)
    .map((c) => ({
      low: round(c.low),
      high: round(c.high),
      touches: c.touches,
    }));
}

function buildSupportZones(candles: Candle[]): Zone[] {
  return clusterLevels(findPivotLows(candles), 0.6);
}

function buildResistanceZones(candles: Candle[]): Zone[] {
  return clusterLevels(findPivotHighs(candles), 0.6);
}

function getLastClosedCandle(candles: Candle[]): Candle | null {
  if (candles.length < 2) return candles[0] ?? null;
  return candles[candles.length - 2];
}

function getAverageClosedVolume(candles: Candle[], period = 20): number {
  if (candles.length < period + 2) {
    const fallback = candles.slice(0, -1);
    if (!fallback.length) return 0;
    return fallback.reduce((sum, c) => sum + c.volume, 0) / fallback.length;
  }

  const closedCandles = candles.slice(0, -1);
  const reference = closedCandles.slice(-(period + 1), -1);

  if (!reference.length) return 0;

  const total = reference.reduce((sum, candle) => sum + candle.volume, 0);
  return total / reference.length;
}

function getAverageClosedRange(candles: Candle[], period = 20): number {
  const closedCandles = candles.slice(0, -1);
  const reference = closedCandles.slice(-period);

  if (!reference.length) return 0;

  const total = reference.reduce((sum, candle) => {
    return sum + (candle.high - candle.low);
  }, 0);

  return total / reference.length;
}

function getBodyRatio(candle: Candle): number {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  if (range <= 0) return 0;
  return body / range;
}

function getClosePositionInRange(candle: Candle): number {
  const range = candle.high - candle.low;
  if (range <= 0) return 0.5;
  return (candle.close - candle.low) / range;
}

function getUpperWickRatio(candle: Candle): number {
  const bodyTop = Math.max(candle.open, candle.close);
  const wick = candle.high - bodyTop;
  const range = candle.high - candle.low;

  if (range <= 0) return 0;
  return wick / range;
}

function getLowerWickRatio(candle: Candle): number {
  const bodyBottom = Math.min(candle.open, candle.close);
  const wick = bodyBottom - candle.low;
  const range = candle.high - candle.low;

  if (range <= 0) return 0;
  return wick / range;
}

function hasVolumeConfirmation(candles: Candle[], multiplier = 1.08): boolean {
  const lastClosed = getLastClosedCandle(candles);
  if (!lastClosed) return false;

  const avgVolume = getAverageClosedVolume(candles, 20);
  if (avgVolume <= 0) return false;

  return lastClosed.volume >= avgVolume * multiplier;
}

function classifyVolumeState(candles: Candle[]): {
  state: VolumeState;
  ratio: number;
  comment: string;
} {
  const lastClosed = getLastClosedCandle(candles);
  const avgVolume = getAverageClosedVolume(candles, 20);

  if (!lastClosed || avgVolume <= 0) {
    return {
      state: "normal",
      ratio: 1,
      comment: "Hacim değerlendirmesi için veri sınırlı.",
    };
  }

  const ratio = lastClosed.volume / avgVolume;

  if (ratio >= 1.2) {
    return {
      state: "strong",
      ratio,
      comment:
        "Son kapanan mumda hacim ortalamanın belirgin üstünde. Piyasada dikkat çekici katılım var.",
    };
  }

  if (ratio <= 0.9) {
    return {
      state: "weak",
      ratio,
      comment:
        "Son kapanan mumda hacim zayıf. Hareket var ama güçlü katılım teyidi henüz yok.",
    };
  }

  return {
    state: "normal",
    ratio,
    comment:
      "Hacim ortalamaya yakın. Piyasada hareket var ama aşırı bir patlama görünmüyor.",
  };
}

function detectAggressiveOrderFlow(candles: Candle[]): string {
  const lastClosed = getLastClosedCandle(candles);
  if (!lastClosed) {
    return "Son kapanan mum üzerinden net order flow yorumu üretilemedi.";
  }

  const avgRange = getAverageClosedRange(candles, 20);
  const avgVolume = getAverageClosedVolume(candles, 20);
  const bodyRatio = getBodyRatio(lastClosed);
  const closePosition = getClosePositionInRange(lastClosed);
  const candleRange = lastClosed.high - lastClosed.low;
  const rangeRatio = avgRange > 0 ? candleRange / avgRange : 1;
  const volumeRatio = avgVolume > 0 ? lastClosed.volume / avgVolume : 1;

  const bullishImpulse =
    lastClosed.close > lastClosed.open &&
    bodyRatio >= 0.55 &&
    closePosition >= 0.7 &&
    (volumeRatio >= 1.1 || rangeRatio >= 1.2);

  const bearishImpulse =
    lastClosed.close < lastClosed.open &&
    bodyRatio >= 0.55 &&
    closePosition <= 0.3 &&
    (volumeRatio >= 1.1 || rangeRatio >= 1.2);

  if (bullishImpulse) {
    return "Son kapanan mum alıcı baskısına işaret ediyor. Mum gövdesi güçlü ve kapanış üst banda yakın.";
  }

  if (bearishImpulse) {
    return "Son kapanan mum satıcı baskısına işaret ediyor. Mum gövdesi güçlü ve kapanış alt banda yakın.";
  }

  if (bodyRatio < 0.3) {
    return "Son kapanan mum kararsız. Gövde zayıf, piyasa yön konusunda net değil.";
  }

  return "Son kapanan mumda belirgin ama tek taraflı olmayan bir akış var. Ek teyit görmek daha sağlıklı.";
}

function hasBullishRejection(candles: Candle[], supportZones: Zone[]): boolean {
  if (!supportZones.length) return false;

  const lastClosed = getLastClosedCandle(candles);
  if (!lastClosed) return false;

  const support = supportZones[0];
  const supportCenter = (support.low + support.high) / 2;
  const distance = percentageDistance(lastClosed.close, supportCenter);
  const lowerWickRatio = getLowerWickRatio(lastClosed);

  return (
    distance <= 1.5 &&
    lowerWickRatio >= 0.35 &&
    lastClosed.close > lastClosed.open
  );
}

function hasBearishRejection(
  candles: Candle[],
  resistanceZones: Zone[],
): boolean {
  if (!resistanceZones.length) return false;

  const lastClosed = getLastClosedCandle(candles);
  if (!lastClosed) return false;

  const resistance = resistanceZones[0];
  const resistanceCenter = (resistance.low + resistance.high) / 2;
  const distance = percentageDistance(lastClosed.close, resistanceCenter);
  const upperWickRatio = getUpperWickRatio(lastClosed);

  return (
    distance <= 1.5 &&
    upperWickRatio >= 0.35 &&
    lastClosed.close < lastClosed.open
  );
}

function detectBreakout(candles: Candle[], resistanceZones: Zone[]): boolean {
  if (candles.length < 3 || !resistanceZones.length) return false;

  const lastClosed = candles[candles.length - 2];
  const prevClosed = candles[candles.length - 3];
  const zone = resistanceZones[0];
  const resistanceTop = zone.high;

  return prevClosed.close < resistanceTop && lastClosed.close > resistanceTop;
}

function detectFakeBreakout(
  candles: Candle[],
  resistanceZones: Zone[],
): boolean {
  if (candles.length < 2 || !resistanceZones.length) return false;

  const lastClosed = getLastClosedCandle(candles);
  if (!lastClosed) return false;

  const zone = resistanceZones[0];
  const resistanceTop = zone.high;
  const upperWickRatio = getUpperWickRatio(lastClosed);

  return (
    lastClosed.high > resistanceTop &&
    lastClosed.close < resistanceTop &&
    upperWickRatio >= 0.35
  );
}

function detectBreakdown(candles: Candle[], supportZones: Zone[]): boolean {
  if (candles.length < 3 || !supportZones.length) return false;

  const lastClosed = candles[candles.length - 2];
  const prevClosed = candles[candles.length - 3];
  const zone = supportZones[0];
  const supportBottom = zone.low;

  return prevClosed.close > supportBottom && lastClosed.close < supportBottom;
}

function detectSignal(
  candles: Candle[],
  trend: Trend,
  lastClose: number,
  supportZones: Zone[],
  resistanceZones: Zone[],
): { signal: Signal; score: number; reasons: string[] } {
  const reasons: string[] = [];

  const support = supportZones[0];
  const resistance = resistanceZones[0];

  const breakout = detectBreakout(candles, resistanceZones);
  const fakeBreakout = detectFakeBreakout(candles, resistanceZones);
  const breakdown = detectBreakdown(candles, supportZones);
  const volumeConfirmed = hasVolumeConfirmation(candles, 1.08);
  const bullishRejection = hasBullishRejection(candles, supportZones);
  const bearishRejection = hasBearishRejection(candles, resistanceZones);

  let supportDistance = Number.POSITIVE_INFINITY;
  let resistanceDistance = Number.POSITIVE_INFINITY;

  if (support) {
    const supportCenter = (support.low + support.high) / 2;
    supportDistance = percentageDistance(lastClose, supportCenter);
  }

  if (resistance) {
    const resistanceCenter = (resistance.low + resistance.high) / 2;
    resistanceDistance = percentageDistance(lastClose, resistanceCenter);
  }

  const isNearSupport = supportDistance <= 1.5;
  const isSupportInReach = supportDistance > 1.5 && supportDistance <= 3;
  const isNearResistance = resistanceDistance <= 1.5;

  let score = 50;

  if (trend === "uptrend") {
    score += 15;
    reasons.push("uptrend_structure");
  }

  if (trend === "downtrend") {
    score -= 22;
    reasons.push("downtrend_structure");
  }

  if (isNearSupport) {
    score += 14;
    reasons.push("near_support_zone");
  } else if (isSupportInReach) {
    score += 6;
    reasons.push("support_zone_in_reach");
  }

  if (isNearResistance) {
    score -= 12;
    reasons.push("close_to_resistance");
  }

  if (bullishRejection) {
    score += 14;
    reasons.push("bullish_wick_rejection");
  }

  if (bearishRejection) {
    score -= 14;
    reasons.push("bearish_wick_rejection");
  }

  if (breakout) {
    score += 16;
    reasons.push("resistance_breakout");

    if (volumeConfirmed) {
      score += 10;
      reasons.push("volume_confirmation");
    } else {
      score -= 4;
      reasons.push("volume_not_confirmed");
    }
  }

  if (fakeBreakout) {
    score -= 24;
    reasons.push("fake_breakout_risk");
  }

  if (breakdown) {
    score -= 24;
    reasons.push("support_breakdown");
  }

  if (trend === "range") {
    if (breakout && volumeConfirmed && !fakeBreakout) {
      score += 4;
    }

    if (bullishRejection && isNearSupport) {
      score += 4;
    }
  }

  score = clamp(score, 0, 100);

  let signal: Signal = "no_trade";

  const breakoutCandidate =
    breakout &&
    volumeConfirmed &&
    !fakeBreakout &&
    !breakdown &&
    score >= 68 &&
    trend !== "downtrend";

  const pullbackCandidate =
    trend === "uptrend" &&
    isNearSupport &&
    bullishRejection &&
    !breakdown &&
    !fakeBreakout &&
    score >= 65;

  const possibleBuyCandidate =
    trend === "uptrend" &&
    score >= 56 &&
    !isNearResistance &&
    !breakdown &&
    !fakeBreakout;

  if (pullbackCandidate) {
    signal = "pullback_entry";
  } else if (breakoutCandidate) {
    signal = "breakout_watch";
  } else if (possibleBuyCandidate) {
    signal = "possible_buy_zone";
  } else {
    signal = "no_trade";
  }

  return {
    signal,
    score,
    reasons,
  };
}

function buildSummary(
  trend: Trend,
  signal: Signal,
  supportZones: Zone[],
  resistanceZones: Zone[],
  reasons: string[],
): string {
  const support = supportZones[0];
  const resistance = resistanceZones[0];

  const hasVolume = reasons.includes("volume_confirmation");
  const hasFakeBreakout = reasons.includes("fake_breakout_risk");
  const hasBullishRejectionReason = reasons.includes("bullish_wick_rejection");
  const hasNearResistance = reasons.includes("close_to_resistance");
  const hasBreakdown = reasons.includes("support_breakdown");

  if (hasBreakdown) {
    return "Destek kırılımı görüldü ya da kırılım riski belirgin. Long taraf acele edilmemeli.";
  }

  if (trend === "uptrend" && signal === "pullback_entry") {
    return "Ana trend yukarı. Fiyat destek bölgesine yakın ve mum tepkisi alıcı lehine. Kontrollü pullback senaryosu oluşuyor.";
  }

  if (trend === "uptrend" && signal === "breakout_watch") {
    if (hasFakeBreakout) {
      return "Direnç üstü deneme var ama sahte kırılım riski yüksek. Kapanış ve hacim netleşmeden agresif davranmak hatalı olur.";
    }

    if (hasVolume) {
      return "Direnç kırılımı hacim desteğiyle geliyor. Devam teyidi alınırsa momentum işlemi mantıklı olabilir.";
    }

    return "Direnç kırılımı var ancak devam teyidi zayıf. Özellikle hacim tarafı tekrar izlenmeli.";
  }

  if (trend === "uptrend" && signal === "possible_buy_zone") {
    if (hasNearResistance) {
      return "Yükseliş yapısı sürüyor ama fiyat direnç tarafına da yakın. Kör alım yerine daha iyi konum beklemek daha sağlıklı.";
    }

    return "Yükseliş yapısı korunuyor. Fiyat long taraf için izlenebilir bölgede ama giriş kalitesi pullback_entry kadar güçlü değil.";
  }

  if (trend === "range") {
    return `Piyasa yatay. Destek ${support?.low ?? "-"}-${support?.high ?? "-"} ve direnç ${resistance?.low ?? "-"}-${resistance?.high ?? "-"} arasında sıkışma izleniyor. Net teyit gelmeden acele işlem doğru değil.`;
  }

  if (trend === "downtrend") {
    return "Yapı zayıf ve baskı aşağı yönlü. Ters yönde erken alım yerine trend dönüşünü beklemek daha mantıklı.";
  }

  if (hasBullishRejectionReason) {
    return "Destek bölgesinde tepki var ama genel yapı henüz yeterince güçlü değil.";
  }

  return "Net işlem avantajı oluşmuş değil.";
}

function buildMarketContext(
  trend: Trend,
  supportZones: Zone[],
  resistanceZones: Zone[],
  reasons: string[],
): string {
  const support = supportZones[0];
  const resistance = resistanceZones[0];

  if (trend === "uptrend") {
    if (reasons.includes("close_to_resistance")) {
      return "Trend yukarı ama fiyat kısa vadeli direnç alanına yaklaşmış durumda. Takip edilmeli, kör kovalamaca yapılmamalı.";
    }

    return "Trend yukarı ve yapı bozulmuş görünmüyor. Long taraf tamamen kapanmış değil.";
  }

  if (trend === "downtrend") {
    return "Piyasa aşağı yönlü baskı altında. Long senaryo ancak çok güçlü teyitle düşünülmeli.";
  }

  return `Piyasa sıkışık. Destek ${support?.low ?? "-"}-${support?.high ?? "-"} ve direnç ${resistance?.low ?? "-"}-${resistance?.high ?? "-"} arasında yön seçimi bekleniyor.`;
}

function buildExpertCommentary(params: {
  trend: Trend;
  signal: Signal;
  score: number;
  summary: string;
  orderFlowComment: string;
  volumeComment: string;
  reasons: string[];
}): string {
  const {
    trend,
    signal,
    score,
    summary,
    orderFlowComment,
    volumeComment,
    reasons,
  } = params;

  if (signal === "pullback_entry") {
    return `${summary} ${orderFlowComment} ${volumeComment} Şu an piyasa 'hemen saldır' değil, kontrollü şekilde destekten tepkiyi izleme evresinde.`;
  }

  if (signal === "breakout_watch") {
    return `${summary} ${orderFlowComment} ${volumeComment} Burada asıl mesele kırılımın devam edip etmeyeceği. Hacimsiz kırılım kovalanmamalı.`;
  }

  if (trend === "range" && score >= 45) {
    return `${summary} ${orderFlowComment} ${volumeComment} Yatay piyasalarda erken davranmak çoğu zaman gereksiz maliyet üretir. Önce yön seçimi lazım.`;
  }

  if (reasons.includes("support_breakdown")) {
    return `${summary} ${orderFlowComment} Destek altı baskı görüldüğü için alıcı tarafın güç topladığını söylemek şu aşamada zor.`;
  }

  return `${summary} ${orderFlowComment} ${volumeComment} Şu an piyasa okunabilir ama henüz temiz ve sert bir avantaj üretmiş değil.`;
}

function buildTradePlan(params: {
  trend: Trend;
  signal: Signal;
  supportZones: Zone[];
  resistanceZones: Zone[];
}): TradePlan {
  const { trend, signal, supportZones, resistanceZones } = params;

  const support = supportZones[0];
  const resistance = resistanceZones[0];

  const supportCenter = support
    ? round((support.low + support.high) / 2)
    : null;
  const resistanceTop = resistance ? round(resistance.high) : null;
  const supportBottom = support ? round(support.low) : null;

  if (signal === "pullback_entry") {
    return {
      bias: "long_watch",
      entryHint: support
        ? `${support.low} - ${support.high} bandında alıcı tepkisi yeniden izlenebilir.`
        : "Destek bandı netleşmeden giriş zorlanmamalı.",
      breakoutAbove: resistanceTop,
      breakdownBelow: supportBottom,
      invalidationHint: supportBottom
        ? `${supportBottom} altı kapanış senaryoyu bozar.`
        : "Destek altı kapanışta senaryo zayıflar.",
      takeProfitHint: resistanceTop
        ? `İlk ciddi sınav ${resistanceTop} civarı direnç alanı.`
        : "Yakın direnç alanı ilk kâr alma bölgesi olarak izlenmeli.",
      actionComment:
        "Planlı şekilde izlenebilir. Ama tepki mumu kaybolursa fırsat kalitesi de düşer.",
    };
  }

  if (signal === "breakout_watch") {
    return {
      bias: "long_watch",
      entryHint: resistanceTop
        ? `${resistanceTop} üzeri hacimli kapanış devam ederse momentum tarafı güçlenir.`
        : "Direnç üstü teyit olmadan kırılım kovalanmamalı.",
      breakoutAbove: resistanceTop,
      breakdownBelow: supportBottom,
      invalidationHint: resistanceTop
        ? `${resistanceTop} üstü kalıcılık gelmezse sahte kırılım riski unutulmamalı.`
        : "Kalıcılık gelmezse senaryo zayıflar.",
      takeProfitHint:
        "Kırılım sonrası ilk geri çekilmede eski direnç-yeni destek davranışı izlenmeli.",
      actionComment:
        "Burada amaç erken atlamak değil, teyitli momentum görmek.",
    };
  }

  if (trend === "downtrend") {
    return {
      bias: "short_risk",
      entryHint:
        "Long taraf aceleye uygun değil. Ancak güçlü dönüş yapısı oluşursa tablo yeniden okunur.",
      breakoutAbove: resistanceTop,
      breakdownBelow: supportBottom,
      invalidationHint:
        "Aşağı yönlü baskı net biçimde zayıflamadan agresif alım mantıklı değil.",
      takeProfitHint:
        "Ters yönlü işlem düşünülüyorsa çok daha sert teyit aranmalı.",
      actionComment:
        "Bu aşamada temel yaklaşım beklemek ve zayıf bounce’lara aldanmamak.",
    };
  }

  return {
    bias: "wait",
    entryHint: supportCenter
      ? `${supportCenter} civarı destek davranışı ve direnç üstü teyit birlikte izlenmeli.`
      : "Net destek-direnç davranışı oluşmadan beklemek daha sağlıklı.",
    breakoutAbove: resistanceTop,
    breakdownBelow: supportBottom,
    invalidationHint:
      "Net yön seçimi olmadan pozisyon açmak yerine teyit beklemek daha doğru.",
    takeProfitHint:
      "Yön seçimi sonrası ilk karşıt bölge doğal kâr alma alanı olur.",
    actionComment:
      "Şu an ana aksiyon: izlemek, acele etmemek, teyit gelirse harekete geçmek.",
  };
}

function buildNewsState(): { newsState: NewsState; newsComment: string } {
  return {
    newsState: "not_connected",
    newsComment:
      "Haber akışı henüz sisteme bağlı değil. Bu yorum yalnızca fiyat, yapı ve hacim verisinden üretilmiştir.",
  };
}

export function analyzeCandles(
  symbol: string,
  interval: Timeframe,
  candles: Candle[],
): AnalysisReport {
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);
  const ema200 = calculateEMA(candles, 200);

  const trend = detectTrend(candles, ema20, ema50, ema200);
  const supportZones = buildSupportZones(candles);
  const resistanceZones = buildResistanceZones(candles);

  const lastClosed = getLastClosedCandle(candles);
  const lastClose =
    lastClosed?.close ?? candles[candles.length - 1]?.close ?? 0;

  const { signal, score, reasons } = detectSignal(
    candles,
    trend,
    lastClose,
    supportZones,
    resistanceZones,
  );

  const summary = buildSummary(
    trend,
    signal,
    supportZones,
    resistanceZones,
    reasons,
  );

  const volumeInfo = classifyVolumeState(candles);
  const orderFlowComment = detectAggressiveOrderFlow(candles);
  const marketContext = buildMarketContext(
    trend,
    supportZones,
    resistanceZones,
    reasons,
  );

  const expertCommentary = buildExpertCommentary({
    trend,
    signal,
    score,
    summary,
    orderFlowComment,
    volumeComment: volumeInfo.comment,
    reasons,
  });

  const tradePlan = buildTradePlan({
    trend,
    signal,
    supportZones,
    resistanceZones,
  });

  const { newsState, newsComment } = buildNewsState();

  return {
    symbol,
    interval,
    trend,
    supportZones,
    resistanceZones,
    score,
    signal,
    reasons,
    summary,
    ema20,
    ema50,
    ema200,

    volumeState: volumeInfo.state,
    volumeComment: volumeInfo.comment,
    orderFlowComment,
    marketContext,
    expertCommentary,

    newsState,
    newsComment,

    tradePlan,
  };
}
