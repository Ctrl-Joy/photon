const prisma = require("../config/db");

/**
 * ArbitrageDetector Service
 * Compares prices across DEXs every cycle to find profitable opportunities.
 *
 * How it works:
 *   1. Get price of same token pair from multiple pools
 *   2. Calculate spread = (highPrice - lowPrice) / lowPrice * 100
 *   3. If spread > threshold (0.5%), flag as opportunity
 *   4. Estimate profit considering gas costs and fees
 *   5. Push to listeners (WebSocket → frontend)
 */

class ArbitrageDetector {
  constructor() {
    this.opportunities = [];
    this.listeners = [];
    this.minSpreadPercent = 0.5; // minimum 0.5% spread to flag
    this.totalDetected = 0;
  }

  onOpportunity(callback) {
    this.listeners.push(callback);
  }

  _notify(opportunity) {
    this.listeners.forEach((cb) => cb(opportunity));
  }

  /**
   * Analyze prices from the PriceFeed and detect cross-DEX arbitrage.
   * Called every time prices update.
   *
   * @param {Object} prices — latest prices from PriceFeedService
   */
  analyze(prices) {
    const newOpps = [];

    // === Check WETH/USDC across UniPool vs SushiPool ===
    const uniPrice = prices.unipool?.WETH_USDC || 0;
    const sushiPrice = prices.sushipool?.WETH_USDC || 0;

    if (uniPrice > 0 && sushiPrice > 0) {
      const spread = Math.abs(uniPrice - sushiPrice);
      const spreadPercent = (spread / Math.min(uniPrice, sushiPrice)) * 100;

      if (spreadPercent >= this.minSpreadPercent) {
        const buyDex = uniPrice < sushiPrice ? "UniPool" : "SushiPool";
        const sellDex = uniPrice < sushiPrice ? "SushiPool" : "UniPool";
        const buyPrice = Math.min(uniPrice, sushiPrice);
        const sellPrice = Math.max(uniPrice, sushiPrice);

        // Estimate profit for 1 ETH trade
        const tradeSize = 1; // 1 WETH
        const grossProfit = spread * tradeSize;
        const estimatedGas = 0.005; // ~0.005 ETH gas on testnet
        const netProfit = grossProfit - estimatedGas * buyPrice;

        const opp = {
          id: `arb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tokenPair: "WETH/USDC",
          buyDex,
          sellDex,
          buyPrice,
          sellPrice,
          spread: spreadPercent.toFixed(3),
          profitEstimate: netProfit.toFixed(2),
          tradeSize: `${tradeSize} WETH`,
          isProfitable: netProfit > 0,
          timestamp: new Date().toISOString(),
          status: "detected",
        };

        newOpps.push(opp);
        this._notify(opp);
      }
    }

    // === Check CoinGecko vs Jupiter cross-chain price (ETH) ===
    const geckoETH = prices.coingecko?.ETH || 0;
    const jupiterETH = prices.jupiter?.ETH || 0;

    if (geckoETH > 0 && jupiterETH > 0) {
      const crossSpread = Math.abs(geckoETH - jupiterETH);
      const crossSpreadPct = (crossSpread / Math.min(geckoETH, jupiterETH)) * 100;

      if (crossSpreadPct >= this.minSpreadPercent) {
        const opp = {
          id: `arb-cross-${Date.now()}`,
          tokenPair: "ETH/USD",
          buyDex: geckoETH < jupiterETH ? "Ethereum DEXs" : "Solana (Jupiter)",
          sellDex: geckoETH < jupiterETH ? "Solana (Jupiter)" : "Ethereum DEXs",
          buyPrice: Math.min(geckoETH, jupiterETH),
          sellPrice: Math.max(geckoETH, jupiterETH),
          spread: crossSpreadPct.toFixed(3),
          profitEstimate: (crossSpread * 1).toFixed(2),
          tradeSize: "1 ETH",
          isProfitable: crossSpreadPct > 1,
          timestamp: new Date().toISOString(),
          status: "detected",
          note: "Cross-chain opportunity (monitoring only)",
        };

        newOpps.push(opp);
        this._notify(opp);
      }
    }

    // Store in memory + DB
    if (newOpps.length > 0) {
      this.opportunities = [...newOpps, ...this.opportunities].slice(0, 100);
      this.totalDetected += newOpps.length;
      this._saveToDb(newOpps);
    }

    return newOpps;
  }

  async _saveToDb(opps) {
    try {
      for (const opp of opps) {
        await prisma.arbitrageOpportunity.create({
          data: {
            tokenPair: opp.tokenPair,
            buyDex: opp.buyDex,
            sellDex: opp.sellDex,
            buyPrice: opp.buyPrice,
            sellPrice: opp.sellPrice,
            spread: parseFloat(opp.spread),
            profitEstimate: parseFloat(opp.profitEstimate),
            status: opp.status,
          },
        });
      }
    } catch (err) {
      console.warn("DB save failed:", err.message);
    }
  }

  getOpportunities() {
    return this.opportunities;
  }

  getStats() {
    return {
      totalDetected: this.totalDetected,
      activeOpportunities: this.opportunities.filter((o) => o.status === "detected").length,
      avgSpread:
        this.opportunities.length > 0
          ? (
              this.opportunities.reduce((sum, o) => sum + parseFloat(o.spread), 0) /
              this.opportunities.length
            ).toFixed(3)
          : "0",
    };
  }
}

module.exports = new ArbitrageDetector();
