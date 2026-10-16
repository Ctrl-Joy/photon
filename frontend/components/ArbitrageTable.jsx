"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getOpportunities,
  simulateArbitrage,
  executeArbitrage,
} from "../lib/api";

const REFRESH_INTERVAL = 15_000; // 15 seconds

const STATUS_STYLES = {
  active: "bg-photon-positive/10 text-photon-positive border-photon-positive/20",
  stale: "bg-photon-warning/10 text-photon-warning border-photon-warning/20",
  executing:
    "bg-photon-blue/10 text-photon-blue border-photon-blue/20",
};

function StatusBadge({ status }) {
  const s = (status || "active").toLowerCase();
  const style = STATUS_STYLES[s] || STATUS_STYLES.active;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {s === "executing" && (
        <span className="mr-1 inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {s}
    </span>
  );
}

function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="border-b border-photon-border/50">
      {Array.from({ length: 8 }).map((_, j) => (
        <td key={j} className="px-3 py-3">
          <div
            className="h-4 animate-pulse rounded bg-photon-surface-raised"
            style={{
              width: `${30 + Math.random() * 50}%`,
              animationDelay: `${j * 80}ms`,
            }}
          />
        </td>
      ))}
    </tr>
  ));
}

/* ── Route Detail Panel ── */
function RouteDetail({ opportunity, onClose }) {
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSimulate() {
    setSimulating(true);
    setError(null);
    setSimResult(null);
    try {
      const result = await simulateArbitrage({
        id: opportunity.id,
        pair: opportunity.pair,
        buyDex: opportunity.buyDex,
        sellDex: opportunity.sellDex,
      });
      setSimResult(result);
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  async function handleExecute() {
    setExecuting(true);
    setError(null);
    setExecResult(null);
    try {
      const result = await executeArbitrage({
        id: opportunity.id,
        pair: opportunity.pair,
        buyDex: opportunity.buyDex,
        sellDex: opportunity.sellDex,
        amount: opportunity.suggestedAmount || "1",
      });
      setExecResult(result);
    } catch (err) {
      setError(err.message || "Execution failed");
    } finally {
      setExecuting(false);
    }
  }

  const opp = opportunity;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="border-t border-photon-border bg-photon-bg-elevated px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-heading text-sm font-semibold text-photon-text">
            Route Detail
          </h4>
          <button
            onClick={onClose}
            className="text-photon-text-muted transition-colors hover:text-photon-text"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Route SVG diagram */}
        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-photon-border bg-photon-bg p-4">
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-photon-positive/30 bg-photon-positive/10 px-3 py-1.5 text-xs font-semibold text-photon-positive">
              {opp.buyDex || "DEX A"}
            </div>
            <span className="mt-1 text-[10px] text-photon-text-muted">Buy</span>
          </div>

          <svg className="h-6 w-16 flex-shrink-0 text-photon-text-muted" viewBox="0 0 64 24" fill="none">
            <path d="M0 12h52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d="M48 6l8 6-8 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>

          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-photon-blue/30 bg-photon-blue/10 px-3 py-1.5 text-xs font-semibold text-photon-blue">
              {opp.pair || "TOKEN"}
            </div>
            <span className="mt-1 text-[10px] text-photon-text-muted">Asset</span>
          </div>

          <svg className="h-6 w-16 flex-shrink-0 text-photon-text-muted" viewBox="0 0 64 24" fill="none">
            <path d="M0 12h52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d="M48 6l8 6-8 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>

          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-photon-negative/30 bg-photon-negative/10 px-3 py-1.5 text-xs font-semibold text-photon-negative">
              {opp.sellDex || "DEX B"}
            </div>
            <span className="mt-1 text-[10px] text-photon-text-muted">Sell</span>
          </div>
        </div>

        {/* Details grid */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailItem label="Gross Spread" value={`${parseFloat(opp.spread || 0).toFixed(4)}%`} />
          <DetailItem label="Buy Price" value={`$${parseFloat(opp.buyPrice || 0).toFixed(6)}`} />
          <DetailItem label="Sell Price" value={`$${parseFloat(opp.sellPrice || 0).toFixed(6)}`} />
          <DetailItem label="Est. Profit" value={opp.profit ? `$${parseFloat(opp.profit).toFixed(2)}` : "--"} positive />
          <DetailItem label="Est. Gas" value={opp.estimatedGas || "--"} />
          <DetailItem label="Confidence" value={opp.confidence ? `${(opp.confidence * 100).toFixed(0)}%` : opp.score ? `${opp.score}/100` : "--"} />
        </div>

        {/* Risk indicators */}
        {opp.riskLevel && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-photon-text-muted">Risk:</span>
            <span
              className={`font-num text-xs font-semibold ${
                opp.riskLevel === "low"
                  ? "text-photon-positive"
                  : opp.riskLevel === "medium"
                    ? "text-photon-warning"
                    : "text-photon-negative"
              }`}
            >
              {opp.riskLevel.toUpperCase()}
            </span>
          </div>
        )}

        {/* Simulation result */}
        {simResult && (
          <div className="mb-3 rounded-lg border border-photon-blue/20 bg-photon-blue/5 p-3">
            <div className="mb-1 text-xs font-semibold text-photon-blue">
              Simulation Result
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {simResult.netProfit != null && (
                <div>
                  <span className="text-photon-text-muted">Net Profit: </span>
                  <span className="font-num text-photon-positive">
                    ${parseFloat(simResult.netProfit).toFixed(4)}
                  </span>
                </div>
              )}
              {simResult.gasCost != null && (
                <div>
                  <span className="text-photon-text-muted">Gas Cost: </span>
                  <span className="font-num text-photon-text-secondary">
                    ${parseFloat(simResult.gasCost).toFixed(4)}
                  </span>
                </div>
              )}
              {simResult.success != null && (
                <div>
                  <span className="text-photon-text-muted">Feasible: </span>
                  <span
                    className={
                      simResult.success
                        ? "text-photon-positive"
                        : "text-photon-negative"
                    }
                  >
                    {simResult.success ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution result */}
        {execResult && (
          <div className="mb-3 rounded-lg border border-photon-positive/20 bg-photon-positive/5 p-3">
            <div className="mb-1 text-xs font-semibold text-photon-positive">
              Execution Result
            </div>
            <div className="text-xs text-photon-text-secondary">
              {execResult.txHash
                ? `TX: ${execResult.txHash}`
                : JSON.stringify(execResult)}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-lg border border-photon-negative/20 bg-photon-negative/5 px-3 py-2 text-xs text-photon-negative">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 rounded-lg border border-photon-border bg-photon-surface px-3 py-2 text-xs font-medium text-photon-text-secondary transition-colors hover:border-photon-blue hover:text-photon-blue disabled:opacity-50"
          >
            {simulating && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Simulate
          </button>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-photon px-3 py-2 text-xs font-semibold text-photon-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {executing && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-photon-bg border-t-transparent" />
            )}
            Execute
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DetailItem({ label, value, positive = false }) {
  return (
    <div className="rounded-lg border border-photon-border bg-photon-surface p-2">
      <div className="text-[10px] text-photon-text-muted">{label}</div>
      <div
        className={`font-num text-sm font-medium ${
          positive ? "text-photon-positive" : "text-photon-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Column sorting ── */
const COLUMNS = [
  { key: "pair", label: "Pair", align: "left" },
  { key: "buyDex", label: "Buy DEX", align: "left" },
  { key: "sellDex", label: "Sell DEX", align: "left" },
  { key: "buyPrice", label: "Buy Price", align: "right", numeric: true },
  { key: "sellPrice", label: "Sell Price", align: "right", numeric: true },
  { key: "spread", label: "Spread", align: "right", numeric: true },
  { key: "profit", label: "Est. Profit", align: "right", numeric: true },
  { key: "status", label: "Status", align: "center" },
];

function sortData(data, sortKey, sortDir) {
  if (!sortKey) return data;
  return [...data].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    // Numeric comparison
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (col?.numeric) {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    } else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

/* ── Main Component ── */
export default function ArbitrageTable() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState("spread");
  const [sortDir, setSortDir] = useState("desc");
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getOpportunities();
      setOpportunities(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
      setError(err.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handleRowClick(opp) {
    setSelectedId((prev) => (prev === opp.id ? null : opp.id));
  }

  const sorted = sortData(opportunities, sortKey, sortDir);

  // Loading state
  if (loading) {
    return (
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-photon-border">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-xs font-medium text-photon-text-muted ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRows count={5} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 px-6 py-12">
        <svg
          className="h-10 w-10 text-photon-negative"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <span className="text-sm text-photon-text-secondary">{error}</span>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="rounded-lg border border-photon-border px-4 py-2 text-sm text-photon-text-secondary transition-colors hover:border-photon-border-strong hover:text-photon-text"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (sorted.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 px-6 py-12">
        <svg
          className="h-10 w-10 text-photon-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <span className="text-sm text-photon-text-secondary">
          No arbitrage opportunities detected.
        </span>
        <span className="text-xs text-photon-text-muted">
          The scanner is monitoring markets.
        </span>
        <div className="flex items-center gap-1.5 text-xs text-photon-text-muted">
          <div className="live-dot" />
          <span>Scanning...</span>
        </div>
      </div>
    );
  }

  // Data table
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-photon-border">
              {COLUMNS.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`cursor-pointer select-none px-3 py-3 text-xs font-medium transition-colors hover:text-photon-text ${
                      isActive ? "text-photon-blue" : "text-photon-text-muted"
                    } ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive && (
                        <svg
                          className={`h-3 w-3 transition-transform ${
                            sortDir === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      )}
                    </span>
                  </th>
                );
              })}
              <th className="px-3 py-3 text-center text-xs font-medium text-photon-text-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp, i) => {
              const isSelected = selectedId === opp.id;
              const spreadVal = parseFloat(opp.spread || 0);
              return (
                <Fragment key={opp.id || i}>
                  <tr
                    onClick={() => handleRowClick(opp)}
                    className={`cursor-pointer border-b border-photon-border/50 transition-colors ${
                      isSelected
                        ? "bg-photon-surface-raised/50"
                        : "hover:bg-photon-surface-raised/30"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-photon-text">
                      {opp.pair || "--"}
                    </td>
                    <td className="px-3 py-3 text-photon-text-secondary">
                      {opp.buyDex || "--"}
                    </td>
                    <td className="px-3 py-3 text-photon-text-secondary">
                      {opp.sellDex || "--"}
                    </td>
                    <td className="px-3 py-3 text-right font-num text-photon-text-secondary">
                      ${parseFloat(opp.buyPrice || 0).toFixed(6)}
                    </td>
                    <td className="px-3 py-3 text-right font-num text-photon-text-secondary">
                      ${parseFloat(opp.sellPrice || 0).toFixed(6)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`font-num font-medium ${
                          spreadVal > 0
                            ? "text-photon-positive"
                            : spreadVal < 0
                              ? "text-photon-negative"
                              : "text-photon-text-muted"
                        }`}
                      >
                        {spreadVal > 0 ? "+" : ""}
                        {spreadVal.toFixed(4)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-num text-photon-positive">
                      {opp.profit
                        ? `$${parseFloat(opp.profit).toFixed(2)}`
                        : "--"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(opp);
                        }}
                        className="rounded-lg border border-photon-border px-2.5 py-1 text-xs text-photon-text-secondary transition-colors hover:border-photon-blue hover:text-photon-blue"
                      >
                        {isSelected ? "Close" : "Details"}
                      </button>
                    </td>
                  </tr>

                  {/* Expandable route detail */}
                  <AnimatePresence>
                    {isSelected && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <RouteDetail
                            opportunity={opp}
                            onClose={() => setSelectedId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Refresh indicator */}
      <div className="flex items-center justify-between border-t border-photon-border px-4 py-2">
        <span className="text-xs text-photon-text-muted">
          {sorted.length} opportunit{sorted.length === 1 ? "y" : "ies"} found
        </span>
        <div className="flex items-center gap-1.5 text-xs text-photon-text-muted">
          <div className="live-dot" />
          <span>Refreshing every 15s</span>
        </div>
      </div>
    </div>
  );
}

