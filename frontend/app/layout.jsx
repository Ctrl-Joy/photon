import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Photon | DEX Aggregator & Arbitrage",
  description:
    "Photon aggregates liquidity across decentralized exchanges to find the fastest path through DeFi. Real-time arbitrage detection, atomic execution, and optimized gas on Ethereum.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-photon-bg">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
