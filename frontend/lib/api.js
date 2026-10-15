const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API request failed");
  return data.data;
}

// Prices
export const getPrices = () => fetchAPI("/api/prices");
export const getPriceHistory = (token, dex, limit = 100) =>
  fetchAPI(`/api/prices/history?token=${token}&dex=${dex}&limit=${limit}`);

// Swap
export const getSwapQuote = (tokenIn, amountIn) =>
  fetchAPI(`/api/swap/quote?tokenIn=${tokenIn}&amountIn=${amountIn}`);
export const executeSwap = (data) =>
  fetchAPI("/api/swap", { method: "POST", body: JSON.stringify(data) });

// Arbitrage
export const getOpportunities = () => fetchAPI("/api/arbitrage/opportunities");
export const executeArbitrage = (data) =>
  fetchAPI("/api/arbitrage/execute", { method: "POST", body: JSON.stringify(data) });
export const simulateArbitrage = (data) =>
  fetchAPI("/api/arbitrage/simulate", { method: "POST", body: JSON.stringify(data) });

// Bot
export const getBotStatus = () => fetchAPI("/api/bot/status");
export const toggleBot = (enabled) =>
  fetchAPI("/api/bot/toggle", { method: "POST", body: JSON.stringify({ enabled }) });
export const updateRiskParams = (params) =>
  fetchAPI("/api/bot/risk", { method: "PUT", body: JSON.stringify(params) });

// Trades
export const getTradeHistory = (limit = 50) => fetchAPI(`/api/trades/history?limit=${limit}`);
export const getTradeStats = () => fetchAPI("/api/trades/stats");
