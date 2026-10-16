"use client";

import { useState, useEffect, useCallback } from "react";
import { getTradeStats } from "../lib/api";

function formatPercent(val) {
  if (val == null) return "--";
  return `${Number(val).toFixed(1)}%`;
}

function formatNum(val, decimals = 2) {
  if (val == null) return "--";
  return Number(val).toFixed(decimals);
}

function SkeletonCard() {
  return (
    <div className="surface-raised animate-pulse p-4">
      <div className="mb-2 h-3 w-20 rounded bg-photon-surface" />
      <div className="h-7 w-24 rounded bg-photon-surface" />
    </div>
  );
}

function MetricCard({ label, value, color, subValue, bar }) {
  return (
    <div className="surface-raised p-4 transition-all hover:border-photon-border-strong">
      <p className="mb-1 text-xs text-photon-text-muted">{label}</p>
      <p className={`font-num text-xl font-semibold ${color || "text-photon-text"}`}>
        {value}
      </p>
      {subValue && (
        <p className="mt-0.5 text-xs text-photon-text-muted">{subValue}</p>
      )}
      {bar != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-photon-surface">
          <div
            className="h-full rounded-full bg-photon-cyan transition-all"
            style={{ width: `${Math.min(Math.max(bar, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function RiskMetrics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTradeStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-photon-text-muted">No metrics available.</p>
      </div>
    );
  }

  const totalReturn = stats.totalReturn ?? stats.total_return;
  const sharpeRatio = stats.sharpeRatio ?? stats.sharpe_ratio;
  const maxDrawdown = stats.maxDrawdown ?? stats.max_drawdown;
  const winRate = stats.winRate ?? stats.win_rate;
  const avgDuration = stats.avgTradeDuration ?? stats.avg_trade_duration;
  const activePositions = stats.activePositions ?? stats.active_positions;

  const returnColor =
    totalReturn == null
      ? "text-photon-text"
      : totalReturn >= 0
      ? "text-photon-positive"
      : "text-photon-negative";

  const returnArrow =
    totalReturn == null ? "" : totalReturn >= 0 ? "↑ " : "↓ ";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MetricCard
        label="Total Return"
        value={`${returnArrow}${formatPercent(totalReturn)}`}
        color={returnColor}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={formatNum(sharpeRatio)}
        color={
          sharpeRatio != null && sharpeRatio >= 1
            ? "text-photon-positive"
            : sharpeRatio != null && sharpeRatio < 0
            ? "text-photon-negative"
            : "text-photon-text"
        }
        subValue={
          sharpeRatio != null
            ? sharpeRatio >= 2
              ? "Excellent"
              : sharpeRatio >= 1
              ? "Good"
              : "Below target"
            : undefined
        }
      />
      <MetricCard
        label="Max Drawdown"
        value={formatPercent(maxDrawdown)}
        color="text-photon-negative"
      />
      <MetricCard
        label="Win Rate"
        value={formatPercent(winRate)}
        bar={winRate}
      />
      <MetricCard
        label="Avg Trade Duration"
        value={avgDuration ?? "--"}
        color="text-photon-text"
      />
      <MetricCard
        label="Active Positions"
        value={activePositions != null ? activePositions : "--"}
        color="text-photon-cyan"
      />
    </div>
  );
}
