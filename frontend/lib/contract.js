"use client";
import { ethers } from "ethers";

const ROUTER_ABI = [
  "function getQuotes(address tokenIn, uint256 amountIn) view returns (tuple(address pool, uint256 amountOut, string poolName)[])",
  "function getBestQuote(address tokenIn, uint256 amountIn) view returns (address bestPool, uint256 bestAmountOut, string bestPoolName)",
  "function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) returns (uint256)",
  "function getPools() view returns (address[])",
  "event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, address pool, uint256 timestamp)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
];

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // Switch to Sepolia if needed
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${CHAIN_ID.toString(16)}`,
          chainName: "Sepolia Testnet",
          rpcUrls: ["https://rpc.sepolia.org"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        }],
      });
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return {
    address: accounts[0],
    provider,
    signer,
  };
}

export function getRouterContract(signer) {
  const routerAddress = process.env.NEXT_PUBLIC_ROUTER_ADDRESS;
  if (!routerAddress) return null;
  return new ethers.Contract(routerAddress, ROUTER_ABI, signer);
}

export function getTokenContract(tokenAddress, signer) {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
}

export function formatAmount(wei, decimals = 18) {
  return parseFloat(ethers.formatUnits(wei, decimals)).toFixed(4);
}

export function parseAmount(amount, decimals = 18) {
  return ethers.parseUnits(amount.toString(), decimals);
}
