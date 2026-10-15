const axios = require("axios");
const prisma = require("../config/db");

/**
 * PriceFeed Service
 * Fetches token prices from 3 sources every 5 seconds:
 *   1. CoinGecko API (real market prices)
 *   2. Jupiter API (Solana DEX prices — cross-chain monitoring)
 *   3. On-chain pool reserves (our deployed testnet pools)
 *
 * Stores snapshots in DB for historical tracking and arbitrage detection.
 */

class PriceFeedService {
  constructor() {
    this.prices = {
      unipool: { WETH_USDC: 0 },
      sushipool: { WETH_USDC: 0 },
      curvepool: { USDC_DAI: 0 },
      coingecko: { ETH: 0, USDC: 1, DAI: 1 },
      jupiter: { SOL: 0, ETH: 0 },
    };
    this.listeners = [];
    this.isRunning = false;
  }

  /** Subscribe to price updates */
  onUpdate(callback) {
    this.listeners.push(callback);
  }

  /** Notify all listeners with latest prices */
  _notify() {
    this.listeners.forEach((cb) => cb(this.prices));
  }

  /** Fetch prices from CoinGecko (free, no API key needed) */
  async fetchCoinGecko() {
    try {
      const res = await axios.get(
        `${process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3"}/simple/price`,
        {
          params: {
            ids: "ethereum,usd-coin,dai,solana",
            vs_currencies: "usd",
          },
          timeout: 5000,
        }
      );

      this.prices.coingecko = {
        ETH: res.data.ethereum?.usd || 0,
        USDC: res.data["usd-coin"]?.usd || 1,
        DAI: res.data.dai?.usd || 1,
        SOL: res.data.solana?.usd || 0,
      };

      return this.prices.coingecko;
    } catch (err) {
      console.warn("CoinGecko fetch failed:", err.message);
      return this.prices.coingecko;
    }
  }

  /** Fetch prices from Jupiter (Solana aggregator) */
  async fetchJupiter() {
    try {
      const res = await axios.get(
        `${process.env.JUPITER_API_URL || "https://price.jup.ag/v6"}/price`,
        {
          params: {
            ids: "SOL,ETH",
            vsToken: "USDC",
          },
          timeout: 5000,
        }
      );

      if (res.data?.data) {
        this.prices.jupiter = {
          SOL: res.data.data.SOL?.price || 0,
          ETH: res.data.data.ETH?.price || 0,
        };
      }

      return this.prices.jupiter;
    } catch (err) {
      console.warn("Jupiter fetch failed:", err.message);
      return this.prices.jupiter;
    }
  }

  /**
   * Fetch on-chain prices from our deployed testnet pools.
   * These are the prices used for actual swap routing and arb detection.
   */
  async fetchOnChainPrices(poolContracts) {
    try {
      for (const [name, pool] of Object.entries(poolContracts)) {
        const price = await pool.getPrice();
        const [r0, r1] = await pool.getReserves();
        const poolName = await pool.poolName();

        const priceFloat = parseFloat(price.toString()) / 1e18;
        const key = poolName.toLowerCase().replace(/\s/g, "");

        if (key.includes("uni")) {
          this.prices.unipool.WETH_USDC = priceFloat;
        } else if (key.includes("sushi")) {
          this.prices.sushipool.WETH_USDC = priceFloat;
        } else if (key.includes("curve")) {
          this.prices.curvepool.USDC_DAI = priceFloat;
        }

        // Save snapshot to DB
        await prisma.priceSnapshot.create({
          data: {
            token: "WETH",
            pair: "WETH/USDC",
            dexName: poolName,
            price: priceFloat,
            liquidity: parseFloat(r0.toString()) / 1e18,
          },
        });
      }
    } catch (err) {
      console.warn("On-chain price fetch failed:", err.message);
    }
  }

  /** Start the price feed loop (every 5 seconds) */
  start(poolContracts = null) {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log("📡 Photon PriceFeed started — polling every 5s");

    const poll = async () => {
      await Promise.allSettled([
        this.fetchCoinGecko(),
        this.fetchJupiter(),
        poolContracts ? this.fetchOnChainPrices(poolContracts) : Promise.resolve(),
      ]);
      this._notify();
    };

    poll(); // initial fetch
    this._interval = setInterval(poll, 5000);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this._interval);
    console.log("📡 PriceFeed stopped");
  }

  getPrices() {
    return this.prices;
  }
}

module.exports = new PriceFeedService();
