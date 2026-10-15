const { ethers } = require("ethers");
const prisma = require("../config/db");
const { ROUTER_ABI, EXECUTOR_ABI, ERC20_ABI, addresses } = require("../config/contracts");

/**
 * TradeExecutor Service
 * Executes swaps and arbitrage trades on-chain via smart contracts.
 *
 * Two modes:
 *   1. Swap — user-initiated trade routed through PhotonRouter
 *   2. Arbitrage — bot-initiated atomic arb through PhotonExecutor
 */

class TradeExecutor {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.router = null;
    this.executor = null;
  }

  /** Initialize ethers provider and contract instances */
  init() {
    const rpcUrl = process.env.ALCHEMY_SEPOLIA_URL;
    const privKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!rpcUrl || !privKey) {
      console.warn("⚠️  TradeExecutor: Missing RPC URL or private key — running in demo mode");
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privKey, this.provider);

    if (addresses.router) {
      this.router = new ethers.Contract(addresses.router, ROUTER_ABI, this.signer);
    }
    if (addresses.executor) {
      this.executor = new ethers.Contract(addresses.executor, EXECUTOR_ABI, this.signer);
    }

    console.log("⚡ TradeExecutor initialized");
  }

  /**
   * Execute a swap through the PhotonRouter contract.
   * Finds best pool automatically and routes the trade.
   */
  async executeSwap({ tokenIn, amountIn, minAmountOut, userAddress }) {
    const trade = await prisma.trade.create({
      data: {
        type: "swap",
        tokenIn,
        tokenOut: "",
        amountIn: amountIn.toString(),
        amountOut: "0",
        userAddress,
        status: "pending",
      },
    });

    try {
      if (!this.router) {
        // Demo mode — simulate the swap
        const simulatedOut = (parseFloat(amountIn) * (1 + Math.random() * 0.02)).toString();
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            amountOut: simulatedOut,
            status: "confirmed",
            pool: "SimulatedPool",
          },
        });
        return { ...trade, amountOut: simulatedOut, status: "confirmed", simulated: true };
      }

      // Real on-chain swap
      const amount = ethers.parseEther(amountIn.toString());

      // Approve router to spend tokens
      const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, this.signer);
      const approveTx = await tokenContract.approve(addresses.router, amount);
      await approveTx.wait();

      // Execute swap
      const minOut = ethers.parseEther(minAmountOut.toString());
      const tx = await this.router.swap(tokenIn, amount, minOut);
      const receipt = await tx.wait();

      // Parse SwapExecuted event
      const swapEvent = receipt.logs.find((log) => {
        try {
          return this.router.interface.parseLog(log)?.name === "SwapExecuted";
        } catch {
          return false;
        }
      });

      const parsed = swapEvent
        ? this.router.interface.parseLog(swapEvent)
        : null;

      const amountOut = parsed
        ? ethers.formatEther(parsed.args.amountOut)
        : "0";

      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          txHash: receipt.hash,
          amountOut,
          status: "confirmed",
          gasUsed: receipt.gasUsed.toString(),
          gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
          pool: parsed?.args.pool || "",
          tokenOut: parsed?.args.tokenOut || "",
        },
      });

      return { id: trade.id, txHash: receipt.hash, amountOut, status: "confirmed" };
    } catch (err) {
      await prisma.trade.update({
        where: { id: trade.id },
        data: { status: "failed" },
      });
      throw new Error(`Swap failed: ${err.message}`);
    }
  }

  /**
   * Execute atomic arbitrage through PhotonExecutor contract.
   * Buys on cheap pool, sells on expensive pool in one transaction.
   */
  async executeArbitrage({ tokenStart, amountIn, buyPool, sellPool, minProfit }) {
    const trade = await prisma.trade.create({
      data: {
        type: "arbitrage",
        tokenIn: tokenStart,
        tokenOut: tokenStart,
        amountIn: amountIn.toString(),
        amountOut: "0",
        buyPool,
        sellPool,
        status: "pending",
      },
    });

    try {
      if (!this.executor) {
        // Demo mode
        const profit = (parseFloat(amountIn) * 0.02).toFixed(4);
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            amountOut: (parseFloat(amountIn) + parseFloat(profit)).toString(),
            profit,
            status: "confirmed",
          },
        });
        return { ...trade, profit, status: "confirmed", simulated: true };
      }

      // Real on-chain arbitrage
      const amount = ethers.parseEther(amountIn.toString());
      const minProfitWei = ethers.parseEther(minProfit.toString());

      // Approve executor
      const tokenContract = new ethers.Contract(tokenStart, ERC20_ABI, this.signer);
      const approveTx = await tokenContract.approve(addresses.executor, amount);
      await approveTx.wait();

      // Execute atomic arbitrage
      const tx = await this.executor.executeArbitrage(
        tokenStart,
        amount,
        buyPool,
        sellPool,
        minProfitWei
      );
      const receipt = await tx.wait();

      // Parse event
      const arbEvent = receipt.logs.find((log) => {
        try {
          return this.executor.interface.parseLog(log)?.name === "ArbitrageExecuted";
        } catch {
          return false;
        }
      });

      const parsed = arbEvent ? this.executor.interface.parseLog(arbEvent) : null;
      const profit = parsed ? ethers.formatEther(parsed.args.profit) : "0";

      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          txHash: receipt.hash,
          amountOut: parsed ? ethers.formatEther(parsed.args.amountOut) : "0",
          profit,
          status: "confirmed",
          gasUsed: receipt.gasUsed.toString(),
          gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        },
      });

      return { id: trade.id, txHash: receipt.hash, profit, status: "confirmed" };
    } catch (err) {
      await prisma.trade.update({
        where: { id: trade.id },
        data: { status: "failed" },
      });
      throw new Error(`Arbitrage failed: ${err.message}`);
    }
  }

  /** Simulate arbitrage without executing (dry run) */
  async simulateArbitrage({ tokenStart, amountIn, buyPool, sellPool }) {
    if (!this.executor) {
      return {
        expectedProfit: (parseFloat(amountIn) * 0.025).toFixed(4),
        isProfitable: true,
        simulated: true,
      };
    }

    const amount = ethers.parseEther(amountIn.toString());
    const [expectedProfit, isProfitable] = await this.executor.simulateArbitrage(
      tokenStart,
      amount,
      buyPool,
      sellPool
    );

    return {
      expectedProfit: ethers.formatEther(expectedProfit),
      isProfitable,
    };
  }
}

module.exports = new TradeExecutor();
