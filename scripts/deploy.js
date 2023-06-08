const hre = require("hardhat");
const { saveContractAddress, saveContractAbis } = require("./utils");

async function main() {
  const ETHPool = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPool.deploy();
  await ethPool.deployed();

  console.log("ETHPool deployed with address: ", ethPool.address);
  saveContractAddress(hre.network.name, "ETHPool", ethPool.address);

  const ethPoolArtifact = await hre.artifacts.readArtifact("ETHPool");
  saveContractAbis(
    hre.network.name,
    "ETHPool",
    ethPoolArtifact.abi,
    hre.network.name
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
