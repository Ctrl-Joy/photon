"use client";

import { useState, useEffect, useRef } from "react";
import { getPrices } from "../lib/api";

const REFRESH_INTERVAL = 30_000; // 30 seconds

function SkeletonRow() {
  return (
    <tr className="border-b border-photon-border/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div
            className="h-4 animate-pulse rounded bg-photon-surface-raised"
            style={{ width: `${40 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function PriceComparison() {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  async function fetchPrices() {
    try {
      const data = await getPrices();
      setPrices(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
      setError(err.message || "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /**
   * Normalize the API response into a flat array of rows.
   * The API may return data in different shapes; we handle:
   *  - Array of { token, dex, price, change24h, spread }
   *  - Object keyed by token, each containing dex entries
   */
  function normalizeRows(data) {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.map((item) => ({
        token: item.token || item.symbol || "???",
        dex: item.dex || item.exchange || "Unknown",
        price: parseFloat(item.price || 0),
        change24h: parseFloat(item.change24h ?? item.change ?? 0),
        spread: parseFloat(item.spread ?? 0),
      }));
    }

    // Object shape: { ETH: [{ dex, price, ... }] }
    const rows = [];
    for (const [token, entries] of Object.entries(data)) {
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          rows.push({
            token,
            dex: entry.dex || entry.exchange || "Unknown",
            price: parseFloat(entry.price || 0),
            change24h: parseFloat(entry.change24h ?? entry.change ?? 0),
            spread: parseFloat(entry.spread ?? 0),
          });
        }
      }
    }
    return rows;
  }

  const rows = normalizeRows(prices);

  // Find best price per token (lowest for stables, highest for others)
  const bestPrices = {};
  for (const row of rows) {
    if (!bestPrices[row.token] || row.price > bestPrices[row.token]) {
      bestPrices[row.token] = row.price;
    }
  }

  return (
    <div className="surface-card flex w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-photon-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-photon-text">
          Price Comparison
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-photon-text-muted">
          <div className="live-dot" />
          <span>Auto-refreshing</span>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-2 px-4 py-8">
          <svg
            className="h-6 w-6 text-photon-negative"
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
              fetchPrices();
            }}
            className="mt-1 rounded-lg border border-photon-border px-3 py-1 text-xs text-photon-text-secondary transition-colors hover:border-photon-border-strong hover:text-photon-text"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-photon-border text-xs text-photon-text-muted">
                <th className="px-4 py-2.5 font-medium">Token</th>
                <th className="px-3 py-2.5 font-medium">DEX</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">24h</th>
                <th className="px-4 py-2.5 text-right font-medium">Spread</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-photon-text-muted"
                  >
                    No price data available
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const isBest = row.price === bestPrices[row.token];
                  return (
                    <tr
                      key={`${row.token}-${row.dex}-${i}`}
                      className="border-b border-photon-border/50 transition-colors hover:bg-photon-surface-raised/30"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-photon-text">
                          {row.token}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-photon-text-secondary">
                        {row.dex}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-num ${
                            isBest
                              ? "text-photon-positive"
                              : "text-photon-text-secondary"
                          }`}
                        >
                          $
                          {row.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-num ${
                            row.change24h >= 0
                              ? "text-photon-positive"
                              : "text-photon-negative"
                          }`}
                        >
                          {row.change24h >= 0 ? "+" : ""}
                          {row.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-num text-photon-text-muted">
                          {row.spread.toFixed(4)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
