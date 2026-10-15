const prisma = require("../config/db");

/**
 * ProfitCalculator Service
 * Tracks P&L, win rate, Sharpe ratio, max drawdown, and daily performance.
 * Powers the Dashboard page metrics.
 */

class ProfitCalculator {
  /**
   * Calculate comprehensive P&L stats from trade history.
   * @returns {Object} Full performance metrics
   */
  async getStats() {
    const trades = await prisma.trade.findMany({
      where: { status: "confirmed", type: "arbitrage" },
      orderBy: { createdAt: "desc" },
    });

    if (trades.length === 0) {
      return this._emptyStats();
    }

    const profits = trades
      .map((t) => parseFloat(t.profit || "0"))
      .filter((p) => !isNaN(p));

    const wins = profits.filter((p) => p > 0);
    const losses = profits.filter((p) => p <= 0);

    const totalProfit = profits.reduce((sum, p) => sum + p, 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

    // Sharpe Ratio = mean(returns) / stddev(returns) * sqrt(252)
    const mean = totalProfit / profits.length;
    const variance =
      profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / profits.length;
    const stddev = Math.sqrt(variance);
    const sharpeRatio = stddev > 0 ? (mean / stddev) * Math.sqrt(252) : 0;

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    for (const p of profits.reverse()) {
      cumulative += p;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Daily P&L (last 30 days)
    const dailyPnL = await this._getDailyPnL(30);

    // Total gas spent
    const totalGas = trades.reduce((sum, t) => sum + parseFloat(t.gasCost || "0"), 0);

    return {
      totalTrades: trades.length,
      totalProfit: totalProfit.toFixed(4),
      winRate: winRate.toFixed(1),
      lossRate: (100 - winRate).toFixed(1),
      avgProfit: wins.length > 0 ? (wins.reduce((s, w) => s + w, 0) / wins.length).toFixed(4) : "0",
      avgLoss: losses.length > 0 ? (losses.reduce((s, l) => s + l, 0) / losses.length).toFixed(4) : "0",
      sharpeRatio: sharpeRatio.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(4),
      totalGasCost: totalGas.toFixed(6),
      netProfit: (totalProfit - totalGas).toFixed(4),
      wins: wins.length,
      losses: losses.length,
      dailyPnL,
      bestTrade: profits.length > 0 ? Math.max(...profits).toFixed(4) : "0",
      worstTrade: profits.length > 0 ? Math.min(...profits).toFixed(4) : "0",
    };
  }

  /** Get daily profit/loss for chart data */
  async _getDailyPnL(days) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const trades = await prisma.trade.findMany({
      where: {
        status: "confirmed",
        type: "arbitrage",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = {};
    for (const trade of trades) {
      const day = trade.createdAt.toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { profit: 0, trades: 0, gas: 0 };
      dailyMap[day].profit += parseFloat(trade.profit || "0");
      dailyMap[day].trades += 1;
      dailyMap[day].gas += parseFloat(trade.gasCost || "0");
    }

    return Object.entries(dailyMap).map(([date, data]) => ({
      date,
      profit: data.profit.toFixed(4),
      trades: data.trades,
      gasCost: data.gas.toFixed(6),
      netProfit: (data.profit - data.gas).toFixed(4),
    }));
  }

  /** Get recent trade history */
  async getTradeHistory(limit = 50) {
    return prisma.trade.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  _emptyStats() {
    return {
      totalTrades: 0, totalProfit: "0", winRate: "0", lossRate: "0",
      avgProfit: "0", avgLoss: "0", sharpeRatio: "0", maxDrawdown: "0",
      totalGasCost: "0", netProfit: "0", wins: 0, losses: 0,
      dailyPnL: [], bestTrade: "0", worstTrade: "0",
    };
  }
}

module.exports = new ProfitCalculator();
