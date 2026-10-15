const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy Mock Tokens
  console.log("\n--- Deploying Mock Tokens ---");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
  await weth.waitForDeployment();
  console.log("WETH deployed:", await weth.getAddress());

  const usdc = await MockERC20.deploy("USD Coin", "USDC", 18);
  await usdc.waitForDeployment();
  console.log("USDC deployed:", await usdc.getAddress());

  const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
  await dai.waitForDeployment();
  console.log("DAI deployed:", await dai.getAddress());

  // 2. Deploy Mock Pools (3 DEXs with different prices = arbitrage opportunities)
  console.log("\n--- Deploying Mock Pools ---");
  const MockUniswapPool = await hre.ethers.getContractFactory("MockUniswapPool");

  // Pool A: "UniPool" — WETH/USDC at ~2000 USDC per ETH, 0.3% fee
  const poolA = await MockUniswapPool.deploy(
    await weth.getAddress(),
    await usdc.getAddress(),
    "UniPool",
    30
  );
  await poolA.waitForDeployment();
  console.log("Pool A (UniPool) deployed:", await poolA.getAddress());

  // Pool B: "SushiPool" — WETH/USDC at ~2050 USDC per ETH, 0.25% fee
  const poolB = await MockUniswapPool.deploy(
    await weth.getAddress(),
    await usdc.getAddress(),
    "SushiPool",
    25
  );
  await poolB.waitForDeployment();
  console.log("Pool B (SushiPool) deployed:", await poolB.getAddress());

  // Pool C: "CurvePool" — USDC/DAI at ~1:1, 0.04% fee
  const poolC = await MockUniswapPool.deploy(
    await usdc.getAddress(),
    await dai.getAddress(),
    "CurvePool",
    4
  );
  await poolC.waitForDeployment();
  console.log("Pool C (CurvePool) deployed:", await poolC.getAddress());

  // 3. Deploy Photon Router
  console.log("\n--- Deploying Photon Router ---");
  const PhotonRouter = await hre.ethers.getContractFactory("PhotonRouter");
  const router = await PhotonRouter.deploy();
  await router.waitForDeployment();
  console.log("PhotonRouter deployed:", await router.getAddress());

  // 4. Deploy Arbitrage Executor
  const PhotonExecutor = await hre.ethers.getContractFactory("PhotonExecutor");
  const arbExecutor = await PhotonExecutor.deploy();
  await arbExecutor.waitForDeployment();
  console.log("PhotonExecutor deployed:", await arbExecutor.getAddress());

  // 5. Register pools in router
  console.log("\n--- Registering Pools ---");
  await router.registerPool(await poolA.getAddress());
  await router.registerPool(await poolB.getAddress());
  await router.registerPool(await poolC.getAddress());
  console.log("All pools registered in router");

  // 6. Mint tokens and add liquidity
  console.log("\n--- Adding Liquidity ---");
  const mintAmount = hre.ethers.parseEther("1000000"); // 1M tokens each

  // Mint tokens to deployer
  await weth.mint(deployer.address, mintAmount);
  await usdc.mint(deployer.address, mintAmount);
  await dai.mint(deployer.address, mintAmount);

  // Approve pools
  await weth.approve(await poolA.getAddress(), mintAmount);
  await usdc.approve(await poolA.getAddress(), mintAmount);
  await weth.approve(await poolB.getAddress(), mintAmount);
  await usdc.approve(await poolB.getAddress(), mintAmount);
  await usdc.approve(await poolC.getAddress(), mintAmount);
  await dai.approve(await poolC.getAddress(), mintAmount);

  // Add liquidity with different ratios to create price differences
  // Pool A: 100 WETH / 200,000 USDC → price = 2000 USDC/WETH
  await poolA.addLiquidity(
    hre.ethers.parseEther("100"),
    hre.ethers.parseEther("200000")
  );

  // Pool B: 100 WETH / 205,000 USDC → price = 2050 USDC/WETH
  await poolB.addLiquidity(
    hre.ethers.parseEther("100"),
    hre.ethers.parseEther("205000")
  );

  // Pool C: 500,000 USDC / 500,000 DAI → price = 1:1
  await poolC.addLiquidity(
    hre.ethers.parseEther("500000"),
    hre.ethers.parseEther("500000")
  );

  console.log("Liquidity added to all pools");

  // 7. Mint demo tokens to deployer for testing
  console.log("\n--- Minting Demo Tokens ---");
  await weth.mint(deployer.address, hre.ethers.parseEther("100"));
  await usdc.mint(deployer.address, hre.ethers.parseEther("500000"));
  await dai.mint(deployer.address, hre.ethers.parseEther("500000"));
  console.log("Demo tokens minted");

  // Print summary
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  const addresses = {
    WETH: await weth.getAddress(),
    USDC: await usdc.getAddress(),
    DAI: await dai.getAddress(),
    PoolA_UniPool: await poolA.getAddress(),
    PoolB_SushiPool: await poolB.getAddress(),
    PoolC_CurvePool: await poolC.getAddress(),
    PhotonRouter: await router.getAddress(),
    PhotonExecutor: await arbExecutor.getAddress(),
  };

  for (const [name, addr] of Object.entries(addresses)) {
    console.log(`${name}: ${addr}`);
  }

  console.log("\nSave these addresses in your .env file!");
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
