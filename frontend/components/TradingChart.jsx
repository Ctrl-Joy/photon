"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPriceHistory } from "../lib/api";

const INTERVALS = [
  { label: "1H", minutes: 60, limit: 60 },
  { label: "4H", minutes: 240, limit: 60 },
  { label: "1D", minutes: 1440, limit: 100 },
  { label: "1W", minutes: 10080, limit: 100 },
];

/**
 * Convert an array of {price, timestamp} points into OHLC candles.
 * Groups data points into time buckets of `bucketMinutes`.
 */
function toOHLC(data, bucketMinutes) {
  if (!data || data.length === 0) return [];

  const bucketMs = bucketMinutes * 60 * 1000;
  const sorted = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const buckets = new Map();

  for (const point of sorted) {
    const ts = new Date(point.timestamp).getTime();
    const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
    const price = parseFloat(point.price);

    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, {
        time: bucketStart / 1000, // lightweight-charts expects seconds
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
      });
    } else {
      const candle = buckets.get(bucketStart);
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
    }

    // Use volume if available
    if (point.volume) {
      buckets.get(bucketStart).volume += parseFloat(point.volume);
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

function ChartSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="h-4 w-32 animate-pulse rounded bg-photon-surface-raised" />
      <div className="flex w-full flex-1 items-end gap-1 px-8 pb-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-photon-surface-raised"
            style={{
              height: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TradingChart({ token = "ETH", dex = "uniswap" }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [activeInterval, setActiveInterval] = useState(INTERVALS[2]); // 1D default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const createChart = useCallback(async () => {
    if (!chartContainerRef.current) return;

    // Dynamic import to avoid SSR issues
    const { createChart: createLWChart, CrosshairMode } = await import(
      "lightweight-charts"
    );

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createLWChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "#080B10" },
        textColor: "#9BAABD",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(167,190,216,0.06)" },
        horzLines: { color: "rgba(167,190,216,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(83,184,255,0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#16212E",
        },
        horzLine: {
          color: "rgba(83,184,255,0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#16212E",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(167,190,216,0.13)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(167,190,216,0.13)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#54D6A0",
      downColor: "#FF737D",
      borderUpColor: "#54D6A0",
      borderDownColor: "#FF737D",
      wickUpColor: "#54D6A0",
      wickDownColor: "#FF737D",
    });

    // Volume histogram
    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(83,184,255,0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    // Store for cleanup
    container._resizeObserver = resizeObserver;

    return chart;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      const data = await getPriceHistory(token, dex, activeInterval.limit);

      if (!data || data.length === 0) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      const candles = toOHLC(data, activeInterval.minutes / activeInterval.limit);

      if (candles.length === 0) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(candles);
      }

      if (volumeSeriesRef.current) {
        const volumeData = candles.map((c) => ({
          time: c.time,
          value: c.volume || 0,
          color:
            c.close >= c.open
              ? "rgba(84,214,160,0.25)"
              : "rgba(255,115,125,0.25)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch price history:", err);
      setError(err.message || "Failed to load chart data");
      setLoading(false);
    }
  }, [token, dex, activeInterval]);

  // Create chart once on mount
  useEffect(() => {
    let mounted = true;

    createChart().then(() => {
      if (mounted) fetchData();
    });

    return () => {
      mounted = false;
      const container = chartContainerRef.current;
      if (container?._resizeObserver) {
        container._resizeObserver.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when interval/token/dex changes (chart already exists)
  useEffect(() => {
    if (chartRef.current) {
      fetchData();
    }
  }, [fetchData]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Interval selector */}
      <div className="flex items-center gap-1 border-b border-photon-border px-3 py-2">
        {INTERVALS.map((interval) => (
          <button
            key={interval.label}
            onClick={() => setActiveInterval(interval)}
            className={`rounded px-2.5 py-1 font-num text-xs font-medium transition-colors ${
              activeInterval.label === interval.label
                ? "bg-photon-surface-raised text-photon-blue"
                : "text-photon-text-muted hover:text-photon-text-secondary"
            }`}
          >
            {interval.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-photon-text-muted">
          <div className="live-dot" />
          <span>Live</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10">
            <ChartSkeleton />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
            <svg
              className="h-8 w-8 text-photon-negative"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span className="text-sm text-photon-text-secondary">{error}</span>
            <button
              onClick={fetchData}
              className="mt-1 rounded-lg border border-photon-border px-3 py-1 text-xs text-photon-text-secondary transition-colors hover:border-photon-border-strong hover:text-photon-text"
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty && !loading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
            <svg
              className="h-8 w-8 text-photon-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            <span className="text-sm text-photon-text-muted">
              No price data available
            </span>
          </div>
        )}

        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
