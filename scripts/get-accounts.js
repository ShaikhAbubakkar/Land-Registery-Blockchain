import hre from "hardhat";

async function main() {
  console.log("\n🔑 Hardhat Test Accounts with Private Keys\n");
  console.log("These accounts have 10,000 ETH each on your local blockchain\n");
  console.log("=" .repeat(80));
  
  // Hardhat's default test private keys (same for everyone using Hardhat)
  const defaultPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
  ];
  
  // Get the test accounts
  const accounts = await hre.ethers.getSigners();
  
  // Display first 5 accounts with their private keys
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    
    console.log(`\nAccount #${i}:`);
    console.log(`  Address:     ${account.address}`);
    console.log(`  Balance:     ${balanceInEth} ETH`);
    console.log(`  Private Key: ${defaultPrivateKeys[i]}`);
    
    console.log("-".repeat(80));
  }
  
  console.log("\n📋 To import into MetaMask:");
  console.log("  1. Open MetaMask");
  console.log("  2. Click profile icon → 'Import Account'");
  console.log("  3. Copy any Private Key from above");
  console.log("  4. Paste and click 'Import'\n");
  console.log("  ✅ You'll now have 10,000 ETH to use!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
