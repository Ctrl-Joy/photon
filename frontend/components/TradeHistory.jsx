"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getTradeHistory } from "../lib/api";

const PAGE_SIZE = 15;
const AUTO_REFRESH_MS = 30_000;

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function formatNum(val, decimals = 2) {
  if (val == null) return "--";
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function truncateHash(hash) {
  if (!hash) return "--";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function TypeBadge({ type }) {
  const isArb = type?.toLowerCase() === "arbitrage";
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
        isArb
          ? "bg-photon-cyan/10 text-photon-cyan"
          : "bg-photon-blue/10 text-photon-blue"
      }`}
    >
      {isArb ? "Arbitrage" : "Swap"}
    </span>
  );
}

function SideBadge({ side }) {
  const isBuy = side?.toLowerCase() === "buy";
  return (
    <span
      className={`text-xs font-semibold ${
        isBuy ? "text-photon-positive" : "text-photon-negative"
      }`}
    >
      {isBuy ? "Buy" : "Sell"}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  if (s === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-photon-positive">
        <span className="h-1.5 w-1.5 rounded-full bg-photon-positive" />
        Confirmed
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-photon-warning">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-photon-warning" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-photon-negative">
      <span className="h-1.5 w-1.5 rounded-full bg-photon-negative" />
      Failed
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-photon-border/50">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 animate-pulse rounded bg-photon-surface-raised" />
        </td>
      ))}
    </tr>
  );
}

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getTradeHistory(200);
      setTrades(Array.isArray(data) ? data : data?.trades || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  function handleLoadMore() {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 200);
  }

  // Loading state
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-photon-border text-xs text-photon-text-muted">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Pair</th>
              <th className="px-3 py-2 font-medium">Side</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">P&L</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <svg className="h-8 w-8 text-photon-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-photon-text-secondary">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="rounded-lg border border-photon-border px-4 py-1.5 text-sm font-medium text-photon-text-secondary transition-colors hover:bg-photon-surface-raised hover:text-photon-text"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <svg className="h-10 w-10 text-photon-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm text-photon-text-muted">No trades recorded yet.</p>
      </div>
    );
  }

  const visible = trades.slice(0, visibleCount);
  const hasMore = visibleCount < trades.length;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-photon-border text-xs text-photon-text-muted">
              <th className="whitespace-nowrap px-3 py-2 font-medium">Time</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Type</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Pair</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Side</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Amount</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Price</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Total</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-right">P&L</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((trade, idx) => {
              const pnl = trade.pnl ?? trade.profit;
              const pnlPositive = pnl != null && pnl >= 0;
              return (
                <tr
                  key={trade.id || trade.txHash || idx}
                  className="border-b border-photon-border/50 transition-colors hover:bg-photon-surface-raised/40"
                >
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className="text-xs text-photon-text-secondary"
                      title={new Date(
                        trade.time || trade.timestamp || trade.createdAt
                      ).toLocaleString()}
                    >
                      {relativeTime(
                        trade.time || trade.timestamp || trade.createdAt
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <TypeBadge type={trade.type} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-photon-text">
                    {trade.pair || `${trade.tokenIn || "--"}/${trade.tokenOut || "--"}`}
                  </td>
                  <td className="px-3 py-2.5">
                    <SideBadge side={trade.side} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-num text-sm text-photon-text">
                    {formatNum(trade.amount, 4)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-num text-sm text-photon-text-secondary">
                    ${formatNum(trade.price)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-num text-sm text-photon-text">
                    ${formatNum(trade.total)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-num text-sm font-medium ${
                      pnl == null
                        ? "text-photon-text-muted"
                        : pnlPositive
                        ? "text-photon-positive"
                        : "text-photon-negative"
                    }`}
                  >
                    {pnl != null
                      ? `${pnlPositive ? "+" : ""}$${formatNum(pnl)}`
                      : "--"}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={trade.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {trade.txHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${trade.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-num text-xs text-photon-blue transition-colors hover:text-photon-cyan"
                      >
                        {truncateHash(trade.txHash)}
                      </a>
                    ) : (
                      <span className="text-xs text-photon-text-muted">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg border border-photon-border px-5 py-2 text-sm font-medium text-photon-text-secondary transition-colors hover:bg-photon-surface-raised hover:text-photon-text disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
