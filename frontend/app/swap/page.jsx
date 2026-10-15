"use client";
import SwapCard from "../../components/SwapCard";
import PriceComparison from "../../components/PriceComparison";

export default function SwapPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Swap Card — centered like 1inch */}
        <div className="lg:col-span-3 flex items-start justify-center pt-4">
          <SwapCard />
        </div>

        {/* Price sidebar */}
        <div className="lg:col-span-2">
          <PriceComparison />
        </div>
      </div>
    </div>
  );
}
