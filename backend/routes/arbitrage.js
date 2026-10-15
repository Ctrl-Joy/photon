const express = require("express");
const router = express.Router();
const arbDetector = require("../services/arbitrageDetector");
const tradeExecutor = require("../services/tradeExecutor");
const riskManager = require("../services/riskManager");

// GET /api/arbitrage/opportunities — list current arb opportunities
router.get("/opportunities", (req, res) => {
  res.json({
    success: true,
    data: arbDetector.getOpportunities(),
    stats: arbDetector.getStats(),
  });
});

// POST /api/arbitrage/execute — manually execute an arb trade
router.post("/execute", async (req, res) => {
  try {
    const { tokenStart, amountIn, buyPool, sellPool, minProfit } = req.body;

    // Risk check
    const riskCheck = await riskManager.checkTrade({
      amountIn,
      expectedProfit: minProfit || "0",
      spreadPercent: "1",
    });

    if (!riskCheck.allowed) {
      return res.status(403).json({ success: false, error: riskCheck.reason });
    }

    const result = await tradeExecutor.executeArbitrage({
      tokenStart,
      amountIn,
      buyPool,
      sellPool,
      minProfit: minProfit || "0",
    });

    // Record the trade for risk tracking
    await riskManager.recordTrade(result.profit);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/arbitrage/simulate — dry run an arb trade
router.post("/simulate", async (req, res) => {
  try {
    const { tokenStart, amountIn, buyPool, sellPool } = req.body;
    const result = await tradeExecutor.simulateArbitrage({
      tokenStart,
      amountIn,
      buyPool,
      sellPool,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
