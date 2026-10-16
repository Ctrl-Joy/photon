"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import TradingChart from "../../components/TradingChart";
import SwapCard from "../../components/SwapCard";
import PriceComparison from "../../components/PriceComparison";
import { getPrices } from "../../lib/api";

const DEFAULT_TOKEN = "ETH";
const DEFAULT_PAIR = "USDC";
const DEFAULT_DEX = "uniswap";

export default function SwapPage() {
  const [headerPrice, setHeaderPrice] = useState(null);
  const [headerChange, setHeaderChange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchHeaderPrice() {
      try {
        const data = await getPrices();
        if (!mounted) return;

        // Try to extract ETH price from response
        if (Array.isArray(data)) {
          const ethEntry = data.find(
            (d) => (d.token || d.symbol) === DEFAULT_TOKEN
          );
          if (ethEntry) {
            setHeaderPrice(parseFloat(ethEntry.price));
            setHeaderChange(parseFloat(ethEntry.change24h ?? ethEntry.change ?? 0));
          }
        } else if (data && typeof data === "object") {
          const entries = data[DEFAULT_TOKEN];
          if (Array.isArray(entries) && entries.length > 0) {
            setHeaderPrice(parseFloat(entries[0].price));
            setHeaderChange(parseFloat(entries[0].change24h ?? entries[0].change ?? 0));
          }
        }
      } catch {
        // Silently fail - header price is optional
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchHeaderPrice();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-photon-bg">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 pb-4 pt-20 sm:px-6">
        {/* Token pair header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="token-icon"
              style={{ backgroundColor: "#627EEA20", color: "#627EEA" }}
            >
              ET
            </div>
            <h1 className="font-heading text-xl font-semibold text-photon-text">
              {DEFAULT_TOKEN} / {DEFAULT_PAIR}
            </h1>
          </div>

          {!loading && headerPrice != null && (
            <div className="flex items-center gap-3">
              <span className="font-num text-xl font-medium text-photon-text">
                $
                {headerPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {headerChange != null && (
                <span
                  className={`font-num text-sm ${
                    headerChange >= 0
                      ? "text-photon-positive"
                      : "text-photon-negative"
                  }`}
                >
                  {headerChange >= 0 ? "+" : ""}
                  {headerChange.toFixed(2)}%
                </span>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 animate-pulse rounded bg-photon-surface-raised" />
              <div className="h-4 w-14 animate-pulse rounded bg-photon-surface-raised" />
            </div>
          )}
        </div>

        {/* Main grid: Chart + SwapCard side by side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Chart panel - takes 3/5 on desktop */}
          <div className="surface-card overflow-hidden lg:col-span-3">
            <div className="h-[400px] sm:h-[480px] lg:h-[520px]">
              <TradingChart token={DEFAULT_TOKEN} dex={DEFAULT_DEX} />
            </div>
          </div>

          {/* Swap panel - takes 2/5 on desktop */}
          <div className="lg:col-span-2">
            <SwapCard />
          </div>
        </div>

        {/* Price comparison - full width below */}
        <div className="mt-4">
          <PriceComparison />
        </div>
      </main>
    </div>
  );
}
