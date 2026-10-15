// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title MockUniswapPool
 * @notice Simulates a Uniswap-style AMM pool with x*y=k constant product formula.
 *         Each pool holds two tokens and allows swaps between them.
 *         Price is determined by reserve ratios — different pools can have
 *         different prices, creating arbitrage opportunities for the demo.
 */
contract MockUniswapPool {
    IERC20 public token0;
    IERC20 public token1;
    string public poolName;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public fee; // basis points (e.g., 30 = 0.3%)

    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1);
    event Swap(
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut,
        uint256 newReserve0,
        uint256 newReserve1
    );

    constructor(
        address _token0,
        address _token1,
        string memory _poolName,
        uint256 _fee
    ) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        poolName = _poolName;
        fee = _fee;
    }

    /// @notice Add liquidity to the pool — sets initial reserves or adds proportionally
    function addLiquidity(uint256 amount0, uint256 amount1) external {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        reserve0 += amount0;
        reserve1 += amount1;
        emit LiquidityAdded(msg.sender, amount0, amount1);
    }

    /// @notice Swap tokenIn for tokenOut using constant product formula
    /// @param tokenIn Address of the token being sold
    /// @param amountIn Amount of tokenIn to sell
    /// @return amountOut Amount of tokenOut received
    function swap(address tokenIn, uint256 amountIn) external returns (uint256 amountOut) {
        require(
            tokenIn == address(token0) || tokenIn == address(token1),
            "Invalid token"
        );

        bool isToken0 = tokenIn == address(token0);

        (uint256 reserveIn, uint256 reserveOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        // Transfer tokens in
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Apply fee: amountInAfterFee = amountIn * (10000 - fee) / 10000
        uint256 amountInAfterFee = (amountIn * (10000 - fee)) / 10000;

        // Constant product: x * y = k
        // newReserveIn = reserveIn + amountInAfterFee
        // amountOut = reserveOut - (k / newReserveIn)
        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);

        // Update reserves
        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        // Transfer tokens out
        address tokenOut = isToken0 ? address(token1) : address(token0);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, amountIn, tokenOut, amountOut, reserve0, reserve1);
    }

    /// @notice Get the current price of token0 in terms of token1
    function getPrice() external view returns (uint256) {
        if (reserve0 == 0) return 0;
        return (reserve1 * 1e18) / reserve0;
    }

    /// @notice Calculate expected output for a given input (read-only)
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        bool isToken0 = tokenIn == address(token0);
        (uint256 reserveIn, uint256 reserveOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        uint256 amountInAfterFee = (amountIn * (10000 - fee)) / 10000;
        return (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
    }

    /// @notice Get pool reserves
    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }
}
