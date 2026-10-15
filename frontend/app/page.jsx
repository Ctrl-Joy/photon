"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

function StatCounter({ label, value, suffix = "" }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold stat-number gradient-text">
        {value}{suffix}
      </div>
      <div className="text-photon-muted text-sm mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card-glow bg-photon-card border border-photon-border rounded-2xl p-6 hover:border-photon-blue/30 transition-all">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-photon-muted text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-photon-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-photon-purple/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36">
          <div className="text-center max-w-3xl mx-auto">
            {/* Live indicator */}
            <div className="inline-flex items-center gap-2 bg-photon-card border border-photon-border rounded-full px-4 py-1.5 mb-8">
              <div className="live-dot" />
              <span className="text-sm text-photon-muted">
                {livePrice
                  ? `ETH: $${Object.values(livePrice)[0]?.toLocaleString() || "—"} Live`
                  : "Connecting to price feed..."}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Trade at the{" "}
              <span className="gradient-text">Speed of Light</span>
            </h1>

            <p className="text-lg md:text-xl text-photon-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              DEX aggregator meets cross-DEX arbitrage. Find the best swap rates,
              detect price inefficiencies, and execute profitable trades — all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/swap"
                className="w-full sm:w-auto bg-gradient-photon hover:opacity-90 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-center"
              >
                Launch App
              </Link>
              <Link
                href="/arbitrage"
                className="w-full sm:w-auto bg-photon-card border border-photon-border hover:border-photon-blue/50 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-center"
              >
                View Arbitrage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-photon-border bg-photon-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter label="DEXs Aggregated" value="3" suffix="+" />
            <StatCounter label="Arb Detection" value="<5" suffix="s" />
            <StatCounter label="Gas Optimized" value="100" suffix="%" />
            <StatCounter label="Atomic Execution" value="0" suffix=" Risk" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why <span className="gradient-text">Photon</span>?
          </h2>
          <p className="text-photon-muted max-w-xl mx-auto">
            One platform combining everything you need for efficient DeFi trading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🔄"
            title="Smart Order Routing"
            desc="Automatically splits your trade across multiple DEXs to find the best execution price with minimal slippage."
          />
          <FeatureCard
            icon="📡"
            title="Real-Time Arb Detection"
            desc="WebSocket-powered price feeds scan across DEXs every 5 seconds to spot cross-exchange price inefficiencies."
          />
          <FeatureCard
            icon="⚡"
            title="Atomic Execution"
            desc="Arbitrage trades execute atomically on-chain — if the trade isn't profitable, it reverts. Zero risk of losing funds."
          />
          <FeatureCard
            icon="🛡️"
            title="Risk Management"
            desc="Built-in daily loss limits, kill switch, slippage protection, and Kelly-criterion position sizing keep your capital safe."
          />
          <FeatureCard
            icon="📊"
            title="P&L Dashboard"
            desc="Track your performance with Sharpe ratio, win rate, max drawdown, and detailed trade history — all in real time."
          />
          <FeatureCard
            icon="🔗"
            title="On-Chain Verified"
            desc="Every transaction is verifiable on Etherscan. Smart contracts are transparent, auditable, and fully open-source."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-photon-border bg-photon-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            How It <span className="gradient-text">Works</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Price Aggregation",
                desc: "Photon fetches live prices from CoinGecko, Jupiter, and on-chain pool reserves every 5 seconds via WebSocket.",
              },
              {
                step: "02",
                title: "Opportunity Detection",
                desc: "Our arbitrage engine compares prices across DEXs. When the spread exceeds 0.5%, a profitable opportunity is flagged.",
              },
              {
                step: "03",
                title: "Atomic Execution",
                desc: "The PhotonExecutor smart contract buys from the cheap pool and sells on the expensive one — in a single atomic transaction.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-photon-blue/10 mb-4 stat-number">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-photon-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
          Built With <span className="gradient-text">Modern Stack</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
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
          ].map((tech) => (
            <span
              key={tech}
              className="bg-photon-card border border-photon-border rounded-full px-5 py-2 text-sm text-photon-muted hover:text-white hover:border-photon-blue/40 transition-all"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-photon-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-photon-muted text-sm">
          <p>
            Photon — DEX Aggregator & Arbitrage Bot | Built on Ethereum Sepolia
            Testnet
          </p>
        </div>
      </footer>
    </div>
  );
}
