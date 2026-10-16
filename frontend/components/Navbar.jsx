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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-photon-bg/90 backdrop-blur-xl border-b border-photon-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-photon flex items-center justify-center shadow-lg shadow-photon-blue/10 group-hover:shadow-photon-blue/20 transition-shadow">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-lg font-heading font-bold text-gradient tracking-tight">
              Photon
            </span>
          </Link>

          {/* Desktop Nav -- pill container */}
          <div className="hidden md:flex items-center gap-0.5 bg-photon-surface rounded-xl p-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-photon-surface-raised text-photon-text shadow-sm"
                    : "text-photon-text-muted hover:text-photon-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-photon-surface rounded-lg px-2.5 py-1.5 text-[12px] text-photon-text-muted border border-photon-border">
              <div className="w-1.5 h-1.5 rounded-full bg-photon-positive shadow-[0_0_6px_#54D6A0]" />
              Sepolia
            </div>
            <WalletConnect />
            <button
              className="md:hidden text-photon-text-muted hover:text-photon-text transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
          <div className="md:hidden pb-4 pt-1 space-y-0.5 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-photon-surface-raised text-photon-text"
                    : "text-photon-text-muted hover:text-photon-text hover:bg-photon-surface"
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
