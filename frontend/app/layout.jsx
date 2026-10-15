import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Photon | DEX Aggregator & Arbitrage",
  description:
    "DEX Aggregator & Cross-DEX Arbitrage Bot. Best swap rates and arbitrage opportunities across decentralized exchanges.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black">
        <Navbar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
