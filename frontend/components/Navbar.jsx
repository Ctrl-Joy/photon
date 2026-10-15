"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/swap", label: "Swap" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-photon-bg/80 backdrop-blur-xl border-b border-photon-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-photon flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="text-xl font-bold gradient-text">Photon</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-photon-card text-photon-blue"
                    : "text-photon-muted hover:text-white hover:bg-photon-card/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <WalletConnect />
            <button
              className="md:hidden text-photon-muted hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium ${
                  pathname === link.href
                    ? "bg-photon-card text-photon-blue"
                    : "text-photon-muted hover:text-white"
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
