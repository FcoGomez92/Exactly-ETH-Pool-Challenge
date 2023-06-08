const hre = require("hardhat");
const { ethers } = hre;
const { getSavedContractAddresses } = require("./utils");

async function main() {
  const provider = ethers.provider;
  const ethPoolAddress = await getSavedContractAddresses()[hre.network.name];

  let poolBalance = await provider.getBalance(ethPoolAddress);
  console.log(
    "ETH HELD IN THE CONTRACT: --------",
    ethers.utils.formatEther(poolBalance)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
