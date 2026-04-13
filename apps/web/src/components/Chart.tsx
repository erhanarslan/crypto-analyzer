import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineStyle,
} from "lightweight-charts";

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

type ZoneWithTouches = {
  low: number;
  high: number;
  touches: number;
};

type ChartProps = {
  data: Candle[];
  ema20: LinePoint[];
  ema50: LinePoint[];
  ema200: LinePoint[];
  supportZones?: ZoneWithTouches[];
  resistanceZones?: ZoneWithTouches[];
  height?: number;
  compact?: boolean;
};

export default function Chart({
  data,
  ema20,
  ema50,
  ema200,
  supportZones = [],
  resistanceZones = [],
  height = 520,
  compact = false,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#334155",
        fontSize: compact ? 10 : 12,
      },
      grid: {
        vertLines: { color: "#e2e8f0" },
        horzLines: { color: "#e2e8f0" },
      },
      rightPriceScale: {
        borderColor: "#cbd5e1",
      },
      timeScale: {
        borderColor: "#cbd5e1",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#14b8a6",
      downColor: "#f87171",
      borderUpColor: "#14b8a6",
      borderDownColor: "#f87171",
      wickUpColor: "#14b8a6",
      wickDownColor: "#f87171",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    candleSeries.setData(
      data.map((item) => ({
        time: item.time as never,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      })),
    );

    const ema20Series = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: compact ? 1 : 2,
      priceLineVisible: false,
      lastValueVisible: !compact,
    });

    ema20Series.setData(
      ema20.map((item) => ({
        time: item.time as never,
        value: item.value,
      })),
    );

    const ema50Series = chart.addSeries(LineSeries, {
      color: "#2563eb",
      lineWidth: compact ? 1 : 2,
      priceLineVisible: false,
      lastValueVisible: !compact,
    });

    ema50Series.setData(
      ema50.map((item) => ({
        time: item.time as never,
        value: item.value,
      })),
    );

    const ema200Series = chart.addSeries(LineSeries, {
      color: "#1d4ed8",
      lineWidth: compact ? 1 : 2,
      priceLineVisible: false,
      lastValueVisible: !compact,
    });

    ema200Series.setData(
      ema200.map((item) => ({
        time: item.time as never,
        value: item.value,
      })),
    );

    const priceLineHandles = [
      ...supportZones.flatMap((zone) => [
        candleSeries.createPriceLine({
          price: zone.low,
          color: "#22c55e",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: compact ? "" : "S",
        }),
        candleSeries.createPriceLine({
          price: zone.high,
          color: "#16a34a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: compact ? "" : "S",
        }),
      ]),
      ...resistanceZones.flatMap((zone) => [
        candleSeries.createPriceLine({
          price: zone.low,
          color: "#ef4444",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: compact ? "" : "R",
        }),
        candleSeries.createPriceLine({
          price: zone.high,
          color: "#dc2626",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: compact ? "" : "R",
        }),
      ]),
    ];

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({
        width: container.clientWidth,
        height,
      });
      chart.timeScale().fitContent();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      priceLineHandles.forEach((line) => candleSeries.removePriceLine(line));
      chart.remove();
    };
  }, [
    data,
    ema20,
    ema50,
    ema200,
    supportZones,
    resistanceZones,
    height,
    compact,
  ]);

  return <div ref={containerRef} className="w-full" />;
}
