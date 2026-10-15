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
      <div className="bg-photon-card border border-photon-border rounded-2xl p-6">
        <p className="text-photon-muted text-sm">Loading bot status...</p>
      </div>
    );
  }

  return (
    <div className="bg-photon-card border border-photon-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Arbitrage Bot</h3>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            status?.enabled ? "bg-photon-green" : "bg-photon-border"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              status?.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-photon-bg rounded-xl p-3">
          <div className="text-xs text-photon-muted mb-1">Status</div>
          <div className={`font-semibold text-sm ${status?.enabled ? "text-photon-green" : "text-photon-red"}`}>
            {status?.enabled ? "Active" : "Stopped"}
          </div>
        </div>
        <div className="bg-photon-bg rounded-xl p-3">
          <div className="text-xs text-photon-muted mb-1">Kill Switch</div>
          <div className={`font-semibold text-sm ${status?.killSwitchActive ? "text-photon-red" : "text-photon-green"}`}>
            {status?.killSwitchActive ? "TRIGGERED" : "Normal"}
          </div>
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-photon-muted">Risk Parameters</div>
        <div className="bg-photon-bg rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-photon-muted">Max Trade Size</span>
            <span className="stat-number">{status?.maxTradeSize || "10"} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-photon-muted">Daily Loss Limit</span>
            <span className="stat-number">{status?.dailyLossLimit || "5"} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-photon-muted">Min Spread</span>
            <span className="stat-number">{status?.minSpread || "0.5"}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-photon-muted">Today&apos;s Loss</span>
            <span className={`stat-number ${(status?.dailyLoss || 0) > 0 ? "text-photon-red" : "text-photon-green"}`}>
              {status?.dailyLoss || "0"} ETH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
