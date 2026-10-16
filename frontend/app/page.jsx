"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#53B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
    title: "Smart Order Routing",
    desc: "Splits trades across multiple DEXs for best execution price with minimal slippage.",
    color: "photon-blue",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Real-Time Detection",
    desc: "WebSocket price feeds scan every 5 seconds to spot cross-exchange price inefficiencies.",
    color: "photon-purple",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#54D6A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Atomic Execution",
    desc: "Trades execute atomically on-chain. If not profitable, it reverts. Zero risk.",
    color: "photon-positive",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF737D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Risk Management",
    desc: "Daily loss limits, kill switch, slippage protection, Kelly-criterion sizing.",
    color: "photon-negative",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5BE69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "P&L Dashboard",
    desc: "Sharpe ratio, win rate, max drawdown, and detailed trade history in real time.",
    color: "photon-warning",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#66768B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3" />
      </svg>
    ),
    title: "On-Chain Verified",
    desc: "Every transaction is verifiable on Etherscan. Contracts are fully transparent.",
    color: "photon-text-muted",
  },
];

const steps = [
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
];

const techStack = [
  "Next.js 14",
  "Solidity",
  "Hardhat",
  "ethers.js",
  "Socket.io",
  "PostgreSQL",
  "Prisma",
  "TailwindCSS",
  "Recharts",
  "Node.js",
  "CoinGecko API",
  "Sepolia Testnet",
];

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
    <div className="min-h-screen bg-photon-bg">
      {/* ────── Hero ────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-glow pointer-events-none animate-glow" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-photon-purple/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-60 right-1/4 w-[250px] h-[250px] bg-photon-cyan/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-28 pb-20 md:pt-40 md:pb-32">
          <div className="text-center animate-fade-up">
            {/* Live price pill */}
            {livePrice && (
              <div className="inline-flex items-center gap-2 bg-photon-surface border border-photon-border rounded-full px-4 py-2 mb-8 animate-fade-in">
                <div className="live-dot" />
                <span className="text-[12px] text-photon-text-secondary font-num tracking-wide">
                  ETH ${Object.values(livePrice)[0]?.toLocaleString() || "—"}
                </span>
              </div>
            )}

            <h1 className="text-[40px] sm:text-[52px] md:text-[68px] lg:text-[76px] font-heading font-bold text-photon-text tracking-tight leading-[1.05] mb-6">
              The Fastest Path
              <br />
              Through{" "}
              <span className="text-gradient">
                DeFi Liquidity
              </span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-photon-text-secondary max-w-[560px] mx-auto mb-12 leading-relaxed">
              Photon aggregates liquidity across decentralized exchanges,
              detects cross-DEX arbitrage in real time, and executes
              atomically on-chain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/swap"
                className="w-full sm:w-auto bg-photon-blue hover:bg-photon-blue/80 text-white font-semibold px-8 py-3.5 rounded-xl text-[15px] transition-all duration-200 text-center shadow-lg shadow-photon-blue/20 hover:shadow-photon-blue/30"
              >
                Launch App
              </Link>
              <Link
                href="/arbitrage"
                className="w-full sm:w-auto bg-transparent border border-photon-border hover:border-photon-border-strong text-photon-text font-semibold px-8 py-3.5 rounded-xl text-[15px] transition-all duration-200 text-center"
              >
                Explore Arbitrage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────── Stats Bar ────── */}
      <section className="border-y border-photon-border bg-photon-surface/30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "3+", label: "DEXs Aggregated" },
              { value: "<5s", label: "Arb Detection" },
              { value: "100%", label: "Gas Optimized" },
              { value: "Atomic", label: "Execution" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[26px] md:text-[32px] font-bold font-num text-photon-text">
                  {s.value}
                </div>
                <div className="text-[12px] text-photon-text-muted mt-1 tracking-wide uppercase">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Features Grid ────── */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-[28px] md:text-[40px] font-heading font-bold text-photon-text mb-4 tracking-tight">
            Why Photon?
          </h2>
          <p className="text-photon-text-muted text-[15px] md:text-[16px] max-w-[460px] mx-auto leading-relaxed">
            One platform for efficient DeFi trading and arbitrage.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-photon-surface border border-photon-border rounded-2xl p-6 hover:border-photon-border-strong transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-photon-bg-elevated flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-photon-text mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] text-photon-text-muted leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ────── How It Works ────── */}
      <section className="border-t border-photon-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 md:py-28">
          <h2 className="text-[28px] md:text-[40px] font-heading font-bold text-photon-text text-center mb-14 tracking-tight">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {steps.map((item) => (
              <div key={item.step}>
                <div className="text-[56px] md:text-[64px] font-bold font-num text-photon-border leading-none mb-4 select-none">
                  {item.step}
                </div>
                <h3 className="text-[17px] font-semibold text-photon-text mb-2">
                  {item.title}
                </h3>
                <p className="text-[14px] text-photon-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Tech Stack ────── */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 md:py-20">
        <h2 className="text-[28px] md:text-[36px] font-heading font-bold text-photon-text text-center mb-10 tracking-tight">
          Tech Stack
        </h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="bg-photon-surface border border-photon-border rounded-lg px-4 py-2 text-[13px] text-photon-text-muted hover:text-photon-text hover:border-photon-border-strong transition-all duration-200 cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ────── Footer ────── */}
      <footer className="border-t border-photon-border py-8">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 text-center text-photon-text-muted text-[12px] tracking-wide">
          Photon — DEX Aggregator & Arbitrage Bot | Ethereum Sepolia Testnet
        </div>
      </footer>
    </div>
  );
}
