const express = require("express");
const router = express.Router();
const tradeExecutor = require("../services/tradeExecutor");
const priceFeed = require("../services/priceFeed");

// POST /api/swap — execute a token swap through the best pool
router.post("/", async (req, res) => {
  try {
    const { tokenIn, amountIn, minAmountOut, userAddress } = req.body;

    if (!tokenIn || !amountIn) {
      return res.status(400).json({ success: false, error: "tokenIn and amountIn required" });
    }

    const result = await tradeExecutor.executeSwap({
      tokenIn,
      amountIn,
      minAmountOut: minAmountOut || "0",
      userAddress: userAddress || "demo",
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/swap/quote?tokenIn=0x...&amountIn=1.0
router.get("/quote", (req, res) => {
  const { tokenIn, amountIn } = req.query;
  const prices = priceFeed.getPrices();

  // Simulate quotes from different pools
  const amount = parseFloat(amountIn || "1");
  const quotes = [
    {
      pool: "UniPool",
      amountOut: (amount * (prices.unipool?.WETH_USDC || 2000)).toFixed(4),
      fee: "0.3%",
    },
    {
      pool: "SushiPool",
      amountOut: (amount * (prices.sushipool?.WETH_USDC || 2050)).toFixed(4),
      fee: "0.25%",
    },
  ];

  const best = quotes.reduce((a, b) =>
    parseFloat(a.amountOut) > parseFloat(b.amountOut) ? a : b
  );

  res.json({
    success: true,
    data: { quotes, bestRoute: best, savings: "0.00" },
  });
});

module.exports = router;
