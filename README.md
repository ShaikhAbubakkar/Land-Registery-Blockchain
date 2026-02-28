# TerraLedger

Professional blockchain-based land registry platform with role-based workflows for Seller, Buyer, and Inspector using Solidity, Hardhat, React, and Ethers.js.

## Overview

TerraLedger is a decentralized application (dApp) that digitalizes land registration and transfer workflows. It implements a controlled process where:

- Sellers register land records
- Buyers place purchase requests with on-chain payment
- Inspectors verify users and finalize ownership transfer

This architecture improves transparency, traceability, and trust while preserving the final approval authority through an inspector role.

## Core Features

- Role-based onboarding: `Seller`, `Buyer`, `Inspector`
- Inspector-driven user verification before transactions
- Land registration with metadata (`location`, `area`, `price`, image reference)
- Buyer purchase requests with escrow-like payment flow
- Seller approval/rejection of requests
- Inspector finalization of approved transfers
- Automatic refund flow on rejection
- Dashboard UX for all three roles with status tracking
- MetaMask wallet integration and live ETH balance display (Seller/Buyer)

## Technology Stack

- Smart Contracts: Solidity `0.8.20`
- Development Framework: Hardhat
- Frontend: React `19` + Vite `7`
- Web3 Library: Ethers.js `6`
- Local Network: Hardhat Network (`chainId: 1337`, RPC: `http://127.0.0.1:8545`)

## High-Level Workflow

1. User connects MetaMask.
2. User registers as Seller or Buyer.
3. Inspector verifies user.
4. Seller registers available land.
5. Buyer submits request with exact payment amount.
6. Seller approves (or rejects) request.
7. Inspector finalizes approved request and ownership is transferred.
8. Payment is released to the seller.

## Prerequisites

Ensure the following are installed:

- Node.js `>= 18`
- npm `>= 9`
- MetaMask browser extension

## Getting Started

### Option A (Recommended): One-command startup

```bash
npm install
npm run up
```

`npm run up` will:

1. Start a local Hardhat node (if not already running)
2. Deploy `LandRegistryV2`
3. Auto-sync `src/config.js` with contract and inspector addresses
4. Start the Vite frontend

### Option B: Manual startup (multi-terminal)

Terminal 1:

```bash
npm run node
```

Terminal 2:

```bash
npm run deploy
```

Terminal 3:

```bash
npm run dev
```

Then open the app URL shown by Vite (typically `http://localhost:5173`).

## MetaMask Setup (Multiple Seller/Buyer Accounts)

To test multiple users:

1. Run `npm run node`
2. Copy private keys printed for Hardhat test accounts
3. In MetaMask, use **Import account** for each key
4. Ensure MetaMask is connected to:
	 - Network Name: `Localhost 8545`
	 - RPC URL: `http://127.0.0.1:8545`
	 - Chain ID: `1337`
	 - Currency Symbol: `ETH`

Note: `npm run up` is optimized for convenience, while `npm run node` is best when you need visible test account private keys.

## Available Scripts

```bash
npm run node      # Start local Hardhat node
npm run deploy    # Deploy LandRegistryV2 to localhost
npm run accounts  # Print account information against localhost
npm run up        # Start node (if needed), deploy, and run frontend
npm run dev       # Start frontend in development mode
npm run build     # Build production assets
npm run preview   # Preview production build
npm run test      # Run Hardhat tests
```

## Project Structure

```text
BDLT-MP-v2/
├─ contracts/                # Solidity contracts
│  └─ LandRegistryV2.sol
├─ scripts/                  # Deployment & helper scripts
│  ├─ deploy-v2.js
│  ├─ get-accounts.js
│  └─ up.mjs
├─ src/
│  ├─ components/            # React dashboards & registration UI
│  ├─ abi/                   # Contract ABI artifacts used by frontend
│  ├─ config.js              # Active contract/network configuration
│  ├─ App.jsx
│  └─ App.css
├─ test/                     # Hardhat tests
├─ hardhat.config.js
└─ package.json
```

## Smart Contract Notes

`LandRegistryV2` provides:

- User registry with role and verification state
- Land registry and seller ownership mapping
- Request lifecycle enum:
	- `Pending`
	- `Approved`
	- `Rejected`
	- `Completed`
- Inspector-only transfer finalization
- Controlled fund flow for request rejection/approval paths

## Troubleshooting

### Port `8545` already in use (`EADDRINUSE`)

```bash
lsof -i :8545 | awk '{print $2}' | xargs kill -9
```

Then restart:

```bash
npm run node
```

### Wrong network in MetaMask

If the app shows network mismatch, switch MetaMask to Localhost `8545` with chain ID `1337`.

### Contract not found

If contract address is invalid or stale:

```bash
npm run deploy
```

This re-deploys and updates `src/config.js` automatically.

## Security & Scope Notes

- This project is designed for local development and educational demonstration.
- Private keys shown by Hardhat are test-only keys; never use in production.
- Additional audits, access controls, and production infrastructure are required before real-world deployment.

## License

This project is currently distributed under the `ISC` license as defined in `package.json`.
