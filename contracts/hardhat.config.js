require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};