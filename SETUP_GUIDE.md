# Land Registry - Setup & Running Guide

## Project Complete! ✅

Your Land Registry blockchain application is ready. Follow these steps to run it.

---

## Step 1: Start the Local Blockchain

Open a new terminal and run:

```bash
npm run node
```

This starts a local Hardhat blockchain on `http://localhost:8545`

**Output will show:**
- Network information
- Test accounts with their private keys
- You'll see something like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

**Leave this terminal running!** It must stay active while you use the app.

---

## Step 2: Deploy the Smart Contract

Open **another new terminal** (keep the blockchain running in the first one) and run:

```bash
npm run deploy
```

**Output will show:**
```
Deploying LandRegistry contract...
LandRegistry deployed to: 0x5FbDB2315678afccb333f8a9c60582f08f2f4e6f
Save this address for frontend configuration!
```

**✅ Copy this contract address!** You'll need it in Step 4.

---

## Step 3: Install MetaMask & Create a Test Wallet

### If you don't have MetaMask:
1. Go to https://metamask.io/download/
2. Click "Install MetaMask for [your browser]"
3. Add the extension to your browser
4. Click the extension and follow setup instructions to create a wallet

### Unlock your existing MetaMask wallet if needed

---

## Step 4: Connect MetaMask to Local Blockchain

### Add Local Network to MetaMask:

1. **Open MetaMask** in your browser
2. Click the **network dropdown** at the top (says "Ethereum Mainnet" or similar)
3. Scroll down and click **"Add network"** or **"Add a custom network"**

### Fill in these details:

```
Network Name: Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
```

4. Click **Save**

### Now you're on the local network! ✅

---

## Step 5: Import Test Accounts to MetaMask

The Hardhat blockchain creates 20 test accounts. Let's import one:

### Get a Private Key:
- Look at the terminal where `npm run node` is running
- You'll see accounts listed like:
```
Account #0: 0x... (balance: 10000 ETH)
Private Key: 0x...
```

### Import Account:
1. In MetaMask, click the **profile icon** (top right)
2. Click **"Import Account"**
3. Paste the **Private Key** from the Hardhat output
4. Click **"Import"**

**Now your test account has 10,000 fake ETH!** 🎉

---

## Step 6: Configure Contract Address in Frontend

1. Open: `src/config.js`
2. Find this line:
```javascript
ADDRESS: null,
```
3. Replace `null` with your deployed contract address (from Step 2):
```javascript
ADDRESS: "0x5FbDB2315678afccb333f8a9c60582f08f2f4e6f",
```
4. Save the file

---

## Step 7: Start the Frontend

Open **another new terminal** (keep blockchain and MetaMask running) and run:

```bash
npm run dev
```

**Output will show:**
```
VITE v7.3.1 ready in ... ms

➜  Local:   http://localhost:3000/
```

The app will automatically open in your browser at `http://localhost:3000`

---

## Step 8: Use the Application

### In the browser:
1. Click **"Connect MetaMask"** button
2. MetaMask will ask for permission - **Click "Next"** then **"Connect"**
3. You'll see your connected account address

### Now you can:
- **Register Land**: Add new land parcels
- **Transfer Ownership**: Transfer land to another address
- **View Lands**: See all lands you own
- **View History**: See complete ownership history

---

## 🔧 Troubleshooting

### "Contract address not configured"
- Make sure you updated `src/config.js` with the deployed contract address

### "No lands registered yet"
- Click "Register Land" to add a land parcel

### MetaMask says "wrong network"
- Switch to "Localhost" network in MetaMask dropdown

### Balance shows 0
- Import another test account (from Hardhat output)
- Make sure Hardhat blockchain is still running

### "MetaMask is not installed"
- Install MetaMask from https://metamask.io/download/

---

## 📝 Common Workflows

### Transfer Land to Another Account:
1. Get the receiving wallet address (from another MetaMask account)
2. Note the Land ID (from "My Lands" section)
3. Fill in "Transfer Ownership" form
4. Click Transfer

### View Complete History:
1. Click "View History" button on any land
2. See all previous owners and dates

---

## ✅ Success Checklist

- [ ] Hardhat blockchain running (`npm run node`)
- [ ] Contract deployed (`npm run deploy`)
- [ ] MetaMask installed and configured
- [ ] MetaMask connected to localhost network
- [ ] Test account imported with test ETH
- [ ] Contract address updated in `src/config.js`
- [ ] Frontend running (`npm run dev`)
- [ ] Can connect MetaMask wallet
- [ ] Can register land
- [ ] Can view lands

---

## 🚀 You're All Set!

Enjoy your Land Registry blockchain application! 🏠⛓️
