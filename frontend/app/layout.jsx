import "./globals.css";

export const metadata = {
  title: "Photon | DEX Aggregator & Arbitrage",
  description:
    "Discover cross-market price discrepancies with a trading interface built for liquidity analysis, intelligent routing, and disciplined execution.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-photon-bg text-photon-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
