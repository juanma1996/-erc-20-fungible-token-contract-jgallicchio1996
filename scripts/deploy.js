const { ethers } = require("hardhat");

// Contract to deploy
const CONTRACT_NAME = "ERC20";
const contractPath = "contracts/ERC20.sol:ERC20";

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

    // Get Signer
    const [signer] = await ethers.getSigners();
   
    // Deploy ERC20 contract
    const contractFactory = await ethers.getContractFactory(contractPath, signer);
    const amount = ethers.utils.parseEther("1");
    const contractInstance = await contractFactory.deploy({value: amount});


    console.log("-- Contract Address:\t", contractInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Contracts have been successfully deployed");
    console.log("---------------------------------------------------------------------------------------");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });