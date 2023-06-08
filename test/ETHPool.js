const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const ALICE_DEPOSIT = ethers.utils.parseEther("100");
const BOB_DEPOSIT = ethers.utils.parseEther("300");
const POOL_REWARDS = ethers.utils.parseEther("200");
const SCENARIO1_ALICE_REWARD = ethers.utils.parseEther("150");
const SCENARIO1_BOB_REWARD = ethers.utils.parseEther("450");

describe("ETHPool", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployETHPoolFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const Pool = await ethers.getContractFactory("ETHPool");
    const pool = await Pool.deploy();

    return { pool, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should set current pool ID to 1", async function () {
      const { pool } = await loadFixture(deployETHPoolFixture);

      expect(await pool.currentPoolId()).to.equal(1);
    });

    it("Should set team member to contract owner", async function () {
      const { pool, owner } = await loadFixture(deployETHPoolFixture);

      expect(await pool.teamMember()).to.equal(owner.address);
    });
  });

  describe("Alice deposits", function () {
    it("Deposit with value 0 should be reverted", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await expect(
        pool.connect(alice).deposit({ value: ethers.utils.parseEther("0") })
      ).to.be.revertedWith("Deposit can't be zero");
    });

    it("Deposit of 100 ETH should set deposit info properly", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      const depositInfo = await pool.usersDeposits(alice.address);

      expect(depositInfo.amount).to.equal(ALICE_DEPOSIT);
      expect(depositInfo.poolId).to.equal(await pool.currentPoolId());
    });

    it("Deposit of 100 ETH should add 100ETH to pool deposits", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      const depositInfo = await pool.usersDeposits(alice.address);
      const poolInfo = await pool.poolId(depositInfo.poolId);

      expect(poolInfo.deposits).to.equal(ALICE_DEPOSIT);
    });

    it("Should revert if a user already have an active deposit and deposit again", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      await expect(
        pool.connect(alice).deposit({ value: ethers.utils.parseEther("10") })
      ).to.be.revertedWith("User have deposited before");
    });
  });
  describe("Bob deposits", function () {
    it("Deposit of 300 ETH should set deposit info properly", async function () {
      const { pool, alice, bob } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      await pool.connect(bob).deposit({ value: BOB_DEPOSIT });

      const depositInfo = await pool.usersDeposits(bob.address);

      expect(depositInfo.amount).to.equal(BOB_DEPOSIT);
      expect(depositInfo.poolId).to.equal(await pool.currentPoolId());
    });

    it("Deposit of 300 ETH should add 300ETH to current pool deposits", async function () {
      const { pool, alice, bob } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      await pool.connect(bob).deposit({ value: BOB_DEPOSIT });

      const depositInfo = await pool.usersDeposits(bob.address);
      const poolInfo = await pool.poolId(depositInfo.poolId);

      expect(poolInfo.deposits).to.equal(ALICE_DEPOSIT.add(BOB_DEPOSIT));
    });
  });

  describe("Team Member Add Rewards", function () {
    it("Should revert if sender is not a team member", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await expect(
        pool.connect(alice).addRewards({ value: POOL_REWARDS })
      ).to.be.revertedWith("Only the team can add rewards");
    });

    it("Should revert if the pool don't have any deposit", async function () {
      const { pool } = await loadFixture(deployETHPoolFixture);

      await expect(pool.addRewards({ value: POOL_REWARDS })).to.be.revertedWith(
        "The pool is empty"
      );
    });

    it("Add 200ETH to pool rewards should update pool info properly", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      const currentPoolId = await pool.currentPoolId();

      await pool.addRewards({ value: POOL_REWARDS });
      const poolInfo = await pool.poolId(currentPoolId);

      expect(poolInfo.rewards).to.equal(POOL_REWARDS);
    });

    it("Add the rewards to the pool should add +1 to current pool Id", async function () {
      const { pool, alice, bob } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      await pool.connect(bob).deposit({ value: BOB_DEPOSIT });
      const startingPoolId = await pool.currentPoolId();

      await pool.addRewards({ value: POOL_REWARDS });
      const endPoolId = await pool.currentPoolId();

      expect(endPoolId).to.equal(startingPoolId.add(1));
    });
  });

  describe("Withdrawals", function () {
    it("Should revert if the sender has not deposited to the pool", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await expect(pool.connect(alice).withdraw()).to.be.revertedWith(
        "User can't withdraw"
      );
    });

    it("Should reset the user deposit info to default values after a withdraw", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      await pool.addRewards({ value: POOL_REWARDS });

      let depositInfo = await pool.usersDeposits(alice.address);

      expect(depositInfo.amount).to.not.equal(0);
      expect(depositInfo.poolId).to.not.equal(0);

      await pool.connect(alice).withdraw();
      depositInfo = await pool.usersDeposits(alice.address);

      expect(depositInfo.amount).to.equal(0);
      expect(depositInfo.poolId).to.equal(0);
    });

    it("Scenario 1: Alice should receive 150ETH and Bob should receive 450ETH", async function () {
      const { pool, alice, bob } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });
      await pool.connect(bob).deposit({ value: BOB_DEPOSIT });

      await pool.addRewards({ value: POOL_REWARDS });

      await expect(pool.connect(alice).withdraw()).to.changeEtherBalances(
        [alice, pool],
        [SCENARIO1_ALICE_REWARD, ethers.utils.parseEther("-150")]
      );
      await expect(pool.connect(bob).withdraw()).to.changeEtherBalances(
        [bob, pool],
        [SCENARIO1_BOB_REWARD, ethers.utils.parseEther("-450")]
      );
    });

    it("Scenario 2: Alice should receive all rewards and Bob should receive only his deposit", async function () {
      const { pool, alice, bob } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      await pool.addRewards({ value: POOL_REWARDS });

      await pool.connect(bob).deposit({ value: BOB_DEPOSIT });

      await expect(pool.connect(alice).withdraw()).to.changeEtherBalances(
        [alice, pool],
        [ALICE_DEPOSIT.add(POOL_REWARDS), ethers.utils.parseEther("-300")]
      );
      await expect(pool.connect(bob).withdraw()).to.changeEtherBalances(
        [bob, pool],
        [BOB_DEPOSIT, ethers.utils.parseEther("-300")]
      );
    });
  });

  describe("Events", function () {
    it("Should emit an event on users deposits", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await expect(pool.connect(alice).deposit({ value: ALICE_DEPOSIT }))
        .to.emit(pool, "Deposit")
        .withArgs(alice.address, ALICE_DEPOSIT, anyValue);
    });

    it("Should emit an event when a team member add rewards to the pool", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      await expect(pool.addRewards({ value: POOL_REWARDS }))
        .to.emit(pool, "AddRewards")
        .withArgs(POOL_REWARDS, anyValue);
    });

    it("Should emit an event on users withdrawals", async function () {
      const { pool, alice } = await loadFixture(deployETHPoolFixture);

      await pool.connect(alice).deposit({ value: ALICE_DEPOSIT });

      await pool.addRewards({ value: POOL_REWARDS });

      await expect(pool.connect(alice).withdraw())
        .to.emit(pool, "Withdraw")
        .withArgs(alice.address, ALICE_DEPOSIT.add(POOL_REWARDS), anyValue);
    });
  });
});
