"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

export default function LandingPage() {
  const [livePrice, setLivePrice] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    socket.on("priceUpdate", (data) => {
      if (data?.prices?.ETH) {
        setLivePrice(data.prices.ETH);
      }
    });
    return () => socket.off("priceUpdate");
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative">
        {/* Subtle gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-dex-blue/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <div className="text-center">
            {/* Live price pill */}
            {livePrice && (
              <div className="inline-flex items-center gap-2 bg-dex-surface border border-dex-border rounded-full px-3.5 py-1.5 mb-8">
                <div className="live-dot" />
                <span className="text-[12px] text-dex-muted font-num">
                  ETH ${Object.values(livePrice)[0]?.toLocaleString() || "—"}
                </span>
              </div>
            )}

            <h1 className="text-[42px] md:text-[64px] font-bold text-white tracking-tight leading-[1.1] mb-5">
              Trade at the
              <br />
              <span className="bg-gradient-to-r from-dex-blue to-dex-purple bg-clip-text text-transparent">
                Speed of Light
              </span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-dex-muted max-w-[520px] mx-auto mb-10 leading-relaxed">
              DEX aggregator with cross-exchange arbitrage detection.
              Best swap rates, real-time price feeds, atomic execution.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/swap"
                className="w-full sm:w-auto bg-dex-blue hover:bg-dex-blue-hover text-white font-semibold px-8 py-3 rounded-xl text-[15px] transition-colors text-center"
              >
                Launch App
              </Link>
              <Link
                href="/arbitrage"
                className="w-full sm:w-auto bg-dex-surface border border-dex-border hover:border-dex-border-light text-white font-semibold px-8 py-3 rounded-xl text-[15px] transition-colors text-center"
              >
                View Arbitrage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-dex-border bg-dex-surface/30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "3+", label: "DEXs Aggregated" },
              { value: "<5s", label: "Arb Detection" },
              { value: "100%", label: "Gas Optimized" },
              { value: "Atomic", label: "Execution" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[24px] md:text-[28px] font-bold font-num text-white">{s.value}</div>
                <div className="text-[12px] text-dex-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-white mb-3">
            Why Photon?
          </h2>
          <p className="text-dex-muted text-[15px] max-w-[420px] mx-auto">
            One platform for efficient DeFi trading and arbitrage.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F8AF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              ),
              title: "Smart Order Routing",
              desc: "Splits trades across multiple DEXs for best execution price with minimal slippage.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6966FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
              title: "Real-Time Detection",
              desc: "WebSocket price feeds scan every 5 seconds to spot cross-exchange price inefficiencies.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3FB68B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              title: "Atomic Execution",
              desc: "Trades execute atomically on-chain. If not profitable, it reverts. Zero risk.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5353" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              title: "Risk Management",
              desc: "Daily loss limits, kill switch, slippage protection, Kelly-criterion sizing.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
              title: "P&L Dashboard",
              desc: "Sharpe ratio, win rate, max drawdown, and detailed trade history in real time.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#72768F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3" />
                </svg>
              ),
              title: "On-Chain Verified",
              desc: "Every transaction is verifiable on Etherscan. Contracts are fully transparent.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-dex-surface border border-dex-border rounded-xl p-5 hover:border-dex-border-light transition-colors"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="text-[14px] font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-dex-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-dex-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 md:py-20">
          <h2 className="text-[28px] md:text-[36px] font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Price Aggregation",
                desc: "Fetches live prices from CoinGecko, Jupiter, and on-chain pool reserves every 5 seconds.",
              },
              {
                step: "02",
                title: "Opportunity Detection",
                desc: "Compares prices across DEXs. When spread exceeds 0.5%, a profitable opportunity is flagged.",
              },
              {
                step: "03",
                title: "Atomic Execution",
                desc: "PhotonExecutor buys cheap and sells high in a single atomic transaction on-chain.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-[48px] font-bold font-num text-dex-border mb-3">
                  {item.step}
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[13px] text-dex-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-[28px] font-bold text-white text-center mb-8">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Next.js 14", "Solidity", "Hardhat", "ethers.js", "Socket.io",
            "PostgreSQL", "Prisma", "TailwindCSS", "Recharts", "Node.js",
            "CoinGecko API", "Sepolia Testnet",
          ].map((tech) => (
            <span
              key={tech}
              className="bg-dex-surface border border-dex-border rounded-lg px-3.5 py-1.5 text-[12px] text-dex-muted hover:text-white hover:border-dex-border-light transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dex-border py-6">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 text-center text-dex-muted text-[12px]">
          Photon — DEX Aggregator & Arbitrage Bot | Ethereum Sepolia Testnet
        </div>
      </footer>
    </div>
  );
}
