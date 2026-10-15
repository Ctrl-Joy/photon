import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Photon — Trade at the Speed of Light",
  description: "DEX Aggregator & Cross-DEX Arbitrage Bot. Find the best swap rates and capture arbitrage opportunities across decentralized exchanges.",
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
