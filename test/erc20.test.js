const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

const chai = require("chai");
const { solidity } = require( "ethereum-waffle");
const { ConstructorFragment } = require("ethers/lib/utils");
const { sign } = require("crypto");
chai.use(solidity);
const { expect } = chai;

const contractPath = "contracts/ERC20.sol:ERC20";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;

// Constructor parameters
const name = "MyERC-20_Token";
const symbol = "PCIB";
const maxSupply = ethers.utils.parseEther("800");

describe("Contract tests", () => {
    before(async () => {
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Contract tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3] = await ethers.getSigners();
        provider = ethers.provider;

        // Deploy contract
        const contractFactory = await ethers.getContractFactory(contractPath, signer);
        contractInstance = await contractFactory.deploy(name, symbol, maxSupply);
    });

    describe("Constructor tests", () => {
        it("Try send empty name", async () => {
            const contractFactory = await ethers.getContractFactory(contractPath, signer);
            await expect(contractFactory.deploy("", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _name");
        });

        it("Try send empty symbol", async () => {
            const contractFactory = await ethers.getContractFactory(contractPath, signer);
            await expect(contractFactory.deploy("Test", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _symbol");
        });

        it("Initialization test", async () => {
            const receivedName = await contractInstance.name();
            const receivedSymbol = await contractInstance.symbol();
            const receivedmaxSupply = await contractInstance.maxSupply();

            expect(receivedName).to.be.equals(name);
            expect(receivedSymbol).to.be.equals(symbol);
            expect(receivedmaxSupply).to.be.equals(maxSupply);
        });
    });

    describe("Mint tests", () => {
        it("Try mint zero amount", async () => {
            const amountToMint = ethers.utils.parseEther("0");
            await expect(contractInstance.mint(signer.address, {value: amountToMint})).to.be.revertedWith("mint - Invalid ether amount");
        });
        
        it("Try mint _recipient is zero address ", async () => {
            const amountToMint = ethers.utils.parseEther("1");
            await expect(contractInstance.mint(zeroAddress, {value: amountToMint})).to.be.revertedWith("mint - Invalid parameter: _recipient");
        });

        it("Try mint total supply overcame the maximum supply ", async () => {
            const amountToMint = maxSupply + 1;
            await expect(contractInstance.mint(signer.address, {value: amountToMint})).to.be.revertedWith("mint - Total supply exceeds maximum supply");
        });

        it("Mint successful", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const totalSupplyBefore = await contractInstance.totalSupply();
            
            const amountToMint = ethers.utils.parseEther("200");
            const tx = await contractInstance.mint(signer.address, {value: amountToMint});

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const totalSupplyAfter = await contractInstance.totalSupply();

            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) + parseInt(amountToMint));
            expect(parseInt(totalSupplyAfter)).to.be.lessThanOrEqual(parseInt(totalSupplyBefore) + parseInt(amountToMint));

            // Check event emited
            const eventSignature = "Transfer(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(zeroAddress);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(signer.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToMint);
        });
    });

    describe("Transfer tests", () => {
        it("Try use _to zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transfer(zeroAddress, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _to");
        });

        it("Try _to is sender account", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transfer(signer.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid recipient, same as remittent");
        });

        it("Try _value is zero", async () => {
            const amountToTransfer = ethers.utils.parseEther("0");
            await expect(contractInstance.transfer(account2.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _value");
        });

        it("Try remittent account has insufficient balance", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            const newInstance = await contractInstance.connect(account1);
            await expect(newInstance.transfer(account2.address, amountToTransfer)).to.be.revertedWith("transfer - Insufficient balance");
        });

        it("Transfer successful", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const account1BalanceBefore = await contractInstance.balanceOf(account1.address);
            
            const amountToTransfer = ethers.utils.parseEther("1");
            const tx = await contractInstance.transfer(account1.address, amountToTransfer);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const account1BalanceAfter = await contractInstance.balanceOf(account1.address);
            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
            expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));

            // Check event emited
            const eventSignature = "Transfer(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToTransfer);
        });
    });

    describe("Approve tests", () => {
        it("Try use _spender zero address", async () => {
            const amountToApprove = ethers.utils.parseEther("1");
            await expect(contractInstance.approve(zeroAddress, amountToApprove)).to.be.revertedWith("approve - Invalid parameter: _spender");
        });

        it("Try _value exceeds the sender's balance", async () => {
            const amountToApprove = ethers.utils.parseEther("2000");
            await expect(contractInstance.approve(signer.address, amountToApprove)).to.be.revertedWith("approve - Insufficient balance");
        });

        it("Approve _spender successful", async () => {
            const spenderAllowanceBefore = await contractInstance.allowance(signer.address, account1.address);
            
            const amountToApprove = ethers.utils.parseEther("3");
            const tx = await contractInstance.approve(account1.address, amountToApprove);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const spenderAllowanceAfter = await contractInstance.allowance(signer.address, account1.address);
            expect(parseInt(spenderAllowanceAfter)).to.be.lessThanOrEqual(parseInt(spenderAllowanceBefore) + parseInt(amountToApprove));

            // Check event emited
            const eventSignature = "Approval(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToApprove);
        });

        it("Allowance tries to be set to a new value", async () => {
            const amountToApprove = ethers.utils.parseEther("12");
            await expect(contractInstance.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Invalid allowance amount. Set to zero first");
        });

        it("Allowance tries to be set to a new value, then zero and then higher than zero", async () => {
            const amountToApprove = ethers.utils.parseEther("12");
            await expect(contractInstance.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Invalid allowance amount. Set to zero first");
            
            const tx = await contractInstance.approve(account1.address, 0);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const spenderAllowanceAfter = await contractInstance.allowance(signer.address, account1.address);
            expect(parseInt(spenderAllowanceAfter)).to.be.lessThanOrEqual(0);

            const tx1 = await contractInstance.approve(account1.address, ethers.utils.parseEther("10"));

            tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
            if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const spenderAllowanceAfter1 = await contractInstance.allowance(signer.address, account1.address);
            expect(parseInt(spenderAllowanceAfter1)).to.be.lessThanOrEqual(parseInt(ethers.utils.parseEther("10")));
        });

    });

    describe("TransferFrom tests", () => {
        it("Try use _from zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(zeroAddress, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _from");
        });

        it("Try use _to zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(signer.address, zeroAddress, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _to");
        });

        it("Try use _to is the same as _from account", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(signer.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid recipient, same as remittent");
        });

        it("Try _value is zero", async () => {
            const amountToTransfer = ethers.utils.parseEther("0");
            await expect(contractInstance.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _value");
        });

        it("Try TransferFrom with insufficient balance", async () => {
            const amountToTransfer = ethers.utils.parseEther("2000");
            await expect(contractInstance.transferFrom(account2.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficient balance");
        });

        it("Try TransferFrom with no allowance", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(account1.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficent allowance");
        });

        it("Try TransferFrom with insufficent allowance", async () => {
            const amountToTransfer = ethers.utils.parseEther("30");
            const newInstance = await contractInstance.connect(account1);
            await expect(newInstance.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficent allowance");
        });  

        it("TransferFrom successful", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const account1BalanceBefore = await contractInstance.balanceOf(account1.address);
            
            const amountToTransfer = ethers.utils.parseEther("1");
            const tx = await contractInstance.transferFrom(signer.address, account1.address, amountToTransfer);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const account1BalanceAfter = await contractInstance.balanceOf(account1.address);
            expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
            expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));

            // Check event emited
            const eventSignature = "Transfer(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToTransfer);
        });
    });

    describe("Burn tests", () => {
        it("Try _from is zero address", async () => {
            const amountToBurn = ethers.utils.parseEther("1");
            await expect(contractInstance.burn(zeroAddress, amountToBurn)).to.be.revertedWith("burn - Invalid parameter: _from");
        });
        
        it("Try _value is zero amount", async () => {
            const amountToBurn = ethers.utils.parseEther("0");
            await expect(contractInstance.burn(signer.address, amountToBurn)).to.be.revertedWith("burn - Invalid parameter: _value");
        });

        it("Try _from account has insufficient tokens to burn", async () => {
            const amountToBurn = ethers.utils.parseEther("200000");
            await expect(contractInstance.burn(signer.address, amountToBurn)).to.be.revertedWith("burn - Insufficient balance");
        });

        it("Try to burn from unauthorized account", async () => {
            const amountToBurn = ethers.utils.parseEther("1");
            await expect(contractInstance.burn(account1.address, amountToBurn)).to.be.revertedWith("burn - Insufficent allowance");
        });

        it("Try to burn an amount that overcame the allowance of an approved account", async () => {
            const newInstance = await contractInstance.connect(account1);
            const amountToBurn = ethers.utils.parseEther("2000");
            await expect(newInstance.burn(signer.address, amountToBurn)).to.be.revertedWith("burn - Insufficient balance");
        });

        it("Burn 5 tokens from signer account", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const totalSupplyBefore = await contractInstance.totalSupply();

            const amountToBurn = ethers.utils.parseEther("5");
            const tx = await contractInstance.burn(signer.address, amountToBurn);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const totalSupplyAfter = await contractInstance.totalSupply();

            expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) - parseInt(amountToBurn));
            expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) - parseInt(amountToBurn));

            // Check event emited
            const eventSignature = "Burn(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventCommandedByParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventCommandedByParametrReceived).to.be.equals(signer.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToBurn);
        });
    });
});