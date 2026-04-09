import { useEffect, useMemo, useState } from "react";
import Chart from "./components/Chart";
import AnalysisPanel from "./components/AnalysisPanel";
import ScannerPanel from "./components/ScannerPanel";
import { tr } from "./i18n/tr";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type LinePoint = {
  time: number;
  value: number;
};

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

type AnalyzeResponse = {
  symbol: string;
  interval: "1h" | "4h";
  candles: Candle[];
  report: {
    trend: "uptrend" | "downtrend" | "range";
    supportZones: Zone[];
    resistanceZones: Zone[];
    score: number;
    signal:
      | "possible_buy_zone"
      | "breakout_watch"
      | "pullback_entry"
      | "no_trade";
    reasons: string[];
    summary: string;
    ema20: LinePoint[];
    ema50: LinePoint[];
    ema200: LinePoint[];

    volumeState: "weak" | "normal" | "strong";
    volumeComment: string;
    orderFlowComment: string;
    marketContext: string;
    expertCommentary: string;

    newsState: "not_connected" | "positive" | "negative" | "mixed";
    newsComment: string;

    tradePlan: TradePlan;
  };
};

type ScannerItem = {
  symbol: string;
  interval: "1h" | "4h";
  trend: "uptrend" | "downtrend" | "range";
  score: number;
  signal:
    | "possible_buy_zone"
    | "breakout_watch"
    | "pullback_entry"
    | "no_trade";
  summary: string;
  supportZones: Zone[];
  resistanceZones: Zone[];
  reasons: string[];
  tradePlan: TradePlan;
};

type ScanResponse = {
  interval: "1h" | "4h";
  items: ScannerItem[];
};

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"];

function App() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<"1h" | "4h">("4h");

  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scannerItems, setScannerItems] = useState<ScannerItem[]>([]);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `http://localhost:3001/api/analyze?symbol=${symbol}&interval=${interval}&limit=300`,
        );

        if (!res.ok) {
          throw new Error("Analysis request failed");
        }

        const json: AnalyzeResponse = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(tr.app.error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [symbol, interval]);

  useEffect(() => {
    const runScanner = async () => {
      setScannerLoading(true);
      setScannerError(null);

      try {
        const res = await fetch(
          `http://localhost:3001/api/scan?interval=${interval}&limit=300`,
        );

        if (!res.ok) {
          throw new Error("Scanner request failed");
        }

        const json: ScanResponse = await res.json();
        setScannerItems(json.items);
      } catch (err) {
        console.error(err);
        setScannerItems([]);
        setScannerError(tr.app.scannerError);
      } finally {
        setScannerLoading(false);
      }
    };

    runScanner();
  }, [interval]);

  const sortedScannerItems = useMemo(() => {
    return [...scannerItems].sort((a, b) => b.score - a.score);
  }, [scannerItems]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tr.app.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{tr.app.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="min-w-[160px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as "1h" | "4h")}
              className="min-w-[120px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="1h">1H</option>
              <option value="4h">4H</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            {tr.app.loading}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {tr.app.chartTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {tr.app.chartSubtitle}
                    </p>
                  </div>
                </div>

                <Chart
                  data={data.candles}
                  ema20={data.report.ema20}
                  ema50={data.report.ema50}
                  ema200={data.report.ema200}
                  supportZones={data.report.supportZones}
                  resistanceZones={data.report.resistanceZones}
                />
              </section>

              <AnalysisPanel
                symbol={data.symbol}
                interval={data.interval}
                trend={data.report.trend}
                score={data.report.score}
                signal={data.report.signal}
                summary={data.report.summary}
                reasons={data.report.reasons}
                supportZones={data.report.supportZones}
                resistanceZones={data.report.resistanceZones}
                volumeState={data.report.volumeState}
                volumeComment={data.report.volumeComment}
                orderFlowComment={data.report.orderFlowComment}
                marketContext={data.report.marketContext}
                expertCommentary={data.report.expertCommentary}
                newsState={data.report.newsState}
                newsComment={data.report.newsComment}
                tradePlan={data.report.tradePlan}
              />
            </div>

            <div className="space-y-3">
              {scannerError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
                  {scannerError}
                </div>
              )}

              <ScannerPanel
                items={sortedScannerItems}
                loading={scannerLoading}
                activeSymbol={symbol}
                onSelectSymbol={setSymbol}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
