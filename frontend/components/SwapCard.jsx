"use client";
import { useState, useEffect } from "react";
import { getSwapQuote, executeSwap } from "../lib/api";
import { connectWallet, getRouterContract, getTokenContract, parseAmount } from "../lib/contract";

const TOKENS = [
  { symbol: "WETH", name: "Wrapped Ether", color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", color: "#2775CA" },
  { symbol: "DAI", name: "Dai Stablecoin", color: "#F5AC37" },
];

function TokenIcon({ symbol }) {
  const token = TOKENS.find((t) => t.symbol === symbol);
  return (
    <div
      className="token-icon"
      style={{ background: token?.color || "#333" }}
    >
      {symbol?.[0]}
    </div>
  );
}

export default function SwapCard() {
  const [tokenIn, setTokenIn] = useState("WETH");
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch quote on amount change
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
    <div className="w-full max-w-[420px] mx-auto">
      {/* Card */}
      <div className="bg-dex-surface border border-dex-border rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold text-white">Swap</span>
          <button className="text-dex-muted hover:text-white transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>

        {/* You Pay */}
        <div className="bg-dex-card rounded-xl p-4 mb-1">
          <div className="text-[13px] text-dex-muted mb-2">You pay</div>
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0"
              className="bg-transparent text-[28px] font-medium text-white w-full outline-none placeholder:text-dex-dimmed font-num"
            />
            <div className="flex items-center gap-2 bg-dex-elevated hover:bg-dex-border-light rounded-xl px-3 py-2 cursor-pointer transition-colors flex-shrink-0">
              <TokenIcon symbol={tokenIn} />
              <select
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
                className="bg-transparent text-white text-[14px] font-semibold outline-none cursor-pointer appearance-none pr-4"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2372768F' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
              >
                {TOKENS.map((t) => (
                  <option key={t.symbol} value={t.symbol} className="bg-dex-card">
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="bg-dex-surface border-4 border-dex-surface rounded-xl p-1.5">
            <div className="bg-dex-card rounded-lg p-1.5 hover:bg-dex-elevated transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#72768F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* You Receive */}
        <div className="bg-dex-card rounded-xl p-4 mb-3">
          <div className="text-[13px] text-dex-muted mb-2">You receive</div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[28px] font-medium font-num text-white">
              {loading
                ? "..."
                : quote?.bestQuote?.amountOut
                ? parseFloat(quote.bestQuote.amountOut).toFixed(4)
                : "0"}
            </span>
            <div className="flex items-center gap-2 bg-dex-elevated rounded-xl px-3 py-2 flex-shrink-0">
              <TokenIcon symbol={tokenOut} />
              <span className="text-[14px] font-semibold text-white">{tokenOut}</span>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {quote?.bestQuote && (
          <div className="space-y-2 mb-3 px-1">
            <div className="flex justify-between text-[13px]">
              <span className="text-dex-muted">Route</span>
              <span className="text-white">{quote.bestQuote.poolName || "Best Pool"}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-dex-muted">Price impact</span>
              <span className="text-dex-green">&lt; 0.1%</span>
            </div>
            {quote.allQuotes && (
              <div className="flex justify-between text-[13px]">
                <span className="text-dex-muted">Pools checked</span>
                <span className="text-white">{quote.allQuotes.length}</span>
              </div>
            )}
          </div>
        )}

        {/* Swap Button — 1inch style blue */}
        <button
          onClick={handleSwap}
          disabled={!quote || swapping || !amountIn}
          className={`w-full font-semibold py-3.5 rounded-xl text-[15px] transition-all ${
            !amountIn
              ? "bg-dex-card text-dex-dimmed cursor-not-allowed"
              : !quote
              ? "bg-dex-card text-dex-muted cursor-wait"
              : "bg-dex-blue hover:bg-dex-blue-hover text-white cursor-pointer"
          } disabled:opacity-60`}
        >
          {swapping
            ? "Swapping..."
            : !amountIn
            ? "Enter an amount"
            : !quote
            ? loading
              ? "Finding best price..."
              : "Enter an amount"
            : "Swap"}
        </button>
      </div>

      {/* Result toast */}
      {result && (
        <div
          className={`mt-3 p-3 rounded-xl text-[13px] border animate-fade-in ${
            result.success
              ? "bg-dex-green/5 border-dex-green/20 text-dex-green"
              : "bg-dex-red/5 border-dex-red/20 text-dex-red"
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
