// Configuration for the deployed contract
// Update this file with your contract address after deployment

export const CONTRACT_CONFIG = {
  // Update this with your deployed contract address
  ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // e.g., "0x..."
  
  // Network configuration for local testing
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
