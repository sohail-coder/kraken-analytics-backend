// scripts/deploy-mocketh.js

const hre = require("hardhat");

async function main() {
  // Compile contracts if not already compiled
  await hre.run("compile");

  // Get the ContractFactory for MockETH
  const MockETH = await hre.ethers.getContractFactory("MockETH");

  // Deploy the contract
  const mockETH = await MockETH.deploy();

  // Wait for deployment to be mined (Ethers v6)
  await mockETH.waitForDeployment();

  // Get the deployed contract's address
  console.log("MockETH deployed to:", mockETH.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying MockETH:", error);
    process.exit(1);
  });
