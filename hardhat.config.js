require("@nomicfoundation/hardhat-toolbox");
require("solidity-docgen");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.7",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.RINKEBY_ACCOUNT],
    },
  },
};
