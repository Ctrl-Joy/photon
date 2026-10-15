"use client";
import ArbitrageTable from "../../components/ArbitrageTable";
import BotControls from "../../components/BotControls";

export default function ArbitragePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Arbitrage</span>
        </h1>
        <p className="text-photon-muted">
          Detect cross-DEX price inefficiencies and execute atomic arbitrage trades.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Opportunities Table */}
        <div className="lg:col-span-2">
          <ArbitrageTable />
        </div>

        {/* Bot Controls Sidebar */}
        <div>
          <BotControls />
        </div>
      </div>
    </div>
  );
}
