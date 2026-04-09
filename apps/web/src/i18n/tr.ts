export const tr = {
  app: {
    title: "Crypto Analyzer",
    subtitle:
      "Coin seç, timeframe değiştir, detaylı teknik değerlendirmeyi izle.",
    chartTitle: "Grafik",
    chartSubtitle: "EMA 20 / 50 / 200 ve destek-direnç bölgeleri",
    loading: "Yükleniyor...",
    error: "Veri alınamadı",
    scannerError: "Tarama verisi alınamadı",
  },

  panel: {
    technicalSummary: "Teknik analiz özeti",
    trend: "Trend",
    signal: "Sinyal",
    score: "Skor",
    support: "Destek",
    resistance: "Direnç",
    summary: "Özet",
    reasons: "Nedenler",
    marketContext: "Piyasa Bağlamı",
    volumeState: "Hacim Durumu",
    volumeComment: "Hacim Yorumu",
    orderFlow: "Alım / Satım İzi",
    expertCommentary: "Usta Yorumu",
    tradePlan: "İşlem Planı",
    entryHint: "Giriş Fikri",
    breakoutAbove: "Üstü Teyit",
    breakdownBelow: "Altı Risk",
    invalidation: "Geçersizlik",
    takeProfit: "Kâr Alma Mantığı",
    action: "Aksiyon",
    news: "Haber Durumu",
    newsComment: "Haber Yorumu",
    notAvailable: "Yok",
  },

  scanner: {
    title: "Tarayıcı",
    subtitle: "Büyük coinlerde hızlı fırsat taraması",
    sortedByScore: "Skora göre sıralı",
    loading: "Tarama verileri yükleniyor...",
    empty: "Tarama verisi bulunamadı.",
    trigger: "Tetik",
    bias: "Yön",
  },

  trend: {
    uptrend: "Yükselen Trend",
    downtrend: "Düşen Trend",
    range: "Yatay",
  },

  signal: {
    possible_buy_zone: "Olası Alım Bölgesi",
    breakout_watch: "Kırılım İzleniyor",
    pullback_entry: "Geri Çekilme Girişi",
    no_trade: "İşlem Yok",
  },

  volumeState: {
    strong: "Güçlü",
    normal: "Normal",
    weak: "Zayıf",
  },

  newsState: {
    not_connected: "Bağlı Değil",
    positive: "Olumlu",
    negative: "Olumsuz",
    mixed: "Karışık",
  },

  tradeBias: {
    long_watch: "Long izlenebilir",
    short_risk: "Short baskısı / long riskli",
    wait: "Bekle",
  },

  reasons: {
    uptrend_structure: "Yükseliş yapısı var",
    downtrend_structure: "Düşüş yapısı var",
    near_support_zone: "Fiyat destek bölgesine çok yakın",
    support_zone_in_reach: "Destek bölgesi yakın",
    close_to_resistance: "Fiyat dirence yakın",
    bullish_wick_rejection: "Destekte alıcı tepkisi var",
    bearish_wick_rejection: "Dirençte satıcı tepkisi var",
    resistance_breakout: "Direnç kırılımı görüldü",
    volume_confirmation: "Hacim teyidi var",
    volume_not_confirmed: "Hacim teyidi zayıf",
    fake_breakout_risk: "Sahte kırılım riski var",
    support_breakdown: "Destek kırılımı riski / gerçekleşmesi",
  },
} as const;
