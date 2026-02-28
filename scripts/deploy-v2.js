import hre from "hardhat";

async function main() {
  console.log("Deploying LandRegistryV2 contract...\n");
  
  const [deployer, inspector] = await hre.ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("Inspector:", inspector.address);
  console.log("");
  
  const LandRegistryV2 = await hre.ethers.getContractFactory("LandRegistryV2");
  const landRegistry = await LandRegistryV2.deploy(inspector.address);
  
  await landRegistry.waitForDeployment();
  
  const address = await landRegistry.getAddress();
  
  console.log("✅ LandRegistryV2 deployed successfully!");
  console.log("");
  console.log("Contract Address:", address);
  console.log("Inspector Address:", inspector.address);
  console.log("");
  console.log("📝 Update these in src/config.js:");
  console.log(`  V2_ADDRESS: "${address}"`);
  console.log(`  INSPECTOR_ADDRESS: "${inspector.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
