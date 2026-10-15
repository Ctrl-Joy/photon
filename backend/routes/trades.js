const express = require("express");
const router = express.Router();
const profitCalculator = require("../services/profitCalculator");

// GET /api/trades/history — recent trade history
router.get("/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50");
    const trades = await profitCalculator.getTradeHistory(limit);
    res.json({ success: true, data: trades });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/trades/stats — P&L performance metrics
router.get("/stats", async (req, res) => {
  try {
    const stats = await profitCalculator.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
