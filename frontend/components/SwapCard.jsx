"use client";
import { useState, useEffect } from "react";
import { getSwapQuote, executeSwap } from "../lib/api";
import { connectWallet, getRouterContract, getTokenContract, parseAmount } from "../lib/contract";

const TOKENS = [
  { symbol: "WETH", name: "Wrapped Ether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "DAI", name: "Dai Stablecoin" },
];

export default function SwapCard() {
  const [tokenIn, setTokenIn] = useState("WETH");
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch quote when amount changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const q = await getSwapQuote(tokenIn, amountIn);
        setQuote(q);
      } catch (err) {
        console.error("Quote error:", err);
        setQuote(null);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [tokenIn, amountIn]);

  const handleSwap = async () => {
    if (!quote) return;
    setSwapping(true);
    setResult(null);
    try {
      const res = await executeSwap({
        tokenIn,
        amountIn: parseFloat(amountIn),
        minAmountOut: quote.bestQuote?.amountOut * 0.995 || 0,
        pool: quote.bestQuote?.pool || "",
      });
      setResult({ success: true, data: res });
      setAmountIn("");
      setQuote(null);
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setSwapping(false);
  };

  const tokenOut = tokenIn === "WETH" ? "USDC" : "WETH";

  return (
    <div className="card-glow bg-photon-card border border-photon-border rounded-2xl p-6 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Swap</h2>
        <span className="text-xs text-photon-muted bg-photon-bg rounded-lg px-2 py-1">
          Best Price
        </span>
      </div>

      {/* Token In */}
      <div className="bg-photon-bg rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-photon-muted">You pay</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-2xl font-semibold stat-number w-full outline-none placeholder:text-photon-muted/40"
          />
          <select
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            className="bg-photon-card border border-photon-border rounded-xl px-3 py-2 text-sm font-medium outline-none cursor-pointer"
          >
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center -my-1 relative z-10">
        <div className="bg-photon-card border border-photon-border rounded-xl p-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-photon-blue">
            <path d="M8 3v10M8 13l4-4M8 13l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Token Out */}
      <div className="bg-photon-bg rounded-xl p-4 mt-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-photon-muted">You receive</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold stat-number">
            {loading
              ? "..."
              : quote?.bestQuote?.amountOut
              ? parseFloat(quote.bestQuote.amountOut).toFixed(4)
              : "0.0"}
          </span>
          <span className="bg-photon-card border border-photon-border rounded-xl px-3 py-2 text-sm font-medium">
            {tokenOut}
          </span>
        </div>
      </div>

      {/* Quote Details */}
      {quote?.bestQuote && (
        <div className="bg-photon-bg rounded-xl p-3 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-photon-muted">
            <span>Best Route</span>
            <span className="text-white">{quote.bestQuote.poolName || "Pool"}</span>
          </div>
          <div className="flex justify-between text-photon-muted">
            <span>Price Impact</span>
            <span className="text-photon-green">&lt; 0.1%</span>
          </div>
          {quote.allQuotes && (
            <div className="flex justify-between text-photon-muted">
              <span>Pools Compared</span>
              <span className="text-white">{quote.allQuotes.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!quote || swapping || !amountIn}
        className="w-full bg-gradient-photon hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all"
      >
        {swapping
          ? "Swapping..."
          : !amountIn
          ? "Enter Amount"
          : !quote
          ? "Fetching Quote..."
          : "Swap"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`mt-4 p-3 rounded-xl text-sm ${
            result.success
              ? "bg-photon-green/10 border border-photon-green/30 text-photon-green"
              : "bg-photon-red/10 border border-photon-red/30 text-photon-red"
          }`}
        >
          {result.success
            ? `Swap executed! ${result.data?.txHash ? `TX: ${result.data.txHash.slice(0, 10)}...` : "Success (Demo Mode)"}`
            : `Error: ${result.error}`}
        </div>
      )}
    </div>
  );
}
