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
      <div className="bg-photon-card border border-photon-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Live Prices</h3>
        <div className="text-photon-muted text-sm text-center py-8">
          <div className="live-dot mx-auto mb-3" />
          Connecting to price feed...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-photon-card border border-photon-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Live Prices</h3>
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
            <div key={token} className="bg-photon-bg rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{token}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    parseFloat(spread) > 0.5
                      ? "bg-photon-green/10 text-photon-green"
                      : "bg-photon-muted/10 text-photon-muted"
                  }`}
                >
                  Spread: {spread}%
                </span>
              </div>
              <div className="space-y-1">
                {dexNames.map((dex) => {
                  const price = dexPrices[dex];
                  const isBest = price === minPrice && priceValues.length > 1;
                  return (
                    <div key={dex} className="flex items-center justify-between text-sm">
                      <span className="text-photon-muted">{dex}</span>
                      <div className="flex items-center gap-2">
                        <span className="stat-number">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        {isBest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-photon-green/10 text-photon-green">
                            BEST
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
