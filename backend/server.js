require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cron = require("node-cron");

const priceFeed = require("./services/priceFeed");
const arbDetector = require("./services/arbitrageDetector");
const tradeExecutor = require("./services/tradeExecutor");
const riskManager = require("./services/riskManager");

// Routes
const pricesRouter = require("./routes/prices");
const swapRouter = require("./routes/swap");
const arbitrageRouter = require("./routes/arbitrage");
const botRouter = require("./routes/bot");
const tradesRouter = require("./routes/trades");

const app = express();
const server = http.createServer(app);

// CORS — allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://photon-dex.vercel.app",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ============ REST API ROUTES ============
app.use("/api/prices", pricesRouter);
app.use("/api/swap", swapRouter);
app.use("/api/arbitrage", arbitrageRouter);
app.use("/api/bot", botRouter);
app.use("/api/trades", tradesRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    name: "Photon API",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============ WEBSOCKET (Socket.io) ============
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current prices immediately on connect
  socket.emit("prices", priceFeed.getPrices());

  // Send current arb opportunities
  socket.emit("opportunities", arbDetector.getOpportunities());

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============ WIRE UP SERVICES ============

// Price updates → broadcast via WebSocket + feed into arb detector
priceFeed.onUpdate((prices) => {
  io.emit("prices", prices);
  const opps = arbDetector.analyze(prices);
  if (opps.length > 0) {
    io.emit("opportunities", arbDetector.getOpportunities());
    io.emit("newArb", opps);
  }
});

// Arb detector → push new opportunities to all clients
arbDetector.onOpportunity((opp) => {
  io.emit("arbAlert", opp);
});

// ============ STARTUP ============
async function start() {
  // Initialize risk manager (creates DB record if first run)
  await riskManager.init();

  // Initialize trade executor (connects to blockchain)
  tradeExecutor.init();

  // Start price feeds (polls every 5 seconds)
  priceFeed.start();

  // Daily P&L reset at midnight UTC
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Resetting daily P&L");
    await riskManager.resetDaily();
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`
    ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡

       P H O T O N   S E R V E R
       Trade at the speed of light

       REST API:    http://localhost:${PORT}/api
       WebSocket:   ws://localhost:${PORT}
       Health:      http://localhost:${PORT}/api/health

    ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
    `);
  });
}

start().catch(console.error);
