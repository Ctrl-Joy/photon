"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBotStatus, toggleBot, updateRiskParams } from "../lib/api";

const POLL_INTERVAL_MS = 10_000;

function formatUptime(startTime) {
  if (!startTime) return "--";
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  if (diff < 0) return "--";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatusIndicator({ status }) {
  const s = status?.toLowerCase();
  if (s === "running" || s === "online") {
    return (
      <span className="flex items-center gap-2">
        <span className="live-dot" />
        <span className="text-sm font-medium text-photon-positive">Running</span>
      </span>
    );
  }
  if (s === "error") {
    return (
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-photon-negative shadow-[0_0_8px] shadow-photon-negative" />
        <span className="text-sm font-medium text-photon-negative">Error</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-photon-text-muted" />
      <span className="text-sm font-medium text-photon-text-muted">Stopped</span>
    </span>
  );
}

function RiskInput({ label, value, onChange, min, max, step, unit }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-photon-text-muted">{label}</label>
        <span className="font-num text-xs text-photon-text-secondary">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-photon-surface accent-photon-cyan outline-none
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-photon-cyan
          [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(99,240,224,0.4)]"
      />
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-photon-border/50 py-2 last:border-0">
      <span className="text-xs text-photon-text-muted">{label}</span>
      <span className="font-num text-sm text-photon-text">{value ?? "--"}</span>
    </div>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div className={`animate-pulse rounded-lg bg-photon-surface-raised ${className}`} />
  );
}

export default function BotControls() {
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uptimeStr, setUptimeStr] = useState("--");

  // Risk params local state
  const [riskParams, setRiskParams] = useState({
    maxTradeSize: 1000,
    minSpread: 0.5,
    maxSlippage: 1.0,
    stopLoss: 5.0,
  });
  const [paramsChanged, setParamsChanged] = useState(false);

  const pollRef = useRef(null);
  const uptimeRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getBotStatus();
      setBotStatus(data);
      // Sync risk params from server if not edited locally
      if (data.riskParams || data.risk_params) {
        const sp = data.riskParams || data.risk_params;
        setRiskParams((prev) => {
          if (!paramsChanged) {
            return {
              maxTradeSize: sp.maxTradeSize ?? sp.max_trade_size ?? prev.maxTradeSize,
              minSpread: sp.minSpread ?? sp.min_spread ?? prev.minSpread,
              maxSlippage: sp.maxSlippage ?? sp.max_slippage ?? prev.maxSlippage,
              stopLoss: sp.stopLoss ?? sp.stop_loss ?? prev.stopLoss,
            };
          }
          return prev;
        });
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load bot status");
    } finally {
      setLoading(false);
    }
  }, [paramsChanged]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  // Uptime ticker
  useEffect(() => {
    const isRunning =
      botStatus?.status === "running" || botStatus?.status === "online";
    if (isRunning && (botStatus?.startTime || botStatus?.start_time || botStatus?.uptime_since)) {
      const start = botStatus.startTime || botStatus.start_time || botStatus.uptime_since;
      setUptimeStr(formatUptime(start));
      uptimeRef.current = setInterval(() => {
        setUptimeStr(formatUptime(start));
      }, 1000);
    } else {
      setUptimeStr("--");
    }
    return () => clearInterval(uptimeRef.current);
  }, [botStatus]);

  async function handleToggle() {
    const isRunning =
      botStatus?.status === "running" || botStatus?.status === "online";
    setShowConfirm(false);
    setToggling(true);
    try {
      await toggleBot(!isRunning);
      await fetchStatus();
    } catch (err) {
      setError(err.message || "Failed to toggle bot");
    } finally {
      setToggling(false);
    }
  }

  async function handleSaveParams() {
    setSaving(true);
    try {
      await updateRiskParams(riskParams);
      setParamsChanged(false);
      await fetchStatus();
    } catch (err) {
      setError(err.message || "Failed to update parameters");
    } finally {
      setSaving(false);
    }
  }

  function updateParam(key, val) {
    setRiskParams((prev) => ({ ...prev, [key]: val }));
    setParamsChanged(true);
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-32" />
      </div>
    );
  }

  // Error state fallback (still show UI with error banner)
  const isRunning =
    botStatus?.status === "running" || botStatus?.status === "online";
  const stats = botStatus?.stats || botStatus?.statistics || {};

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-photon-negative/30 bg-photon-negative/5 px-3 py-2">
          <svg className="h-4 w-4 flex-shrink-0 text-photon-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-photon-negative">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchStatus();
            }}
            className="ml-auto text-xs text-photon-text-muted hover:text-photon-text"
          >
            Retry
          </button>
        </div>
      )}

      {/* Status header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-semibold text-photon-text">
            Arbitrage Bot
          </h3>
          <StatusIndicator status={botStatus?.status} />
        </div>
        {isRunning && (
          <div className="text-right">
            <p className="text-xs text-photon-text-muted">Uptime</p>
            <p className="font-num text-sm text-photon-text-secondary">
              {uptimeStr}
            </p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <div className="relative">
        {showConfirm ? (
          <div className="flex items-center gap-2 rounded-lg border border-photon-border bg-photon-surface-raised p-3">
            <p className="text-xs text-photon-text-secondary">
              {isRunning ? "Stop the bot?" : "Start the bot?"}
            </p>
            <button
              onClick={handleToggle}
              className={`ml-auto rounded-md px-3 py-1 text-xs font-semibold text-white ${
                isRunning ? "bg-photon-negative" : "bg-photon-positive"
              }`}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-md px-3 py-1 text-xs text-photon-text-muted hover:text-photon-text"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={toggling}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
              isRunning
                ? "border border-photon-negative/40 text-photon-negative hover:bg-photon-negative/10"
                : "bg-gradient-to-r from-photon-positive to-emerald-400 text-photon-bg hover:opacity-90"
            }`}
          >
            {toggling
              ? "Processing..."
              : isRunning
              ? "Stop Bot"
              : "Start Bot"}
          </button>
        )}
      </div>

      {/* Risk parameters */}
      <div className="surface-raised space-y-4 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-photon-text-muted">
          Risk Parameters
        </h4>
        <RiskInput
          label="Max Trade Size"
          value={riskParams.maxTradeSize}
          onChange={(v) => updateParam("maxTradeSize", v)}
          min={100}
          max={50000}
          step={100}
          unit=" USD"
        />
        <RiskInput
          label="Min Spread Threshold"
          value={riskParams.minSpread}
          onChange={(v) => updateParam("minSpread", v)}
          min={0.1}
          max={5}
          step={0.1}
          unit="%"
        />
        <RiskInput
          label="Max Slippage"
          value={riskParams.maxSlippage}
          onChange={(v) => updateParam("maxSlippage", v)}
          min={0.1}
          max={5}
          step={0.1}
          unit="%"
        />
        <RiskInput
          label="Stop Loss"
          value={riskParams.stopLoss}
          onChange={(v) => updateParam("stopLoss", v)}
          min={1}
          max={20}
          step={0.5}
          unit="%"
        />
        {paramsChanged && (
          <button
            onClick={handleSaveParams}
            disabled={saving}
            className="w-full rounded-lg bg-photon-blue/10 py-2 text-sm font-semibold text-photon-blue transition-colors hover:bg-photon-blue/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Parameters"}
          </button>
        )}
      </div>

      {/* Bot statistics */}
      <div className="surface-raised p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-photon-text-muted">
          Bot Statistics
        </h4>
        <StatItem
          label="Opportunities Scanned"
          value={stats.opportunitiesScanned ?? stats.opportunities_scanned}
        />
        <StatItem
          label="Trades Executed"
          value={stats.tradesExecuted ?? stats.trades_executed}
        />
        <StatItem
          label="Success Rate"
          value={
            (stats.successRate ?? stats.success_rate) != null
              ? `${Number(stats.successRate ?? stats.success_rate).toFixed(1)}%`
              : undefined
          }
        />
        <StatItem
          label="Total Profit"
          value={
            (stats.totalProfit ?? stats.total_profit) != null
              ? `$${Number(stats.totalProfit ?? stats.total_profit).toFixed(2)}`
              : undefined
          }
        />
        <StatItem
          label="Last Scan"
          value={
            (stats.lastScan ?? stats.last_scan)
              ? new Date(stats.lastScan ?? stats.last_scan).toLocaleTimeString()
              : undefined
          }
        />
      </div>
    </div>
  );
}
