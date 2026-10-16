"use client";
import { useEffect, useState } from "react";
import { getOpportunities, executeArbitrage, simulateArbitrage } from "../lib/api";
import { getSocket } from "../lib/socket";

export default function ArbitrageTable() {
  const [opportunities, setOpportunities] = useState([]);
  const [executing, setExecuting] = useState(null);
  const [results, setResults] = useState({});

  useEffect(() => {
    getOpportunities().then(setOpportunities).catch(console.error);
  }, []);

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
    <div className="bg-photon-surface border border-photon-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-photon-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-photon-text font-heading">Arbitrage Opportunities</span>
          <div className="live-dot" />
        </div>
        <span className="text-[11px] font-num text-photon-text-muted bg-photon-bg-elevated rounded-md px-2 py-0.5">
          {opportunities.length} found
        </span>
      </div>

      {opportunities.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <div className="text-photon-text-muted text-[13px] mb-1">Scanning for opportunities...</div>
          <div className="text-photon-text-muted/60 text-[11px]">Arb alerts appear when spreads exceed 0.5%</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-photon-text-muted text-[11px] uppercase tracking-wider border-b border-photon-border">
                <th className="text-left px-4 py-2.5 font-medium">Token</th>
                <th className="text-left px-4 py-2.5 font-medium">Buy</th>
                <th className="text-left px-4 py-2.5 font-medium">Sell</th>
                <th className="text-right px-4 py-2.5 font-medium">Spread</th>
                <th className="text-right px-4 py-2.5 font-medium">Est. Profit</th>
                <th className="text-right px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, i) => (
                <tr
                  key={opp.id || i}
                  className="border-b border-photon-border/50 hover:bg-photon-bg-elevated/50 transition-colors text-[13px]"
                >
                  <td className="px-4 py-3 font-semibold text-photon-text font-heading">{opp.token}</td>
                  <td className="px-4 py-3">
                    <div className="text-photon-positive text-[12px] font-medium">{opp.buyDex}</div>
                    <div className="text-photon-text-muted text-[11px] font-num">
                      ${parseFloat(opp.buyPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-photon-negative text-[12px] font-medium">{opp.sellDex}</div>
                    <div className="text-photon-text-muted text-[11px] font-num">
                      ${parseFloat(opp.sellPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-photon-positive font-num text-[12px]">
                      {parseFloat(opp.spreadPercent).toFixed(3)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-num text-photon-positive text-[12px]">
                      ${parseFloat(opp.estimatedProfit || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSimulate(opp)}
                        disabled={executing === opp.id}
                        className="text-[11px] font-medium text-photon-text-muted hover:text-photon-text bg-photon-bg-elevated hover:bg-photon-surface-raised border border-photon-border px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => handleExecute(opp)}
                        disabled={executing === opp.id}
                        className="text-[11px] font-medium text-white bg-photon-blue hover:bg-photon-blue/80 px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                      >
                        {executing === opp.id ? "..." : "Execute"}
                      </button>
                    </div>
                    {results[opp.id] && (
                      <div className={`mt-1 text-[10px] ${results[opp.id].success ? "text-photon-positive" : "text-photon-negative"}`}>
                        {results[opp.id].success
                          ? results[opp.id].simulated
                            ? `Sim: $${results[opp.id].data?.profit?.toFixed(2) || "N/A"}`
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
