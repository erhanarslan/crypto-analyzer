import Fastify from "fastify";
import cors from "@fastify/cors";
import { analyzeCandles } from "@crypto-analyzer/analysis-core";
import type { Candle, Timeframe } from "@crypto-analyzer/shared";

const app = Fastify({
  logger: true,
});

const BINANCE_BASE_URL = "https://api.binance.com";
const DEFAULT_LIMIT = 300;
const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_INTERVAL: Timeframe = "4h";
const SCAN_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"];

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCandles(rows: BinanceKline[]): Candle[] {
  return rows.map((row) => ({
    time: Math.floor(row[0] / 1000),
    open: toNumber(row[1]),
    high: toNumber(row[2]),
    low: toNumber(row[3]),
    close: toNumber(row[4]),
    volume: toNumber(row[5]),
  }));
}

function parseTimeframe(value: unknown): Timeframe {
  return value === "1h" ? "1h" : "4h";
}

function parseLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(parsed), 50), 1000);
}

async function fetchCandles(
  symbol: string,
  interval: Timeframe,
  limit: number,
): Promise<Candle[]> {
  const url = new URL("/api/v3/klines", BINANCE_BASE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Binance klines request failed: ${res.status}`);
  }

  const json = (await res.json()) as BinanceKline[];

  if (!Array.isArray(json)) {
    throw new Error("Invalid Binance response");
  }

  return normalizeCandles(json);
}

app.register(cors, {
  origin: true,
});

app.get("/health", async () => {
  return {
    ok: true,
    service: "crypto-analyzer-api",
  };
});

app.get("/api/market/candles", async (request, reply) => {
  try {
    const query = request.query as {
      symbol?: string;
      interval?: Timeframe;
      limit?: string;
    };

    const symbol = (query.symbol ?? DEFAULT_SYMBOL).toUpperCase();
    const interval = parseTimeframe(query.interval);
    const limit = parseLimit(query.limit);

    const candles = await fetchCandles(symbol, interval, limit);

    return {
      symbol,
      interval,
      candles,
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: "Failed to fetch candles",
    });
  }
});

app.get("/api/analyze", async (request, reply) => {
  try {
    const query = request.query as {
      symbol?: string;
      interval?: Timeframe;
      limit?: string;
    };

    const symbol = (query.symbol ?? DEFAULT_SYMBOL).toUpperCase();
    const interval = parseTimeframe(query.interval);
    const limit = parseLimit(query.limit);

    const candles = await fetchCandles(symbol, interval, limit);
    const report = analyzeCandles(symbol, interval, candles);

    return {
      symbol,
      interval,
      candles,
      report,
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: "Failed to analyze market data",
    });
  }
});

app.get("/api/scan", async (request, reply) => {
  try {
    const query = request.query as {
      interval?: Timeframe;
      limit?: string;
    };

    const interval = parseTimeframe(query.interval);
    const limit = parseLimit(query.limit);

    const results = await Promise.all(
      SCAN_SYMBOLS.map(async (symbol) => {
        const candles = await fetchCandles(symbol, interval, limit);
        const report = analyzeCandles(symbol, interval, candles);

        return {
          symbol,
          interval,
          trend: report.trend,
          score: report.score,
          signal: report.signal,
          summary: report.summary,
          supportZones: report.supportZones,
          resistanceZones: report.resistanceZones,
          reasons: report.reasons,
        };
      }),
    );

    results.sort((a, b) => b.score - a.score);

    return {
      interval,
      items: results,
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: "Failed to scan market data",
    });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3001);
    const host = process.env.HOST ?? "0.0.0.0";

    await app.listen({ port, host });
    app.log.info(`API running on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
