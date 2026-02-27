import hre from "hardhat";

async function main() {
  console.log("Deploying LandRegistry contract...");
  
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  
  await landRegistry.waitForDeployment();
  
  const address = await landRegistry.getAddress();
  
  console.log(`LandRegistry deployed to: ${address}`);
  console.log("Save this address for frontend configuration!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
