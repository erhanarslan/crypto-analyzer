import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Timeframe } from "../../../packages/shared/src";
import {
  buildSnapshotFromCandles,
  buildStructuredAnalysis,
} from "../../../packages/analysis-core/src";
import { getCandles, getSymbols } from "./services/market.service";
import { scanByOffset, scanBySymbols } from "./services/scan.service";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => {
  return {
    ok: true,
    service: "crypto-analyzer-api",
  };
});

app.get("/api/market/symbols", async (request, reply) => {
  try {
    const query = request.query as {
      quoteAsset?: string;
      limit?: string;
    };

    const quoteAsset = (query.quoteAsset ?? "USDT").toUpperCase();
    const limit = Math.min(Math.max(Number(query.limit ?? 300), 1), 1000);

    const symbols = await getSymbols(quoteAsset, limit);

    return {
      quoteAsset,
      count: symbols.length,
      symbols,
    };
  } catch (error) {
    request.log.error(error);
    reply.code(500);
    return { error: "Symbols request failed" };
  }
});

app.get("/api/market/candles", async (request, reply) => {
  try {
    const query = request.query as {
      symbol?: string;
      interval?: Timeframe;
      limit?: string;
    };

    const symbol = (query.symbol ?? "BTCUSDT").toUpperCase();
    const interval = (query.interval ?? "4h") as Timeframe;
    const limit = Math.min(Math.max(Number(query.limit ?? 300), 50), 1000);

    const candles = await getCandles(symbol, interval, limit);

    return {
      symbol,
      interval,
      candles,
    };
  } catch (error) {
    request.log.error(error);
    reply.code(500);
    return { error: "Candle request failed" };
  }
});

app.get("/api/analyze", async (request, reply) => {
  try {
    const query = request.query as {
      symbol?: string;
      interval?: Timeframe;
    };

    const symbol = (query.symbol ?? "BTCUSDT").toUpperCase();
    const interval = (query.interval ?? "4h") as Timeframe;

    const candles = await getCandles(symbol, interval, 300);
    const snapshot = buildSnapshotFromCandles(symbol, interval, candles);
    const analysis = buildStructuredAnalysis(snapshot);

    return {
      symbol,
      interval,
      snapshot,
      analysis,
    };
  } catch (error) {
    request.log.error(error);
    reply.code(500);
    return { error: "Analyze request failed" };
  }
});

app.get("/api/scan", async (request, reply) => {
  try {
    const query = request.query as {
      interval?: Timeframe;
      offset?: string;
      limit?: string;
      quoteAsset?: string;
      symbols?: string;
    };

    const interval = (query.interval ?? "4h") as Timeframe;

    if (query.symbols?.trim()) {
      const symbols = query.symbols.split(",");

      const items = await scanBySymbols({
        interval,
        symbols,
      });

      return {
        interval,
        offset: 0,
        limit: items.length,
        total: items.length,
        count: items.length,
        nextOffset: null,
        items,
      };
    }

    const offset = Math.max(Number(query.offset ?? 0), 0);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 50);
    const quoteAsset = (query.quoteAsset ?? "USDT").toUpperCase();

    const result = await scanByOffset({
      interval,
      offset,
      limit,
      quoteAsset,
      symbolUniverseLimit: 300,
    });

    return {
      interval,
      offset,
      limit,
      total: result.total,
      count: result.items.length,
      nextOffset: result.nextOffset,
      items: result.items,
    };
  } catch (error) {
    request.log.error(error);
    reply.code(500);
    return { error: "Scan request failed" };
  }
});

const port = Number(process.env.PORT ?? 3001);

await app.listen({
  port,
  host: "0.0.0.0",
});
