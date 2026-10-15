"use client";
import PnLChart from "../../components/PnLChart";
import TradeHistory from "../../components/TradeHistory";
import RiskMetrics from "../../components/RiskMetrics";
import BotControls from "../../components/BotControls";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-photon-muted">
          Track your trading performance, P&L, and risk metrics in real time.
        </p>
      </div>

      {/* Top row: Chart + Metrics */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <PnLChart />
        </div>
        <div>
          <RiskMetrics />
        </div>
      </div>

      {/* Bottom row: Trade History + Bot Controls */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TradeHistory />
        </div>
        <div>
          <BotControls />
        </div>
      </div>
    </div>
  );
}
