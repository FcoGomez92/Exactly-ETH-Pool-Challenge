# Solidity API

## ETHPool

This contract have been developed only for this challenge purposes, not being audited. Use at your own risk.

### PoolInfo

```solidity
struct PoolInfo {
  uint256 deposits;
  uint256 rewards;
}
```

### DepositInfo

```solidity
struct DepositInfo {
  uint256 amount;
  uint256 poolId;
}
```

### teamMember

```solidity
address teamMember
```

### currentPoolId

```solidity
uint256 currentPoolId
```

### poolId

```solidity
mapping(uint256 => struct ETHPool.PoolInfo) poolId
```

### usersDeposits

```solidity
mapping(address => struct ETHPool.DepositInfo) usersDeposits
```

### Deposit

```solidity
event Deposit(address user, uint256 amount, uint256 poolId)
```

Fires when a user deposits in the current pool

### Withdraw

```solidity
event Withdraw(address user, uint256 amount, uint256 poolId)
```

Fires when a user makes a withdraw

### AddRewards

```solidity
event AddRewards(uint256 amount, uint256 poolId)
```

Fires when team member add rewards to the current pool

### constructor

```solidity
constructor() public
```

Contructor assign teamMember variable to the contract owner, and initialize currentPoolId

### deposit

```solidity
function deposit() external payable
```

function is creating a new deposit for a user in the current pool

### addRewards

```solidity
function addRewards() external payable
```

function is adding rewards to the current pool, and closing it to new deposits by increment currentPoolId variable

### withdraw

```solidity
function withdraw() external payable
```

function withdraw the amount deposited in the pool for a user plus rewards if applicable, and reset the user deposit info to default values

### _calcUserRewards

```solidity
function _calcUserRewards(uint256 _userAmount, uint256 _poolRewards, uint256 _poolDeposits) internal pure returns (uint256)
```

function is calculating the user rewards based in user share of the pool

| Name | Type | Description |
| ---- | ---- | ----------- |
| _userAmount | uint256 | - Amount deposited in the pool by the user |
| _poolRewards | uint256 | - Total rewards of the pool added by the team member |
| _poolDeposits | uint256 | - Total deposits of the pool |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 - Rewards for the user |

