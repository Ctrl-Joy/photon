// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPool {
    function swap(address tokenIn, uint256 amountIn) external returns (uint256);
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256);
    function getPrice() external view returns (uint256);
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
 * @title PhotonRouter
 * @notice DEX aggregator router that finds the best price across multiple pools
 *         and routes swaps to the optimal venue. This is the core swap interface
 *         users interact with — similar to 1inch's routing contract.
 */
contract PhotonRouter {
    address public owner;
    address[] public registeredPools;

    struct Quote {
        address pool;
        uint256 amountOut;
        string poolName;
    }

    event SwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address pool,
        uint256 timestamp
    );

    event PoolRegistered(address pool, string name);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Register a new DEX pool for aggregation
    function registerPool(address pool) external onlyOwner {
        registeredPools.push(pool);
        emit PoolRegistered(pool, IPool(pool).poolName());
    }

    /// @notice Get quotes from all registered pools for a given swap
    /// @return quotes Array of quotes from each pool that supports this pair
    function getQuotes(
        address tokenIn,
        uint256 amountIn
    ) external view returns (Quote[] memory) {
        Quote[] memory tempQuotes = new Quote[](registeredPools.length);
        uint256 validCount = 0;

        for (uint256 i = 0; i < registeredPools.length; i++) {
            IPool pool = IPool(registeredPools[i]);
            address t0 = pool.token0();
            address t1 = pool.token1();

            if (tokenIn == t0 || tokenIn == t1) {
                uint256 amountOut = pool.getAmountOut(tokenIn, amountIn);
                if (amountOut > 0) {
                    tempQuotes[validCount] = Quote({
                        pool: registeredPools[i],
                        amountOut: amountOut,
                        poolName: pool.poolName()
                    });
                    validCount++;
                }
            }
        }

        // Copy to correctly sized array
        Quote[] memory quotes = new Quote[](validCount);
        for (uint256 i = 0; i < validCount; i++) {
            quotes[i] = tempQuotes[i];
        }
        return quotes;
    }

    /// @notice Find the best pool offering highest output for a swap
    function getBestQuote(
        address tokenIn,
        uint256 amountIn
    ) public view returns (address bestPool, uint256 bestAmountOut, string memory bestPoolName) {
        for (uint256 i = 0; i < registeredPools.length; i++) {
            IPool pool = IPool(registeredPools[i]);
            address t0 = pool.token0();
            address t1 = pool.token1();

            if (tokenIn == t0 || tokenIn == t1) {
                uint256 amountOut = pool.getAmountOut(tokenIn, amountIn);
                if (amountOut > bestAmountOut) {
                    bestAmountOut = amountOut;
                    bestPool = registeredPools[i];
                    bestPoolName = pool.poolName();
                }
            }
        }
    }

    /// @notice Execute a swap through the best available pool
    /// @param tokenIn Token to sell
    /// @param amountIn Amount to sell
    /// @param minAmountOut Minimum acceptable output (slippage protection)
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        (address bestPool, uint256 expectedOut, ) = getBestQuote(tokenIn, amountIn);
        require(bestPool != address(0), "No pool found");
        require(expectedOut >= minAmountOut, "Slippage exceeded");

        // Transfer tokens from user to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve pool to spend tokens
        IERC20(tokenIn).approve(bestPool, amountIn);

        // Execute swap through best pool
        amountOut = IPool(bestPool).swap(tokenIn, amountIn);
        require(amountOut >= minAmountOut, "Output below minimum");

        // Determine output token
        IPool pool = IPool(bestPool);
        address tokenOut = tokenIn == pool.token0()
            ? address(pool.token1())
            : address(pool.token0());

        // Send output tokens to user
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            bestPool,
            block.timestamp
        );
    }

    /// @notice Get all registered pool addresses
    function getPools() external view returns (address[] memory) {
        return registeredPools;
    }

    /// @notice Get count of registered pools
    function getPoolCount() external view returns (uint256) {
        return registeredPools.length;
    }
}
