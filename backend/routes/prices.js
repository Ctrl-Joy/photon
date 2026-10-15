const express = require("express");
const router = express.Router();
const priceFeed = require("../services/priceFeed");
const prisma = require("../config/db");

// GET /api/prices — current prices from all sources
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: priceFeed.getPrices(),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/prices/history?token=WETH&dex=UniPool&limit=100
router.get("/history", async (req, res) => {
  try {
    const { token, dex, limit = 100 } = req.query;
    const where = {};
    if (token) where.token = token;
    if (dex) where.dexName = dex;

    const snapshots = await prisma.priceSnapshot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    res.json({ success: true, data: snapshots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
