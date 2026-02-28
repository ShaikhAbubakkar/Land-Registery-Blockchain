import hre from "hardhat";
import fs from "fs";
import path from "path";

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

  const configPath = path.join(process.cwd(), "src", "config.js");
  const configRaw = fs.readFileSync(configPath, "utf-8");

  const updatedConfig = configRaw
    .replace(/(export const CONTRACT_CONFIG = \{[\s\S]*?ADDRESS:\s*")[^"]+("[,\s\S]*?INSPECTOR_ADDRESS:\s*")[^"]+("[\s\S]*?\})/m, `$1${address}$2${inspector.address}$3`);

  fs.writeFileSync(configPath, updatedConfig, "utf-8");

  console.log("✅ src/config.js updated automatically");
  console.log(`  CONTRACT_CONFIG.ADDRESS: "${address}"`);
  console.log(`  CONTRACT_CONFIG.INSPECTOR_ADDRESS: "${inspector.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
