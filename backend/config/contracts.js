/**
 * Contract ABIs and addresses config.
 * ABIs are minimal — only the functions we actually call.
 */

const ROUTER_ABI = [
  "function getQuotes(address tokenIn, uint256 amountIn) view returns (tuple(address pool, uint256 amountOut, string poolName)[])",
  "function getBestQuote(address tokenIn, uint256 amountIn) view returns (address bestPool, uint256 bestAmountOut, string bestPoolName)",
  "function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  "function getPools() view returns (address[])",
  "function getPoolCount() view returns (uint256)",
  "event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, address pool, uint256 timestamp)",
];

const EXECUTOR_ABI = [
  "function executeArbitrage(address tokenStart, uint256 amountIn, address buyPool, address sellPool, uint256 minProfit) returns (uint256 profit)",
  "function simulateArbitrage(address tokenStart, uint256 amountIn, address buyPool, address sellPool) view returns (uint256 expectedProfit, bool isProfitable)",
  "function getStats() view returns (uint256 totalArbitrages, uint256 totalProfit, bool botEnabled, uint256 maxTradeSize, uint256 dailyLossLimit, uint256 dailyLoss)",
  "function getArbHistory(uint256 count) view returns (tuple(address tokenIn, uint256 amountIn, uint256 amountOut, uint256 profit, address buyPool, address sellPool, uint256 timestamp)[])",
  "function enableBot()",
  "function disableBot()",
  "function setRiskParams(uint256 maxTradeSize, uint256 dailyLossLimit)",
  "event ArbitrageExecuted(address indexed executor, address tokenStart, uint256 amountIn, uint256 amountOut, uint256 profit, address buyPool, address sellPool, uint256 timestamp)",
];

const POOL_ABI = [
  "function getPrice() view returns (uint256)",
  "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function poolName() view returns (string)",
  "function swap(address tokenIn, uint256 amountIn) returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
];

module.exports = {
  ROUTER_ABI,
  EXECUTOR_ABI,
  POOL_ABI,
  ERC20_ABI,
  addresses: {
    router: process.env.ROUTER_ADDRESS || "",
    executor: process.env.EXECUTOR_ADDRESS || "",
    weth: process.env.WETH_ADDRESS || "",
    usdc: process.env.USDC_ADDRESS || "",
    dai: process.env.DAI_ADDRESS || "",
    poolA: process.env.POOL_A_ADDRESS || "",
    poolB: process.env.POOL_B_ADDRESS || "",
    poolC: process.env.POOL_C_ADDRESS || "",
  },
};
