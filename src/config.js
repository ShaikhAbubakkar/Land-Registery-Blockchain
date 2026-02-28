// Configuration for the deployed contracts
// Update this file with contract addresses after deployment

// V1 (Simple direct transfer - deprecated, kept for reference)
export const CONTRACT_CONFIG_V1 = {
  ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  NETWORK: {
    name: "localhost",
    chainId: 1337,
    rpcUrl: "http://127.0.0.1:8545"
  }
}

// V2 (Role-based with approval workflow)
export const CONTRACT_CONFIG = {
  VERSION: "V2",
  ADDRESS: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  INSPECTOR_ADDRESS: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  NETWORK: {
    name: "localhost",
    chainId: 1337,
    rpcUrl: "http://127.0.0.1:8545"
  }
}

export const NETWORK_CONFIG = {
  localhost: {
    name: "localhost",
    chainId: 1337,
    rpcUrl: "http://127.0.0.1:8545"
  },
  sepolia: {
    name: "sepolia",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
  }
}
