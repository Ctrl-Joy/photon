"use client";
import { useEffect, useState } from "react";
import { getTradeHistory } from "../lib/api";

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await getTradeHistory(20);
        setTrades(t || []);
      } catch {
        // Use demo data
        setTrades(generateDemoTrades());
      }
      setLoading(false);
    }
    load();
  }, []);

  function generateDemoTrades() {
    const types = ["SWAP", "ARBITRAGE"];
    const pairs = ["WETH/USDC", "USDC/DAI", "WETH/DAI"];
    const dexes = ["UniPool", "SushiPool", "CurvePool"];
    const arr = [];
    for (let i = 0; i < 10; i++) {
      arr.push({
        id: i,
        type: types[Math.floor(Math.random() * 2)],
        pair: pairs[Math.floor(Math.random() * 3)],
        dex: dexes[Math.floor(Math.random() * 3)],
        amountIn: (Math.random() * 5 + 0.1).toFixed(4),
        amountOut: (Math.random() * 10000 + 100).toFixed(2),
        profit: ((Math.random() - 0.3) * 0.5).toFixed(4),
        gasUsed: (Math.random() * 0.005 + 0.001).toFixed(5),
        txHash: `0x${Math.random().toString(16).slice(2, 14)}...`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        status: Math.random() > 0.1 ? "SUCCESS" : "REVERTED",
      });
    }
    return arr;
  }

  return (
    <div className="bg-photon-card border border-photon-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-photon-border">
        <h3 className="text-lg font-semibold">Trade History</h3>
      </div>

      {loading ? (
        <div className="p-10 text-center text-photon-muted">Loading trades...</div>
      ) : trades.length === 0 ? (
        <div className="p-10 text-center text-photon-muted">
          <p>No trades yet. Start swapping or run the arbitrage bot!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-photon-muted text-xs border-b border-photon-border">
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-left px-6 py-3 font-medium">Pair</th>
                <th className="text-right px-6 py-3 font-medium">Amount</th>
                <th className="text-right px-6 py-3 font-medium">Profit</th>
                <th className="text-right px-6 py-3 font-medium">Gas</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={t.id || i}
                  className="border-b border-photon-border/50 hover:bg-photon-bg/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        t.type === "ARBITRAGE"
                          ? "bg-photon-purple/10 text-photon-purple"
                          : "bg-photon-blue/10 text-photon-blue"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium">{t.pair}</td>
                  <td className="px-6 py-3 text-right stat-number">{t.amountIn}</td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`stat-number ${
                        parseFloat(t.profit) >= 0 ? "text-photon-green" : "text-photon-red"
                      }`}
                    >
                      {parseFloat(t.profit) >= 0 ? "+" : ""}
                      {t.profit}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right stat-number text-photon-muted">
                    {t.gasUsed}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs ${
                        t.status === "SUCCESS" ? "text-photon-green" : "text-photon-red"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-photon-muted text-xs">
                    {new Date(t.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
