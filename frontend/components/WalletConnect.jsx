"use client";

import { useState, useCallback } from "react";
import { connectWallet } from "../lib/contract";

/* ─── Truncate address: 0x1234...abcd ─── */
function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ─── Status indicator dot ─── */
function StatusDot({ status }) {
  const colors = {
    connected:    "bg-photon-positive shadow-[0_0_6px_theme(colors.photon.positive)]",
    connecting:   "bg-photon-warning shadow-[0_0_6px_theme(colors.photon.warning)] animate-pulse-soft",
    disconnected: "bg-photon-text-muted",
    error:        "bg-photon-negative shadow-[0_0_6px_theme(colors.photon.negative)]",
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors.disconnected}`}
    />
  );
}

export default function WalletConnect() {
  const [wallet, setWallet] = useState({
    address:  null,
    provider: null,
    signer:   null,
  });
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnect = useCallback(async () => {
    setErrorMsg("");
    setStatus("connecting");

    try {
      const result = await connectWallet();
      setWallet({
        address:  result.address,
        provider: result.provider,
        signer:   result.signer,
      });
      setStatus("connected");
    } catch (err) {
      console.error("[WalletConnect]", err);
      setErrorMsg(err?.message || "Connection failed");
      setStatus("error");

      /* Reset to disconnected after a few seconds so user can retry */
      setTimeout(() => setStatus("disconnected"), 4000);
    }
  }, []);

  /* ─── Connected state ─── */
  if (status === "connected" && wallet.address) {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-photon-surface border border-photon-border hover:border-photon-border-strong text-sm transition-all duration-200 cursor-default"
        title={wallet.address}
      >
        <StatusDot status="connected" />
        <span className="font-mono text-xs text-photon-text tabular-nums">
          {truncateAddress(wallet.address)}
        </span>
      </button>
    );
  }

  /* ─── Error state ─── */
  if (status === "error") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-photon-negative/30 bg-photon-surface text-sm text-photon-negative hover:bg-photon-negative/10 transition-all duration-200"
        >
          <StatusDot status="error" />
          Retry
        </button>
        {errorMsg && (
          <span className="text-[11px] text-photon-negative/70 max-w-[200px] truncate">
            {errorMsg}
          </span>
        )}
      </div>
    );
  }

  /* ─── Disconnected / Connecting state ─── */
  return (
    <button
      onClick={handleConnect}
      disabled={status === "connecting"}
      className="group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all duration-200 overflow-hidden
        bg-photon-surface border border-photon-border
        hover:border-transparent
        disabled:opacity-60 disabled:cursor-wait"
    >
      {/* Gradient border on hover */}
      <span
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, #53B8FF, #63F0E0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <StatusDot status={status} />
      <span className="text-photon-text-secondary group-hover:text-photon-text transition-colors">
        {status === "connecting" ? "Connecting..." : "Connect Wallet"}
      </span>
    </button>
  );
}
