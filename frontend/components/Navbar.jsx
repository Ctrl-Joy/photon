"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";

const navLinks = [
  { href: "/swap", label: "Swap" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-dex-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-dex-blue to-dex-purple flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Photon</span>
          </Link>

          {/* Desktop Nav — 1inch style pill links */}
          <div className="hidden md:flex items-center gap-0.5 bg-dex-surface rounded-xl p-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  pathname === link.href
                    ? "bg-dex-card text-white"
                    : "text-dex-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-dex-surface rounded-lg px-2.5 py-1.5 text-[12px] text-dex-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-dex-green" />
              Sepolia
            </div>
            <WalletConnect />
            <button
              className="md:hidden text-dex-muted hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? "bg-dex-surface text-white"
                    : "text-dex-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
