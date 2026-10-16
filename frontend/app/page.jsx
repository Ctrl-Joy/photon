"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import PhotonNetwork from "../components/PhotonNetwork";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5 },
  }),
};

/* ─── Feature icons (inline SVG) ─── */
function AggregateIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8"  cy="8"  r="3" stroke="#53B8FF" strokeWidth="1.5" />
      <circle cx="24" cy="8"  r="3" stroke="#53B8FF" strokeWidth="1.5" />
      <circle cx="8"  cy="24" r="3" stroke="#53B8FF" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3" stroke="#53B8FF" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="#53B8FF" opacity="0.2" stroke="#53B8FF" strokeWidth="1.5" />
      <line x1="11" y1="10" x2="13" y2="14" stroke="#53B8FF" strokeWidth="1" opacity="0.5" />
      <line x1="21" y1="10" x2="19" y2="14" stroke="#53B8FF" strokeWidth="1" opacity="0.5" />
      <line x1="11" y1="22" x2="13" y2="18" stroke="#53B8FF" strokeWidth="1" opacity="0.5" />
      <line x1="21" y1="22" x2="19" y2="18" stroke="#53B8FF" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function MLIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="20" width="4" height="8" rx="1" fill="#63F0E0" opacity="0.3" />
      <rect x="10" y="14" width="4" height="14" rx="1" fill="#63F0E0" opacity="0.5" />
      <rect x="16" y="10" width="4" height="18" rx="1" fill="#63F0E0" opacity="0.7" />
      <rect x="22" y="4" width="4" height="24" rx="1" fill="#63F0E0" opacity="0.9" />
      <path d="M6 18 L12 12 L18 8 L24 3" stroke="#63F0E0" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 3L5 8v7c0 7.5 4.7 14.5 11 17 6.3-2.5 11-9.5 11-17V8L16 3z"
        stroke="#54D6A0"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 16l3 3 5-6"
        stroke="#54D6A0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ─── Step icons ─── */
function ScanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#53B8FF" strokeWidth="1.5" fill="none" />
      <line x1="18" y1="18" x2="25" y2="25" stroke="#53B8FF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="#53B8FF" strokeWidth="1" opacity="0.4" fill="none" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="22" height="22" rx="3" stroke="#63F0E0" strokeWidth="1.5" fill="none" />
      <polyline points="7,18 12,12 16,15 22,8" stroke="#63F0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ExecuteIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="10,5 10,23 23,14" stroke="#54D6A0" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon, title, description, index }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={index}
      className="surface-card p-6 sm:p-8 group hover:border-photon-border-strong transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-photon-blue/5"
    >
      <div className="w-12 h-12 rounded-xl bg-photon-surface-raised border border-photon-border flex items-center justify-center mb-5 group-hover:border-photon-blue/30 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="font-heading font-semibold text-lg text-photon-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-photon-text-secondary leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

/* ─── How It Works step ─── */
function StepItem({ icon, title, description, stepNum, isLast }) {
  return (
    <div className="flex flex-col items-center text-center flex-1 relative">
      {/* Step number */}
      <span className="font-mono text-xs text-photon-text-muted mb-3">
        {String(stepNum).padStart(2, "0")}
      </span>

      {/* Icon circle */}
      <div className="w-14 h-14 rounded-2xl bg-photon-surface border border-photon-border flex items-center justify-center mb-4">
        {icon}
      </div>

      <h4 className="font-heading font-semibold text-photon-text mb-1.5">
        {title}
      </h4>
      <p className="text-sm text-photon-text-secondary max-w-[220px] leading-relaxed">
        {description}
      </p>

      {/* Connecting line (desktop only, not on last) */}
      {!isLast && (
        <div className="hidden md:block absolute top-[72px] left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-photon-border" />
      )}
    </div>
  );
}

/* ─── Page component ─── */
export default function HomePage() {
  const featuresRef = useRef(null);

  return (
    <div className="min-h-screen bg-photon-bg">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* 3D network background */}
        <div className="absolute inset-0 z-0">
          <PhotonNetwork />
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-photon-bg/95 via-photon-bg/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-photon-bg to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="max-w-2xl">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6"
            >
              <span className="text-gradient">Where Market</span>
              <br />
              <span className="text-gradient">Inefficiencies</span>
              <br />
              <span className="text-photon-text">Become Visible</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-photon-text-secondary text-base sm:text-lg leading-relaxed mb-10 max-w-lg"
            >
              Discover cross-market price discrepancies with a trading interface
              built for liquidity analysis, intelligent routing, and disciplined
              execution.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="flex flex-wrap gap-4"
            >
              {/* Primary CTA */}
              <Link
                href="/swap"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
                  bg-gradient-photon text-photon-bg
                  hover:shadow-lg hover:shadow-photon-blue/20
                  transition-all duration-200 hover:-translate-y-0.5"
              >
                Launch Terminal
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/arbitrage"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
                  text-photon-text-secondary border border-photon-border
                  hover:border-photon-border-strong hover:text-photon-text
                  transition-all duration-200"
              >
                Explore Arbitrage
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section ref={featuresRef} className="py-24 sm:py-32 relative">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-glow pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-photon-text mb-3">
              Built for Precision
            </h2>
            <p className="text-photon-text-secondary text-sm sm:text-base max-w-md mx-auto">
              A complete toolkit for navigating decentralized liquidity with confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<AggregateIcon />}
              title="DEX Aggregation"
              description="Route optimization across multiple decentralized exchanges. Compare quotes in real time and execute through the best available liquidity path."
              index={0}
            />
            <FeatureCard
              icon={<MLIcon />}
              title="ML-Powered Arbitrage"
              description="Machine learning spread prediction identifies cross-market price discrepancies before they close. Backtest strategies against historical data."
              index={1}
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="Risk Controls"
              description="Position sizing, slippage limits, and execution safety checks. Every trade includes configurable guardrails for disciplined execution."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="py-24 sm:py-32 border-t border-photon-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-photon-text mb-3">
              How It Works
            </h2>
            <p className="text-photon-text-secondary text-sm sm:text-base max-w-md mx-auto">
              Three steps from market scan to execution.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-12 md:gap-8"
          >
            <StepItem
              icon={<ScanIcon />}
              title="Scan"
              description="Continuously monitor pricing across DEX liquidity pools for spread opportunities."
              stepNum={1}
            />
            <StepItem
              icon={<AnalyzeIcon />}
              title="Analyze"
              description="ML models evaluate spread stability, gas costs, and execution probability in real time."
              stepNum={2}
            />
            <StepItem
              icon={<ExecuteIcon />}
              title="Execute"
              description="One-click execution with optimal routing, slippage protection, and position sizing."
              stepNum={3}
              isLast
            />
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-photon-blue/[0.03] blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-photon-text mb-4">
              Start Trading with{" "}
              <span className="text-gradient">Photon</span>
            </h2>
            <p className="text-photon-text-secondary text-base mb-10 max-w-md mx-auto">
              Connect your wallet and access decentralized liquidity across multiple exchanges.
            </p>

            <Link
              href="/swap"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm
                bg-gradient-photon text-photon-bg
                hover:shadow-lg hover:shadow-photon-blue/20
                transition-all duration-200 hover:-translate-y-0.5"
            >
              Launch Terminal
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-photon-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-xs text-photon-text-muted">
            Photon DEX Aggregator &mdash; Sepolia Testnet
          </span>
          <span className="text-xs text-photon-text-muted">
            Built for educational purposes
          </span>
        </div>
      </footer>
    </div>
  );
}
