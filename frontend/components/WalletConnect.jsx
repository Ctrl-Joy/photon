"use client";
import { useState, useEffect } from "react";
import { connectWallet } from "../lib/contract";

export default function WalletConnect() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        setAddress(accounts[0] || null);
      });
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { address: addr } = await connectWallet();
      setAddress(addr);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
    setConnecting(false);
  };

  if (address) {
    return (
      <div className="flex items-center gap-2 bg-photon-surface border border-photon-border rounded-xl px-3 py-1.5">
        <div className="w-2 h-2 rounded-full bg-photon-positive shadow-[0_0_6px_#54D6A0]" />
        <span className="text-[13px] font-num text-photon-text-muted">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="bg-photon-blue hover:bg-photon-blue/80 text-white text-[13px] font-semibold px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
