"use client";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

export default function PriceComparison() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const socket = getSocket();
    socket.on("priceUpdate", (data) => {
      if (data?.prices) setPrices(data.prices);
    });
    return () => socket.off("priceUpdate");
  }, []);

  const tokens = Object.keys(prices);

  if (tokens.length === 0) {
    return (
      <div className="bg-photon-surface border border-photon-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[14px] font-semibold text-photon-text font-heading">Live Prices</span>
          <div className="live-dot" />
        </div>
        <div className="text-photon-text-muted text-[13px] text-center py-8">
          Connecting to price feed...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-photon-surface border border-photon-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[14px] font-semibold text-photon-text font-heading">Live Prices</span>
        <div className="live-dot" />
      </div>

      <div className="space-y-3">
        {tokens.map((token) => {
          const dexPrices = prices[token];
          const dexNames = Object.keys(dexPrices);
          const priceValues = Object.values(dexPrices);
          const minPrice = Math.min(...priceValues);
          const maxPrice = Math.max(...priceValues);
          const spread = maxPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(3) : "0";

          return (
            <div key={token} className="bg-photon-bg-elevated rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13px] font-semibold text-photon-text font-heading">{token}</span>
                <span
                  className={`text-[11px] font-num px-2 py-0.5 rounded-md ${
                    parseFloat(spread) > 0.5
                      ? "bg-photon-positive/10 text-photon-positive"
                      : "bg-photon-border text-photon-text-muted"
                  }`}
                >
                  {spread}% spread
                </span>
              </div>
              <div className="space-y-1.5">
                {dexNames.map((dex) => {
                  const price = dexPrices[dex];
                  const isBest = price === minPrice && priceValues.length > 1;
                  return (
                    <div key={dex} className="flex items-center justify-between text-[12px]">
                      <span className="text-photon-text-muted">{dex}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-num text-photon-text">
                          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {isBest && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-photon-positive/10 text-photon-positive uppercase tracking-wide">
                            Best
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
