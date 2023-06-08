// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

/**
 * @title Exactly-protocol. Solidity-challenge
 * @author Francisco Gomez. @FcoGomez92_
 * @notice This contract have been developed only for this challenge purposes, not being audited. Use at your own risk.
 */
contract ETHPool {
    // Pool info
    struct PoolInfo {
        // Total of ETH deposited in the pool by the users
        uint256 deposits;
        // Rewards of the pool added by team member
        uint256 rewards;
    }

    // Current deposit info for a user
    struct DepositInfo {
        // Amount of ETH deposited
        uint256 amount;
        // ID of the pool that the user deposited
        uint256 poolId;
    }

    // team member address
    address public teamMember;
    // ID of current pool
    uint256 public currentPoolId;
    // Used to record the pool info and relate it to its ID
    mapping(uint256 => PoolInfo) public poolId;
    // Used to record the current deposit info of a user and relate it to its address
    mapping(address => DepositInfo) public usersDeposits;

    /**
     * @notice Fires when a user deposits in the current pool
     */
    event Deposit(
        address indexed user,
        uint256 indexed amount,
        uint256 indexed poolId
    );

    /**
     * @notice Fires when a user makes a withdraw
     */
    event Withdraw(
        address indexed user,
        uint256 indexed amount,
        uint256 indexed poolId
    );

    /**
     * @notice Fires when team member add rewards to the current pool
     */
    event AddRewards(uint256 indexed amount, uint256 indexed poolId);

    /**
     * @notice Contructor assign teamMember variable to the contract owner, and initialize currentPoolId
     */
    constructor() {
        teamMember = msg.sender;
        currentPoolId = 1;
    }

    /**
     * @notice function is creating a new deposit for a user in the current pool
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit can't be zero");

        DepositInfo storage user = usersDeposits[msg.sender];
        require(user.amount == 0, "User have deposited before");

        PoolInfo storage pool = poolId[currentPoolId];

        pool.deposits += msg.value;

        user.amount = msg.value;
        user.poolId = currentPoolId;

        emit Deposit(msg.sender, user.amount, user.poolId);
    }

    /**
     * @notice function is adding rewards to the current pool, and closing it to new deposits by increment currentPoolId variable
     */
    function addRewards() external payable {
        require(msg.sender == teamMember, "Only the team can add rewards");

        uint256 _currentPoolId = currentPoolId;

        PoolInfo storage pool = poolId[_currentPoolId];

        require(pool.deposits > 0, "The pool is empty");

        pool.rewards = msg.value;

        currentPoolId++;

        emit AddRewards(msg.value, _currentPoolId);
    }

    /**
     * @notice function withdraw the amount deposited in the pool for a user plus rewards if applicable, and reset the user deposit info to default values
     */
    function withdraw() external payable {
        DepositInfo storage user = usersDeposits[msg.sender];

        require(user.amount > 0, "User can't withdraw");

        uint256 _userPoolId = user.poolId;

        PoolInfo memory pool = poolId[_userPoolId];

        uint256 _userRewards = _calcUserRewards(
            user.amount,
            pool.rewards,
            pool.deposits
        );
        uint256 _pendingAmount = user.amount + _userRewards;

        user.amount = 0;
        user.poolId = 0;

        (bool sent, ) = payable(msg.sender).call{value: _pendingAmount}("");
        require(sent, "Failed to send ETH");

        emit Withdraw(msg.sender, _pendingAmount, _userPoolId);
    }

    /**
     * @notice function is calculating the user rewards based in user share of the pool
     *
     * @param _userAmount - Amount deposited in the pool by the user
     * @param _poolRewards - Total rewards of the pool added by the team member
     * @param _poolDeposits - Total deposits of the pool
     *
     * @return uint256 - Rewards for the user
     */
    function _calcUserRewards(
        uint256 _userAmount,
        uint256 _poolRewards,
        uint256 _poolDeposits
    ) internal pure returns (uint256) {
        return
            _userAmount == _poolDeposits
                ? _poolRewards
                : (_userAmount * _poolRewards) / _poolDeposits;
    }
}
