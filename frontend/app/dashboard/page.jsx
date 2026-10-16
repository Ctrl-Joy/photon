"use client";

import Navbar from "../../components/Navbar";
import PnLChart from "../../components/PnLChart";
import TradeHistory from "../../components/TradeHistory";
import RiskMetrics from "../../components/RiskMetrics";
import BotControls from "../../components/BotControls";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-photon-bg">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-photon-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-photon-text-muted">
            Performance overview and bot management
          </p>
        </div>

        <div className="space-y-5">
          {/* Top row: PnL Chart + Bot Controls */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="surface-card p-5 lg:col-span-2">
              <h2 className="mb-4 font-heading text-base font-semibold text-photon-text">
                Profit & Loss
              </h2>
              <PnLChart />
            </div>
            <div className="surface-card p-5 lg:col-span-1">
              <h2 className="mb-4 font-heading text-base font-semibold text-photon-text">
                Bot Controls
              </h2>
              <BotControls />
            </div>
          </div>

          {/* Middle row: Risk Metrics */}
          <div className="surface-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold text-photon-text">
              Risk Metrics
            </h2>
            <RiskMetrics />
          </div>

          {/* Bottom row: Trade History */}
          <div className="surface-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold text-photon-text">
              Trade History
            </h2>
            <TradeHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
