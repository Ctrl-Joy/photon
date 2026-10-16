"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import ArbitrageTable from "../../components/ArbitrageTable";
import { getOpportunities } from "../../lib/api";

export default function ArbitragePage() {
  const [stats, setStats] = useState({
    activeCount: null,
    avgSpread: null,
    totalVolume: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const data = await getOpportunities();
        if (!mounted) return;

        if (Array.isArray(data)) {
          const activeOps = data.filter(
            (d) => (d.status || "active").toLowerCase() === "active"
          );
          const spreads = data
            .map((d) => parseFloat(d.spread || 0))
            .filter((s) => !isNaN(s));
          const avgSpread =
            spreads.length > 0
              ? spreads.reduce((a, b) => a + b, 0) / spreads.length
              : 0;
          const totalVol = data.reduce(
            (sum, d) => sum + parseFloat(d.volume || 0),
            0
          );

          setStats({
            activeCount: activeOps.length,
            avgSpread: avgSpread,
            totalVolume: totalVol,
          });
        }
      } catch {
        // Stats are optional; table handles its own errors
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }

    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-photon-bg">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 pb-4 pt-20 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-photon-text sm:text-3xl">
            Arbitrage Discovery
          </h1>
          <p className="mt-1 text-sm text-photon-text-secondary">
            Real-time cross-DEX price discrepancy scanner. Identify, simulate,
            and execute arbitrage opportunities across decentralized exchanges.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Active Opportunities"
            value={
              statsLoading
                ? null
                : stats.activeCount != null
                  ? stats.activeCount.toString()
                  : "--"
            }
            loading={statsLoading}
          />
          <StatCard
            label="Avg Spread"
            value={
              statsLoading
                ? null
                : stats.avgSpread != null
                  ? `${stats.avgSpread.toFixed(4)}%`
                  : "--"
            }
            loading={statsLoading}
          />
          <StatCard
            label="Total Volume Scanned"
            value={
              statsLoading
                ? null
                : stats.totalVolume != null && stats.totalVolume > 0
                  ? `$${formatVolume(stats.totalVolume)}`
                  : "--"
            }
            loading={statsLoading}
          />
        </div>

        {/* Table */}
        <ArbitrageTable />
      </main>
    </div>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <div className="surface-card flex flex-col px-4 py-3">
      <span className="text-xs text-photon-text-muted">{label}</span>
      {loading ? (
        <div className="mt-1 h-6 w-20 animate-pulse rounded bg-photon-surface-raised" />
      ) : (
        <span className="font-num text-lg font-semibold text-photon-text">
          {value}
        </span>
      )}
    </div>
  );
}

function formatVolume(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}
