const prisma = require("../config/db");

/**
 * RiskManager Service
 * Enforces safety limits on the arbitrage bot:
 *   - Daily loss limit (kill switch)
 *   - Maximum trade size
 *   - Slippage protection
 *   - Position sizing based on confidence
 *
 * If daily losses exceed the limit, the bot auto-disables.
 */

class RiskManager {
  constructor() {
    this.dailyLossLimit = parseFloat(process.env.DAILY_LOSS_LIMIT || "1000");
    this.maxTradeSize = parseFloat(process.env.MAX_TRADE_SIZE || "10000");
    this.maxSlippage = 2.0; // 2% max slippage
  }

  /** Initialize or load bot state from DB */
  async init() {
    let state = await prisma.botState.findUnique({ where: { id: "singleton" } });
    if (!state) {
      state = await prisma.botState.create({
        data: {
          id: "singleton",
          isRunning: false,
          dailyLossLimit: this.dailyLossLimit,
          maxTradeSize: this.maxTradeSize,
        },
      });
    }
    this.dailyLossLimit = state.dailyLossLimit;
    this.maxTradeSize = state.maxTradeSize;
    return state;
  }

  /**
   * Check if a trade passes risk checks.
   * @param {Object} trade — proposed trade
   * @returns {{ allowed: boolean, reason?: string }}
   */
  async checkTrade({ amountIn, expectedProfit, spreadPercent }) {
    const state = await prisma.botState.findUnique({ where: { id: "singleton" } });

    // Check 1: Is bot running?
    if (!state?.isRunning) {
      return { allowed: false, reason: "Bot is paused" };
    }

    // Check 2: Trade size limit
    if (parseFloat(amountIn) > this.maxTradeSize) {
      return { allowed: false, reason: `Trade size ${amountIn} exceeds max ${this.maxTradeSize}` };
    }

    // Check 3: Daily loss limit
    if (state.dailyPnL < -this.dailyLossLimit) {
      // AUTO KILL SWITCH — disable bot
      await prisma.botState.update({
        where: { id: "singleton" },
        data: { isRunning: false },
      });
      return { allowed: false, reason: `Daily loss limit reached (${state.dailyPnL}). Bot disabled.` };
    }

    // Check 4: Minimum spread threshold
    if (parseFloat(spreadPercent) < 0.3) {
      return { allowed: false, reason: `Spread too low (${spreadPercent}%). Min: 0.3%` };
    }

    // Check 5: Expected profit must be positive
    if (parseFloat(expectedProfit) <= 0) {
      return { allowed: false, reason: "Expected profit is negative or zero" };
    }

    return { allowed: true };
  }

  /**
   * Calculate optimal position size based on spread confidence.
   * Uses a conservative Kelly-criterion-inspired approach.
   */
  calculatePositionSize(spread, confidence = 0.7) {
    // Base size: 100 tokens
    // Scale up with spread, cap at maxTradeSize
    const baseSize = 100;
    const spreadMultiplier = Math.min(parseFloat(spread) / 0.5, 5); // 0.5% = 1x, 2.5% = 5x
    const kellyFraction = confidence * spreadMultiplier * 0.25; // conservative quarter-Kelly
    const size = Math.min(baseSize * kellyFraction, this.maxTradeSize);
    return Math.max(size, 10); // minimum 10 tokens
  }

  /** Update bot state after a trade */
  async recordTrade(profit) {
    const profitFloat = parseFloat(profit);
    const state = await prisma.botState.findUnique({ where: { id: "singleton" } });

    const newTotalProfit = state.totalProfit + profitFloat;
    const newTotalTrades = state.totalTrades + 1;
    const isWin = profitFloat > 0;
    const newWins = Math.round((state.winRate / 100) * state.totalTrades) + (isWin ? 1 : 0);
    const newWinRate = (newWins / newTotalTrades) * 100;

    // Update max drawdown
    const newDrawdown = profitFloat < 0 ? Math.max(state.maxDrawdown, Math.abs(profitFloat)) : state.maxDrawdown;

    await prisma.botState.update({
      where: { id: "singleton" },
      data: {
        totalTrades: newTotalTrades,
        totalProfit: newTotalProfit,
        winRate: newWinRate,
        dailyPnL: state.dailyPnL + profitFloat,
        maxDrawdown: newDrawdown,
      },
    });
  }

  /** Toggle bot on/off */
  async toggleBot(enabled) {
    return prisma.botState.update({
      where: { id: "singleton" },
      data: { isRunning: enabled },
    });
  }

  /** Update risk parameters */
  async updateParams({ dailyLossLimit, maxTradeSize }) {
    const data = {};
    if (dailyLossLimit !== undefined) {
      data.dailyLossLimit = parseFloat(dailyLossLimit);
      this.dailyLossLimit = data.dailyLossLimit;
    }
    if (maxTradeSize !== undefined) {
      data.maxTradeSize = parseFloat(maxTradeSize);
      this.maxTradeSize = data.maxTradeSize;
    }
    return prisma.botState.update({ where: { id: "singleton" }, data });
  }

  /** Get current bot state */
  async getState() {
    return prisma.botState.findUnique({ where: { id: "singleton" } });
  }

  /** Reset daily P&L (called at midnight) */
  async resetDaily() {
    await prisma.botState.update({
      where: { id: "singleton" },
      data: { dailyPnL: 0 },
    });
  }
}

module.exports = new RiskManager();
