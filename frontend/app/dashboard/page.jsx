"use client";
import PnLChart from "../../components/PnLChart";
import TradeHistory from "../../components/TradeHistory";
import RiskMetrics from "../../components/RiskMetrics";
import BotControls from "../../components/BotControls";

export default function DashboardPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-heading text-[24px] text-photon-text">Dashboard</h1>
        <p className="text-photon-text-muted text-[13px] mt-0.5">Performance & Trade Analytics</p>
      </div>

      {/* Top row: Chart + Metrics */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <PnLChart />
        </div>
        <div>
          <RiskMetrics />
        </div>
      </div>

      {/* Bottom row: Trades + Bot */}
      <div className="grid lg:grid-cols-3 gap-4">
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
