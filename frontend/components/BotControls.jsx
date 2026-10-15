"use client";
import { useState, useEffect } from "react";
import { getBotStatus, toggleBot, updateRiskParams } from "../lib/api";

export default function BotControls() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = async () => {
    try {
      const s = await getBotStatus();
      setStatus(s);
    } catch (err) {
      console.error("Bot status error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleBot(!status?.enabled);
      await fetchStatus();
    } catch (err) {
      console.error("Toggle error:", err);
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="bg-dex-surface border border-dex-border rounded-xl p-4">
        <div className="text-dex-muted text-[13px]">Loading bot...</div>
      </div>
    );
  }

  return (
    <div className="bg-dex-surface border border-dex-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dex-border flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white">Arbitrage Bot</span>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            status?.enabled ? "bg-dex-green" : "bg-dex-border-light"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              status?.enabled ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Status Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-dex-card rounded-lg p-2.5">
            <div className="text-[10px] text-dex-muted uppercase tracking-wider mb-0.5">Status</div>
            <div className={`text-[13px] font-semibold ${status?.enabled ? "text-dex-green" : "text-dex-red"}`}>
              {status?.enabled ? "Running" : "Stopped"}
            </div>
          </div>
          <div className="bg-dex-card rounded-lg p-2.5">
            <div className="text-[10px] text-dex-muted uppercase tracking-wider mb-0.5">Kill Switch</div>
            <div className={`text-[13px] font-semibold ${status?.killSwitchActive ? "text-dex-red" : "text-dex-green"}`}>
              {status?.killSwitchActive ? "TRIGGERED" : "Normal"}
            </div>
          </div>
        </div>

        {/* Risk Params */}
        <div>
          <div className="text-[10px] text-dex-muted uppercase tracking-wider mb-2">Risk Parameters</div>
          <div className="bg-dex-card rounded-lg p-3 space-y-2">
            {[
              { label: "Max Trade Size", value: `${status?.maxTradeSize || "10"} ETH` },
              { label: "Daily Loss Limit", value: `${status?.dailyLossLimit || "5"} ETH` },
              { label: "Min Spread", value: `${status?.minSpread || "0.5"}%` },
              {
                label: "Today's Loss",
                value: `${status?.dailyLoss || "0"} ETH`,
                color: (status?.dailyLoss || 0) > 0 ? "text-dex-red" : "text-dex-green",
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-[12px]">
                <span className="text-dex-muted">{item.label}</span>
                <span className={`font-num ${item.color || "text-white"}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
