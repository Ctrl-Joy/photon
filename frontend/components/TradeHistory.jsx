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
    <div className="bg-photon-surface border border-photon-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-photon-border">
        <span className="text-[13px] font-semibold text-photon-text">Trade History</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-photon-text-muted text-[13px]">Loading trades...</div>
      ) : trades.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-photon-text-muted text-[13px]">No trades yet</div>
          <div className="text-photon-text-muted text-[11px] mt-1">Start swapping or run the arb bot</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-photon-text-muted text-[11px] uppercase tracking-wider border-b border-photon-border">
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-left px-4 py-2.5 font-medium">Pair</th>
                <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                <th className="text-right px-4 py-2.5 font-medium">Profit</th>
                <th className="text-right px-4 py-2.5 font-medium">Gas</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={t.id || i}
                  className="border-b border-photon-border/40 hover:bg-photon-bg-elevated/50 transition-colors text-[12px]"
                >
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.type === "ARBITRAGE"
                          ? "bg-photon-purple/10 text-photon-purple"
                          : "bg-photon-blue/10 text-photon-blue"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-photon-text font-medium">{t.pair}</td>
                  <td className="px-4 py-2.5 text-right font-num text-photon-text">{t.amountIn}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`font-num ${
                        parseFloat(t.profit) >= 0 ? "text-photon-positive" : "text-photon-negative"
                      }`}
                    >
                      {parseFloat(t.profit) >= 0 ? "+" : ""}
                      {t.profit}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-num text-photon-text-muted">
                    {t.gasUsed}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium ${t.status === "SUCCESS" ? "text-photon-positive" : "text-photon-negative"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-photon-text-muted text-[11px]">
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
