import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type LinePoint = {
  time: number;
  value: number;
};

type Zone = {
  low: number;
  high: number;
};

type Props = {
  data: Candle[];
  ema20: LinePoint[];
  ema50: LinePoint[];
  ema200: LinePoint[];
  supportZones: Zone[];
  resistanceZones: Zone[];
};

export default function Chart({
  data,
  ema20,
  ema50,
  ema200,
  supportZones,
  resistanceZones,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema200Ref = useRef<ISeriesApi<"Line"> | null>(null);

  const supportTopRef = useRef<ISeriesApi<"Line"> | null>(null);
  const supportBottomRef = useRef<ISeriesApi<"Line"> | null>(null);

  const resistanceTopRef = useRef<ISeriesApi<"Line"> | null>(null);
  const resistanceBottomRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 550,
      layout: {
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: true },
        horzLines: { visible: true },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries);

    const ema20Series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: "#2563eb",
    });

    const ema50Series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: "#0ea5e9",
    });

    const ema200Series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: "#1d4ed8",
    });

    const supportTop = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: "#16a34a",
      lineStyle: 2,
    });

    const supportBottom = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: "#16a34a",
      lineStyle: 2,
    });

    const resistanceTop = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: "#dc2626",
      lineStyle: 2,
    });

    const resistanceBottom = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: "#dc2626",
      lineStyle: 2,
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;

    ema20Ref.current = ema20Series;
    ema50Ref.current = ema50Series;
    ema200Ref.current = ema200Series;

    supportTopRef.current = supportTop;
    supportBottomRef.current = supportBottom;

    resistanceTopRef.current = resistanceTop;
    resistanceBottomRef.current = resistanceBottom;

    const resize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleRef.current) return;

    const candles: CandlestickData<UTCTimestamp>[] = data.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleRef.current.setData(candles);

    const mapLine = (arr: LinePoint[]): LineData<UTCTimestamp>[] =>
      arr.map((p) => ({
        time: p.time as UTCTimestamp,
        value: p.value,
      }));

    ema20Ref.current?.setData(mapLine(ema20));
    ema50Ref.current?.setData(mapLine(ema50));
    ema200Ref.current?.setData(mapLine(ema200));

    const support = supportZones[0];
    if (support) {
      const top = data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: support.high,
      }));

      const bottom = data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: support.low,
      }));

      supportTopRef.current?.setData(top);
      supportBottomRef.current?.setData(bottom);
    } else {
      supportTopRef.current?.setData([]);
      supportBottomRef.current?.setData([]);
    }

    const resistance = resistanceZones[0];
    if (resistance) {
      const top = data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: resistance.high,
      }));

      const bottom = data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: resistance.low,
      }));

      resistanceTopRef.current?.setData(top);
      resistanceBottomRef.current?.setData(bottom);
    } else {
      resistanceTopRef.current?.setData([]);
      resistanceBottomRef.current?.setData([]);
    }

    chartRef.current?.timeScale().fitContent();
  }, [data, ema20, ema50, ema200, supportZones, resistanceZones]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}
