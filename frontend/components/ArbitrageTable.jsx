"use client";
import { useEffect, useState } from "react";
import { getOpportunities, executeArbitrage, simulateArbitrage } from "../lib/api";
import { getSocket } from "../lib/socket";

export default function ArbitrageTable() {
  const [opportunities, setOpportunities] = useState([]);
  const [executing, setExecuting] = useState(null);
  const [results, setResults] = useState({});

  // Load initial opportunities
  useEffect(() => {
    getOpportunities().then(setOpportunities).catch(console.error);
  }, []);

  // Live arb alerts
  useEffect(() => {
    const socket = getSocket();
    socket.on("arbAlert", (data) => {
      setOpportunities((prev) => {
        const updated = [data, ...prev.filter((o) => o.id !== data.id)];
        return updated.slice(0, 20);
      });
    });
    return () => socket.off("arbAlert");
  }, []);

  const handleExecute = async (opp) => {
    setExecuting(opp.id);
    try {
      const res = await executeArbitrage({
        buyDex: opp.buyDex,
        sellDex: opp.sellDex,
        token: opp.token,
        amount: opp.suggestedAmount || 1,
      });
      setResults((prev) => ({ ...prev, [opp.id]: { success: true, data: res } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [opp.id]: { success: false, error: err.message } }));
    }
    setExecuting(null);
  };

  const handleSimulate = async (opp) => {
    setExecuting(opp.id);
    try {
      const res = await simulateArbitrage({
        buyDex: opp.buyDex,
        sellDex: opp.sellDex,
        token: opp.token,
        amount: opp.suggestedAmount || 1,
      });
      setResults((prev) => ({ ...prev, [opp.id]: { success: true, data: res, simulated: true } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [opp.id]: { success: false, error: err.message } }));
    }
    setExecuting(null);
  };

  return (
    <div className="bg-photon-card border border-photon-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-photon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Arbitrage Opportunities</h3>
            <div className="live-dot" />
          </div>
          <span className="text-xs text-photon-muted bg-photon-bg rounded-lg px-2 py-1">
            {opportunities.length} found
          </span>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="p-10 text-center text-photon-muted">
          <p className="text-lg mb-1">Scanning for opportunities...</p>
          <p className="text-sm">Arbitrage opportunities appear when price spreads exceed 0.5%</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-photon-muted text-xs border-b border-photon-border">
                <th className="text-left px-6 py-3 font-medium">Token</th>
                <th className="text-left px-6 py-3 font-medium">Buy DEX</th>
                <th className="text-left px-6 py-3 font-medium">Sell DEX</th>
                <th className="text-right px-6 py-3 font-medium">Spread</th>
                <th className="text-right px-6 py-3 font-medium">Est. Profit</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, i) => (
                <tr
                  key={opp.id || i}
                  className="border-b border-photon-border/50 hover:bg-photon-bg/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold">{opp.token}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-photon-green">{opp.buyDex}</div>
                      <div className="text-photon-muted text-xs stat-number">
                        ${parseFloat(opp.buyPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-photon-red">{opp.sellDex}</div>
                      <div className="text-photon-muted text-xs stat-number">
                        ${parseFloat(opp.sellPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-photon-green stat-number">
                      {parseFloat(opp.spreadPercent).toFixed(3)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="stat-number text-photon-green">
                      ${parseFloat(opp.estimatedProfit || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSimulate(opp)}
                        disabled={executing === opp.id}
                        className="text-xs bg-photon-bg border border-photon-border hover:border-photon-blue/50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        Simulate
                      </button>
                      <button
                        onClick={() => handleExecute(opp)}
                        disabled={executing === opp.id}
                        className="text-xs bg-gradient-photon hover:opacity-90 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {executing === opp.id ? "..." : "Execute"}
                      </button>
                    </div>
                    {results[opp.id] && (
                      <div
                        className={`mt-2 text-xs ${
                          results[opp.id].success ? "text-photon-green" : "text-photon-red"
                        }`}
                      >
                        {results[opp.id].success
                          ? results[opp.id].simulated
                            ? `Sim: $${results[opp.id].data?.profit?.toFixed(2) || "N/A"} profit`
                            : "Executed!"
                          : results[opp.id].error}
                      </div>
                    )}
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
