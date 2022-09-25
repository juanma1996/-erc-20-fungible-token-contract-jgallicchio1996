require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('solidity-coverage');
require('hardhat-contract-sizer');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.16",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    ganache: {
      chainId: 1337,
      url: process.env.GANACHE_ACCESSPOINT_URL,
      from: process.env.GANACHE_ACCOUNT,
      accounts: [process.env.GANACHE_PRIVATE_KEY]
    },

    rinkeby: {
        chainId:  4,
        timeout:  20000,
        gasPrice: 8000000000,
        gas:      "auto",
        name:     "Rinkeby",		
        url:      process.env.RINKEBY_ACCESSPOINT_URL,
        from:     process.env.RINKEBY_ACCOUNT,
        accounts: [process.env.RINKEBY_PRIVATE_KEY]
	  }
  }
};
