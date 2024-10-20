// scripts/deploy-purchase-simulator.js

const hre = require("hardhat");

async function main() {
  // Compile contracts if not already compiled
  await hre.run('compile');

  // Get the ContractFactory
  const PurchaseSimulator = await hre.ethers.getContractFactory("PurchaseSimulator");

  // Deploy the contract
  const purchaseSimulator = await PurchaseSimulator.deploy();

  // Wait for deployment to be mined (Ethers v6)
  await purchaseSimulator.waitForDeployment();

  // Get the deployed contract's address
  console.log("PurchaseSimulator deployed to:", purchaseSimulator.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying PurchaseSimulator:", error);
    process.exit(1);
  });
