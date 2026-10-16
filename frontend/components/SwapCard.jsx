"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSwapQuote, executeSwap } from "../lib/api";
import { connectWallet } from "../lib/contract";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", color: "#F7931A", decimals: 8 },
  { symbol: "USDC", name: "USD Coin", color: "#2775CA", decimals: 6 },
  { symbol: "USDT", name: "Tether", color: "#26A17B", decimals: 6 },
  { symbol: "DAI", name: "Dai", color: "#F5AC37", decimals: 18 },
  { symbol: "LINK", name: "Chainlink", color: "#2A5ADA", decimals: 18 },
];

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

function TokenIcon({ symbol, color, size = 28 }) {
  return (
    <div
      className="token-icon flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

function TokenSelector({ selected, onSelect, otherToken, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-photon-border bg-photon-bg-elevated shadow-xl"
    >
      <div className="px-3 py-2 text-xs font-medium text-photon-text-muted">
        Select token
      </div>
      {TOKENS.map((token) => {
        const isDisabled = token.symbol === otherToken?.symbol;
        return (
          <button
            key={token.symbol}
            onClick={() => {
              if (!isDisabled) {
                onSelect(token);
                onClose();
              }
            }}
            disabled={isDisabled}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
              isDisabled
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-photon-surface"
            } ${
              selected?.symbol === token.symbol ? "bg-photon-surface" : ""
            }`}
          >
            <TokenIcon symbol={token.symbol} color={token.color} />
            <div>
              <div className="text-sm font-medium text-photon-text">
                {token.symbol}
              </div>
              <div className="text-xs text-photon-text-muted">{token.name}</div>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}

export default function SwapCard() {
  const [tokenIn, setTokenIn] = useState(TOKENS[0]); // ETH
  const [tokenOut, setTokenOut] = useState(TOKENS[2]); // USDC
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [showTokenInSelect, setShowTokenInSelect] = useState(false);
  const [showTokenOutSelect, setShowTokenOutSelect] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSlippageEditor, setShowSlippageEditor] = useState(false);
  const [rotated, setRotated] = useState(false);

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const [wallet, setWallet] = useState(null);
  const [txState, setTxState] = useState("idle"); // idle | pending | submitted | confirmed | failed
  const [txError, setTxError] = useState(null);

  const debounceRef = useRef(null);
  const cardRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setShowTokenInSelect(false);
        setShowTokenOutSelect(false);
        setShowSlippageEditor(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced quote fetching
  const fetchQuote = useCallback(
    (amount) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null);
        setAmountOut("");
        setQuoteError(null);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      debounceRef.current = setTimeout(async () => {
        try {
          const result = await getSwapQuote(tokenIn.symbol, amount);
          setQuote(result);
          setAmountOut(result.amountOut?.toString() || "0");
          setQuoteLoading(false);
        } catch (err) {
          console.error("Quote fetch failed:", err);
          setQuoteError(err.message || "Failed to get quote");
          setQuoteLoading(false);
        }
      }, 500);
    },
    [tokenIn.symbol]
  );

  // Re-fetch quote when token changes
  useEffect(() => {
    if (amountIn) fetchQuote(amountIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIn.symbol, tokenOut.symbol]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleAmountChange(value) {
    // Allow only valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmountIn(value);
      fetchQuote(value);
    }
  }

  function handleSwapDirection() {
    setRotated((r) => !r);
    const prevIn = tokenIn;
    const prevOut = tokenOut;
    const prevAmountOut = amountOut;
    setTokenIn(prevOut);
    setTokenOut(prevIn);
    setAmountIn(prevAmountOut);
    setAmountOut("");
    setQuote(null);
    if (prevAmountOut) fetchQuote(prevAmountOut);
  }

  async function handleConnectWallet() {
    try {
      const result = await connectWallet();
      setWallet(result);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  }

  async function handleExecuteSwap() {
    if (!wallet || !amountIn || !quote) return;

    setTxState("pending");
    setTxError(null);

    try {
      const data = {
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountIn: amountIn,
        minAmountOut: (
          parseFloat(amountOut) *
          (1 - slippage / 100)
        ).toString(),
        slippage: slippage,
        walletAddress: wallet.address,
      };

      setTxState("submitted");
      await executeSwap(data);
      setTxState("confirmed");

      // Reset after confirmation
      setTimeout(() => {
        setTxState("idle");
        setAmountIn("");
        setAmountOut("");
        setQuote(null);
      }, 3000);
    } catch (err) {
      console.error("Swap execution failed:", err);
      setTxError(err.message || "Swap failed");
      setTxState("failed");

      setTimeout(() => {
        setTxState("idle");
        setTxError(null);
      }, 4000);
    }
  }

  function getButtonState() {
    if (!wallet) return { label: "Connect Wallet", action: handleConnectWallet, enabled: true };
    if (txState === "pending") return { label: "Confirming...", action: null, enabled: false };
    if (txState === "submitted") return { label: "Transaction Submitted", action: null, enabled: false };
    if (txState === "confirmed") return { label: "Swap Confirmed!", action: null, enabled: false };
    if (txState === "failed") return { label: txError || "Swap Failed", action: null, enabled: false };
    if (!amountIn || parseFloat(amountIn) <= 0) return { label: "Enter Amount", action: null, enabled: false };
    if (quoteLoading) return { label: "Fetching Quote...", action: null, enabled: false };
    if (quoteError) return { label: "Quote Unavailable", action: null, enabled: false };
    return {
      label: `Swap ${tokenIn.symbol} for ${tokenOut.symbol}`,
      action: handleExecuteSwap,
      enabled: true,
    };
  }

  const buttonState = getButtonState();
  const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage;

  return (
    <div ref={cardRef} className="surface-card flex w-full flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold text-photon-text">
          Swap
        </h3>
        <button
          onClick={() => setShowSlippageEditor((s) => !s)}
          className="flex items-center gap-1 rounded-lg border border-photon-border px-2 py-1 text-xs text-photon-text-secondary transition-colors hover:border-photon-border-strong"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          <span className="font-num">{effectiveSlippage}%</span>
        </button>
      </div>

      {/* Slippage editor */}
      <AnimatePresence>
        {showSlippageEditor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-lg border border-photon-border bg-photon-bg-elevated p-3">
              <div className="mb-2 text-xs text-photon-text-muted">
                Slippage Tolerance
              </div>
              <div className="flex items-center gap-2">
                {SLIPPAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSlippage(opt);
                      setCustomSlippage("");
                    }}
                    className={`rounded-lg px-3 py-1.5 font-num text-xs transition-colors ${
                      slippage === opt && !customSlippage
                        ? "bg-photon-blue/20 text-photon-blue"
                        : "bg-photon-surface text-photon-text-secondary hover:text-photon-text"
                    }`}
                  >
                    {opt}%
                  </button>
                ))}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customSlippage}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d*\.?\d*$/.test(v)) {
                        setCustomSlippage(v);
                      }
                    }}
                    placeholder="Custom"
                    className="w-full rounded-lg border border-photon-border bg-photon-surface px-3 py-1.5 font-num text-xs text-photon-text outline-none transition-colors placeholder:text-photon-text-muted focus:border-photon-blue"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-num text-xs text-photon-text-muted">
                    %
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* You Pay */}
      <div className="relative rounded-xl border border-photon-border bg-photon-bg-elevated p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-photon-text-muted">You Pay</span>
          <button
            onClick={() => handleAmountChange("1.0")}
            className="text-xs text-photon-blue hover:text-photon-cyan"
          >
            Max
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={amountIn}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.0"
            className="min-w-0 flex-1 bg-transparent text-right font-num text-2xl font-medium text-photon-text outline-none placeholder:text-photon-text-muted"
          />
          <button
            onClick={() => {
              setShowTokenInSelect((s) => !s);
              setShowTokenOutSelect(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-photon-border bg-photon-surface px-3 py-2 transition-colors hover:border-photon-border-strong"
          >
            <TokenIcon symbol={tokenIn.symbol} color={tokenIn.color} size={24} />
            <span className="text-sm font-semibold text-photon-text">
              {tokenIn.symbol}
            </span>
            <svg className="h-3 w-3 text-photon-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        <AnimatePresence>
          {showTokenInSelect && (
            <TokenSelector
              selected={tokenIn}
              onSelect={setTokenIn}
              otherToken={tokenOut}
              onClose={() => setShowTokenInSelect(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Swap direction button */}
      <div className="relative z-10 -my-2 flex justify-center">
        <motion.button
          onClick={handleSwapDirection}
          animate={{ rotate: rotated ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-photon-border bg-photon-surface text-photon-text-secondary transition-colors hover:border-photon-blue hover:text-photon-blue"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
        </motion.button>
      </div>

      {/* You Receive */}
      <div className="relative rounded-xl border border-photon-border bg-photon-bg-elevated p-3">
        <div className="mb-2 text-xs text-photon-text-muted">You Receive</div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-right font-num text-2xl font-medium text-photon-text">
            {quoteLoading ? (
              <div className="ml-auto h-7 w-28 animate-pulse rounded bg-photon-surface-raised" />
            ) : (
              amountOut || "0.0"
            )}
          </div>
          <button
            onClick={() => {
              setShowTokenOutSelect((s) => !s);
              setShowTokenInSelect(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-photon-border bg-photon-surface px-3 py-2 transition-colors hover:border-photon-border-strong"
          >
            <TokenIcon symbol={tokenOut.symbol} color={tokenOut.color} size={24} />
            <span className="text-sm font-semibold text-photon-text">
              {tokenOut.symbol}
            </span>
            <svg className="h-3 w-3 text-photon-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        <AnimatePresence>
          {showTokenOutSelect && (
            <TokenSelector
              selected={tokenOut}
              onSelect={setTokenOut}
              otherToken={tokenIn}
              onClose={() => setShowTokenOutSelect(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Quote details */}
      {quote && !quoteLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 space-y-1.5 rounded-lg border border-photon-border bg-photon-bg-elevated px-3 py-2.5"
        >
          {quote.rate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-photon-text-muted">Rate</span>
              <span className="font-num text-photon-text-secondary">
                1 {tokenIn.symbol} = {parseFloat(quote.rate).toFixed(4)} {tokenOut.symbol}
              </span>
            </div>
          )}
          {quote.priceImpact != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-photon-text-muted">Price Impact</span>
              <span
                className={`font-num ${
                  parseFloat(quote.priceImpact) > 3
                    ? "text-photon-negative"
                    : "text-photon-text-secondary"
                }`}
              >
                {parseFloat(quote.priceImpact).toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-photon-text-muted">Min. Received</span>
            <span className="font-num text-photon-text-secondary">
              {(parseFloat(amountOut) * (1 - effectiveSlippage / 100)).toFixed(4)}{" "}
              {tokenOut.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-photon-text-muted">Slippage</span>
            <span className="font-num text-photon-text-secondary">
              {effectiveSlippage}%
            </span>
          </div>
          {quote.route && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-photon-text-muted">Route</span>
              <span className="text-photon-text-secondary">{quote.route}</span>
            </div>
          )}
          {quote.estimatedGas && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-photon-text-muted">Est. Gas</span>
              <span className="font-num text-photon-text-secondary">
                {quote.estimatedGas}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Quote error */}
      {quoteError && !quoteLoading && (
        <div className="mt-3 rounded-lg border border-photon-negative/20 bg-photon-negative/5 px-3 py-2 text-xs text-photon-negative">
          {quoteError}
        </div>
      )}

      {/* Transaction status */}
      <AnimatePresence>
        {txState === "submitted" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-photon-blue/20 bg-photon-blue/5 px-3 py-2"
          >
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-photon-blue border-t-transparent" />
            <span className="text-xs text-photon-blue">
              Transaction submitted. Waiting for confirmation...
            </span>
          </motion.div>
        )}
        {txState === "confirmed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-photon-positive/20 bg-photon-positive/5 px-3 py-2"
          >
            <svg className="h-4 w-4 text-photon-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-xs text-photon-positive">
              Swap confirmed successfully!
            </span>
          </motion.div>
        )}
        {txState === "failed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-photon-negative/20 bg-photon-negative/5 px-3 py-2"
          >
            <svg className="h-4 w-4 text-photon-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span className="text-xs text-photon-negative">
              {txError || "Swap failed"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <button
        onClick={buttonState.action}
        disabled={!buttonState.enabled}
        className={`mt-4 w-full rounded-xl py-3.5 text-sm font-semibold transition-all ${
          buttonState.enabled
            ? "bg-gradient-photon text-photon-bg hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed bg-photon-surface-raised text-photon-text-muted"
        }`}
      >
        {buttonState.label}
      </button>
    </div>
  );
}
