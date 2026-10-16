"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getTradeStats } from "../lib/api";

const TIME_RANGES = ["24H", "7D", "30D", "All"];

function filterByRange(data, range) {
  if (!data || data.length === 0) return [];
  const now = Date.now();
  const ms = {
    "24H": 24 * 60 * 60 * 1000,
    "7D": 7 * 24 * 60 * 60 * 1000,
    "30D": 30 * 24 * 60 * 60 * 1000,
  };
  if (range === "All" || !ms[range]) return data;
  const cutoff = now - ms[range];
  return data.filter((d) => new Date(d.time || d.timestamp).getTime() >= cutoff);
}

function formatCurrency(val) {
  if (val == null) return "--";
  const abs = Math.abs(val);
  const prefix = val >= 0 ? "+$" : "-$";
  if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(2)}K`;
  return `${prefix}${abs.toFixed(2)}`;
}

function formatPercent(val) {
  if (val == null) return "--";
  return `${val.toFixed(1)}%`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass rounded-lg border border-photon-border bg-photon-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-photon-text-muted">
        {new Date(d.time || d.timestamp).toLocaleString()}
      </p>
      <p
        className={`font-num text-sm font-semibold ${
          d.pnl >= 0 ? "text-photon-positive" : "text-photon-negative"
        }`}
      >
        {formatCurrency(d.pnl)}
      </p>
    </div>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-photon-surface-raised ${className}`}
    />
  );
}

export default function PnLChart() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30D");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTradeStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <svg className="h-8 w-8 text-photon-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-photon-text-secondary">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-lg border border-photon-border px-4 py-1.5 text-sm font-medium text-photon-text-secondary transition-colors hover:bg-photon-surface-raised hover:text-photon-text"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = filterByRange(stats?.pnlHistory || stats?.chartData || [], range);
  const totalPnl = stats?.totalPnl ?? stats?.total_pnl ?? null;
  const winRate = stats?.winRate ?? stats?.win_rate ?? null;
  const totalTrades = stats?.totalTrades ?? stats?.total_trades ?? null;
  const bestTrade = stats?.bestTrade ?? stats?.best_trade ?? null;

  // Empty state
  const isEmpty = !chartData.length && totalTrades === 0;
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <svg className="h-10 w-10 text-photon-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-sm text-photon-text-muted">No trading data yet.</p>
        <p className="text-xs text-photon-text-muted">
          Start the arbitrage bot to begin tracking performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="surface-raised px-3 py-2.5">
          <p className="text-xs text-photon-text-muted">Total P&L</p>
          <p
            className={`font-num text-lg font-semibold ${
              totalPnl != null && totalPnl >= 0
                ? "text-photon-positive"
                : "text-photon-negative"
            }`}
          >
            {formatCurrency(totalPnl)}
          </p>
        </div>
        <div className="surface-raised px-3 py-2.5">
          <p className="text-xs text-photon-text-muted">Win Rate</p>
          <p className="font-num text-lg font-semibold text-photon-text">
            {formatPercent(winRate)}
          </p>
        </div>
        <div className="surface-raised px-3 py-2.5">
          <p className="text-xs text-photon-text-muted">Total Trades</p>
          <p className="font-num text-lg font-semibold text-photon-text">
            {totalTrades != null ? totalTrades : "--"}
          </p>
        </div>
        <div className="surface-raised px-3 py-2.5">
          <p className="text-xs text-photon-text-muted">Best Trade</p>
          <p className="font-num text-lg font-semibold text-photon-positive">
            {formatCurrency(bestTrade)}
          </p>
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex items-center gap-1">
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-photon-surface-raised text-photon-text"
                : "text-photon-text-muted hover:text-photon-text-secondary"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#63F0E0" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#63F0E0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(167, 190, 216, 0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#66768B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return range === "24H"
                  ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : d.toLocaleDateString([], { month: "short", day: "numeric" });
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#66768B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                return `$${val.toFixed(0)}`;
              }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#63F0E0"
              strokeWidth={2}
              fill="url(#pnlGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#63F0E0",
                stroke: "#111925",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
