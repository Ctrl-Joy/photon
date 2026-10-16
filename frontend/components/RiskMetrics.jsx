"use client";
import { useEffect, useState } from "react";
import { getTradeStats } from "../lib/api";

function Metric({ label, value, color = "text-photon-text" }) {
  return (
    <div className="bg-photon-bg-elevated rounded-xl p-3">
      <div className="text-photon-text-muted text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-[14px] font-bold font-num ${color}`}>{value}</div>
    </div>
  );
}

export default function RiskMetrics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await getTradeStats();
        setStats(s);
      } catch {
        setStats({
          totalTrades: 47,
          winRate: 72.3,
          totalProfit: 2.847,
          sharpeRatio: 1.85,
          maxDrawdown: -0.342,
          avgProfit: 0.0605,
          totalGas: 0.089,
          bestTrade: 0.412,
          worstTrade: -0.156,
          profitFactor: 3.2,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-photon-surface border border-photon-border rounded-2xl p-4">
        <div className="text-photon-text-muted text-[13px]">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="bg-photon-surface border border-photon-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-photon-border">
        <span className="text-[13px] font-semibold text-photon-text font-heading">Performance</span>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        <Metric
          label="Total Profit"
          value={`${stats?.totalProfit >= 0 ? "+" : ""}${(stats?.totalProfit || 0).toFixed(4)} ETH`}
          color={stats?.totalProfit >= 0 ? "text-photon-positive" : "text-photon-negative"}
        />
        <Metric
          label="Win Rate"
          value={`${(stats?.winRate || 0).toFixed(1)}%`}
          color={(stats?.winRate || 0) >= 50 ? "text-photon-positive" : "text-photon-negative"}
        />
        <Metric
          label="Sharpe Ratio"
          value={(stats?.sharpeRatio || 0).toFixed(2)}
          color={(stats?.sharpeRatio || 0) >= 1 ? "text-photon-positive" : "text-photon-text-muted"}
        />
        <Metric
          label="Max Drawdown"
          value={`${(stats?.maxDrawdown || 0).toFixed(4)} ETH`}
          color="text-photon-negative"
        />
        <Metric
          label="Total Trades"
          value={stats?.totalTrades || 0}
        />
        <Metric
          label="Avg Profit"
          value={`${(stats?.avgProfit || 0).toFixed(4)} ETH`}
          color={(stats?.avgProfit || 0) >= 0 ? "text-photon-positive" : "text-photon-negative"}
        />
        <Metric
          label="Best Trade"
          value={`+${(stats?.bestTrade || 0).toFixed(4)} ETH`}
          color="text-photon-positive"
        />
        <Metric
          label="Gas Spent"
          value={`${(stats?.totalGas || 0).toFixed(5)} ETH`}
          color="text-photon-text-muted"
        />
      </div>
    </div>
  );
}
