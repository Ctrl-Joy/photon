"use client";
import SwapCard from "../../components/SwapCard";
import PriceComparison from "../../components/PriceComparison";

export default function SwapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Swap</span>
        </h1>
        <p className="text-photon-muted">
          Get the best price across multiple DEXs with smart order routing.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Swap Card - Main */}
        <div className="lg:col-span-3 flex items-start justify-center">
          <SwapCard />
        </div>

        {/* Price Comparison - Sidebar */}
        <div className="lg:col-span-2">
          <PriceComparison />
        </div>
      </div>
    </div>
  );
}
