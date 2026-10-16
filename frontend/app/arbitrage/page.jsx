"use client";
import ArbitrageTable from "../../components/ArbitrageTable";
import BotControls from "../../components/BotControls";

export default function ArbitragePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-lg font-semibold font-heading text-photon-text">
          Arbitrage Discovery
        </h1>
        <div className="live-dot" />
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Opportunities table */}
        <div className="lg:col-span-3">
          <ArbitrageTable />
        </div>

        {/* Bot sidebar */}
        <div>
          <BotControls />
        </div>
      </div>
    </div>
  );
}
