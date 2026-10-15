const express = require("express");
const router = express.Router();
const riskManager = require("../services/riskManager");

// GET /api/bot/status — current bot state and risk params
router.get("/status", async (req, res) => {
  try {
    const state = await riskManager.getState();
    res.json({ success: true, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bot/toggle — start/stop the bot
router.post("/toggle", async (req, res) => {
  try {
    const { enabled } = req.body;
    const state = await riskManager.toggleBot(enabled);
    res.json({
      success: true,
      data: state,
      message: enabled ? "⚡ Photon Bot activated" : "🛑 Photon Bot paused",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/bot/risk — update risk management parameters
router.put("/risk", async (req, res) => {
  try {
    const { dailyLossLimit, maxTradeSize } = req.body;
    const state = await riskManager.updateParams({ dailyLossLimit, maxTradeSize });
    res.json({ success: true, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bot/reset-daily — reset daily P&L counter
router.post("/reset-daily", async (req, res) => {
  try {
    await riskManager.resetDaily();
    res.json({ success: true, message: "Daily P&L reset" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
