export const tr = {
  app: {
    title: "Crypto Analyzer",
    subtitle:
      "Coin seç, timeframe değiştir, daha net ve aksiyon odaklı teknik değerlendirmeyi izle.",
    chartTitle: "Grafik",
    chartSubtitle: "EMA 20 / 50 / 200 ve destek-direnç bölgeleri",
    loading: "Yükleniyor...",
    error: "Veri alınamadı",
    scannerError: "Tarama verisi alınamadı",
  },

  panel: {
    technicalSummary: "Analiz Özeti",
    trend: "Trend",
    signal: "Sinyal",
    score: "Skor",
    scoreMeaning: "Skor Anlamı",
    support: "Destek",
    resistance: "Direnç",
    summary: "Kısa Sonuç",
    reasons: "Teknik Gerekçeler",
    marketContext: "Piyasa Durumu",
    volumeState: "Hacim",
    volumeComment: "Hacim Yorumu",
    orderFlow: "Son Mum İzi",
    expertCommentary: "Net Yorum",
    tradePlan: "Karar Çerçevesi",
    entryHint: "Yeni Pozisyon",
    breakoutAbove: "Üstü Teyit",
    breakdownBelow: "Altı Bozulma",
    invalidation: "Geçersizlik",
    takeProfit: "Kâr Alma",
    action: "Elde Varsa",
    news: "Haber",
    newsComment: "Haber Yorumu",
    notAvailable: "Yok",
    shortSide: "Short Tarafı",
  },

  scanner: {
    title: "Öne Çıkanlar",
    subtitle: "Skoru ve yapısı öne çıkan coinler",
    sortedByScore: "Skora göre sıralı",
    loading: "Tarama verileri yükleniyor...",
    empty: "Seçilen minimum skor için uygun coin bulunamadı.",
    trigger: "Yeni Pozisyon",
    bias: "Yön",
    opportunities: "Öne Çıkan Fırsatlar",
    minScore: "Minimum skor",
  },

  favorites: {
    title: "Favorilerim",
    subtitle: "Takip ettiğin coinlerin kısa kritik özeti",
    empty: "Henüz favori coin yok.",
    add: "Favoriye ekle",
    remove: "Favoriden çıkar",
  },

  trend: {
    uptrend: "Yükselen Trend",
    downtrend: "Düşen Trend",
    range: "Yatay",
  },

  signal: {
    possible_buy_zone: "Alım Bölgesi Adayı",
    breakout_watch: "Kırılım Takibi",
    pullback_entry: "Pullback Long Takibi",
    no_trade: "Net Üstünlük Yok",
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
    long_watch: "Long taraf izlenebilir",
    short_risk: "Short baskısı yüksek",
    wait: "Bekle / teyit ara",
  },

  newPositionAction: {
    buy_watch: "Alım için izlenebilir",
    breakout_watch: "Kırılım teyidi bekle",
    wait: "Yeni işlem için bekle",
    avoid: "Yeni alım için uygun değil",
  },

  holderAction: {
    hold: "Elde varsa tutulabilir",
    protect_profit: "Kârı koru",
    reduce_risk: "Riski azalt",
    wait: "Elde varsa agresif ekleme yapma",
  },

  shortAction: {
    not_ready: "Short için uygun değil",
    watch: "Short baskısı izlenebilir",
    aggressive_only: "Yalnız agresif short senaryosu",
  },

  scoreBands: {
    weak: "Zayıf yapı",
    watch: "İzlenebilir ama zayıf",
    developing: "Gelişen setup",
    strong: "Güçlü takip",
    premium: "Çok güçlü setup",
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
