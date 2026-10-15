// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPool {
    function swap(address tokenIn, uint256 amountIn) external returns (uint256);
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function poolName() external view returns (string memory);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title PhotonExecutor
 * @notice Executes atomic cross-DEX arbitrage. Buys from the cheaper pool
 *         and sells on the expensive pool in a single transaction.
 *         If the trade isn't profitable, the entire transaction reverts
 *         (no funds lost). This is the core arbitrage engine.
 *
 *         Key feature: ATOMIC execution — either the whole arb succeeds
 *         and you profit, or it reverts and you pay only gas.
 */
contract PhotonExecutor {
    address public owner;
    uint256 public totalArbitrages;
    uint256 public totalProfit;
    bool public botEnabled;

    // Risk management
    uint256 public maxTradeSize;
    uint256 public dailyLossLimit;
    uint256 public dailyLoss;
    uint256 public lastResetDay;

    struct ArbResult {
        address tokenIn;
        uint256 amountIn;
        uint256 amountOut;
        uint256 profit;
        address buyPool;
        address sellPool;
        uint256 timestamp;
    }

    ArbResult[] public arbHistory;

    event ArbitrageExecuted(
        address indexed executor,
        address tokenStart,
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit,
        address buyPool,
        address sellPool,
        uint256 timestamp
    );

    event BotStatusChanged(bool enabled);
    event RiskParamsUpdated(uint256 maxTradeSize, uint256 dailyLossLimit);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenBotEnabled() {
        require(botEnabled, "Bot is disabled");
        _;
    }

    constructor() {
        owner = msg.sender;
        botEnabled = true;
        maxTradeSize = 10000 * 1e18;     // 10,000 tokens max per trade
        dailyLossLimit = 1000 * 1e18;    // 1,000 tokens max daily loss
        lastResetDay = block.timestamp / 1 days;
    }

    /// @notice Check and reset daily loss counter if new day
    function _checkDailyReset() internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastResetDay) {
            dailyLoss = 0;
            lastResetDay = currentDay;
        }
    }

    /**
     * @notice Execute atomic arbitrage between two pools
     * @param tokenStart The token we start and end with
     * @param amountIn How much tokenStart to use
     * @param buyPool Pool where tokenStart is cheaper (we buy here)
     * @param sellPool Pool where tokenStart is expensive (we sell here)
     * @param minProfit Minimum profit required or tx reverts
     *
     * Flow:
     *   1. Swap tokenStart → tokenMid on buyPool (buy cheap)
     *   2. Swap tokenMid → tokenStart on sellPool (sell expensive)
     *   3. Verify profit >= minProfit, or revert entire transaction
     */
    function executeArbitrage(
        address tokenStart,
        uint256 amountIn,
        address buyPool,
        address sellPool,
        uint256 minProfit
    ) external onlyOwner whenBotEnabled returns (uint256 profit) {
        _checkDailyReset();
        require(amountIn <= maxTradeSize, "Exceeds max trade size");
        require(dailyLoss < dailyLossLimit, "Daily loss limit reached");

        // Transfer tokens from executor to this contract
        IERC20(tokenStart).transferFrom(msg.sender, address(this), amountIn);

        // Step 1: Swap tokenStart → tokenMid on buyPool
        IERC20(tokenStart).approve(buyPool, amountIn);
        uint256 midAmount = IPool(buyPool).swap(tokenStart, amountIn);

        // Determine the intermediate token
        IPool bp = IPool(buyPool);
        address tokenMid = tokenStart == bp.token0()
            ? address(bp.token1())
            : address(bp.token0());

        // Step 2: Swap tokenMid → tokenStart on sellPool
        IERC20(tokenMid).approve(sellPool, midAmount);
        uint256 finalAmount = IPool(sellPool).swap(tokenMid, midAmount);

        // Step 3: Calculate profit and verify
        require(finalAmount > amountIn, "No profit — reverting");
        profit = finalAmount - amountIn;
        require(profit >= minProfit, "Below minimum profit");

        // Update stats
        totalArbitrages++;
        totalProfit += profit;

        arbHistory.push(ArbResult({
            tokenIn: tokenStart,
            amountIn: amountIn,
            amountOut: finalAmount,
            profit: profit,
            buyPool: buyPool,
            sellPool: sellPool,
            timestamp: block.timestamp
        }));

        // Return all tokens (including profit) to executor
        IERC20(tokenStart).transfer(msg.sender, finalAmount);

        emit ArbitrageExecuted(
            msg.sender,
            tokenStart,
            amountIn,
            finalAmount,
            profit,
            buyPool,
            sellPool,
            block.timestamp
        );
    }

    /// @notice Simulate an arbitrage without executing (dry run)
    function simulateArbitrage(
        address tokenStart,
        uint256 amountIn,
        address buyPool,
        address sellPool
    ) external view returns (uint256 expectedProfit, bool isProfitable) {
        // Step 1: How much tokenMid do we get from buyPool?
        uint256 midAmount = IPool(buyPool).getAmountOut(tokenStart, amountIn);

        // Step 2: Determine tokenMid
        IPool bp = IPool(buyPool);
        address tokenMid = tokenStart == bp.token0()
            ? address(bp.token1())
            : address(bp.token0());

        // Step 3: How much tokenStart do we get back from sellPool?
        uint256 finalAmount = IPool(sellPool).getAmountOut(tokenMid, midAmount);

        if (finalAmount > amountIn) {
            expectedProfit = finalAmount - amountIn;
            isProfitable = true;
        }
    }

    // ============ BOT CONTROLS ============

    function enableBot() external onlyOwner {
        botEnabled = true;
        emit BotStatusChanged(true);
    }

    function disableBot() external onlyOwner {
        botEnabled = false;
        emit BotStatusChanged(false);
    }

    function setRiskParams(uint256 _maxTradeSize, uint256 _dailyLossLimit) external onlyOwner {
        maxTradeSize = _maxTradeSize;
        dailyLossLimit = _dailyLossLimit;
        emit RiskParamsUpdated(_maxTradeSize, _dailyLossLimit);
    }

    // ============ VIEW FUNCTIONS ============

    function getStats() external view returns (
        uint256 _totalArbitrages,
        uint256 _totalProfit,
        bool _botEnabled,
        uint256 _maxTradeSize,
        uint256 _dailyLossLimit,
        uint256 _dailyLoss
    ) {
        return (totalArbitrages, totalProfit, botEnabled, maxTradeSize, dailyLossLimit, dailyLoss);
    }

    function getArbHistory(uint256 count) external view returns (ArbResult[] memory) {
        uint256 len = arbHistory.length;
        uint256 start = len > count ? len - count : 0;
        uint256 resultLen = len - start;

        ArbResult[] memory results = new ArbResult[](resultLen);
        for (uint256 i = 0; i < resultLen; i++) {
            results[i] = arbHistory[start + i];
        }
        return results;
    }
}
