const { ethers } = require("hardhat");

// Contract to deploy
const contractPath = "contracts/ERC20.sol:ERC20";

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

    // Get Signer
    const [signer] = await ethers.getSigners();

    const name = "MyERC-20_Token";
    const symbol = "PCIB";
    const maxSupply = ethers.utils.parseEther("1000000");
   
    // Deploy student contract
    const contractFactory = await ethers.getContractFactory(contractPath, signer);
    const contractInstance = await contractFactory.deploy(name, symbol, maxSupply);

    /// --------------------------------------------------------------------------------------------------
    console.log("-- Contract Address:", contractInstance.address);
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