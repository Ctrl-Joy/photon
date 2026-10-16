"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import WalletConnect from "./WalletConnect";

const NAV_LINKS = [
  { href: "/swap",      label: "Trade" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/dashboard", label: "Dashboard" },
];

/* ─── Photon wordmark ─── */
function PhotonLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      {/* Small SVG icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <circle cx="14" cy="14" r="12" stroke="url(#logo-grad)" strokeWidth="1.5" fill="none" />
        <circle cx="14" cy="14" r="4"  fill="url(#logo-grad)" />
        <line x1="14" y1="2"  x2="14" y2="10" stroke="url(#logo-grad)" strokeWidth="1" opacity="0.5" />
        <line x1="14" y1="18" x2="14" y2="26" stroke="url(#logo-grad)" strokeWidth="1" opacity="0.5" />
        <line x1="2"  y1="14" x2="10" y2="14" stroke="url(#logo-grad)" strokeWidth="1" opacity="0.5" />
        <line x1="18" y1="14" x2="26" y2="14" stroke="url(#logo-grad)" strokeWidth="1" opacity="0.5" />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
            <stop offset="0%" stopColor="#53B8FF" />
            <stop offset="100%" stopColor="#63F0E0" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-heading font-semibold text-lg tracking-tight text-photon-text group-hover:text-gradient transition-colors duration-200">
        Photon
      </span>
    </Link>
  );
}

/* ─── Desktop nav link ─── */
function NavLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        active
          ? "text-photon-text"
          : "text-photon-text-secondary hover:text-photon-text"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-photon"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

/* ─── Network status badge ─── */
function NetworkBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-photon-surface border border-photon-border text-xs">
      <span className="live-dot" />
      <span className="text-photon-text-secondary font-medium">Sepolia</span>
    </div>
  );
}

/* ─── Mobile menu ─── */
function MobileMenu({ isOpen, onClose, pathname }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-72 z-50 bg-photon-bg-elevated border-l border-photon-border flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={onClose}
                className="p-2 text-photon-text-muted hover:text-photon-text transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-6 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "text-photon-text bg-photon-surface"
                      : "text-photon-text-secondary hover:text-photon-text hover:bg-photon-surface/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Network + Wallet in mobile */}
            <div className="mt-auto px-6 pb-8 flex flex-col gap-3">
              <NetworkBadge />
              <WalletConnect />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Navbar export ─── */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? "glass shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: logo */}
            <PhotonLogo />

            {/* Center: desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                />
              ))}
            </nav>

            {/* Right: network + wallet (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <NetworkBadge />
              <WalletConnect />
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-photon-text-secondary hover:text-photon-text transition-colors"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 6h16M3 11h16M3 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
      />
    </>
  );
}
