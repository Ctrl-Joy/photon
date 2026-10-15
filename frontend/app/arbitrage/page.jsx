"use client";
import ArbitrageTable from "../../components/ArbitrageTable";
import BotControls from "../../components/BotControls";

export default function ArbitragePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Opportunities — wide like dYdX order book */}
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
