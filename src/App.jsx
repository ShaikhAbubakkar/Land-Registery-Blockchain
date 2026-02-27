import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import RegisterLand from './components/RegisterLand'
import TransferOwnership from './components/TransferOwnership'
import ViewLands from './components/ViewLands'
import LandRegistryABI from './abi/LandRegistry.json'
import { CONTRACT_CONFIG } from './config'
import './App.css'

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [contractAddress, setContractAddress] = useState(CONTRACT_CONFIG.ADDRESS)

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      setAccount(accounts[0])
      setProvider(provider)
      setSigner(signer)
      setIsConnected(true)

      // Initialize contract if address is set
      if (contractAddress) {
        const contractInstance = new ethers.Contract(
          contractAddress,
          LandRegistryABI,
          signer
        )
        setContract(contractInstance)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Error connecting wallet')
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setIsConnected(false)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Land Registry</h1>
        <div className="header-right">
          {isConnected ? (
            <div className="connected">
              <span className="account">{account.slice(0, 6)}...{account.slice(-4)}</span>
              <button onClick={disconnectWallet} className="btn-disconnect">Disconnect</button>
            </div>
          ) : (
            <button onClick={connectWallet} className="btn-connect">Connect MetaMask</button>
          )}
        </div>
      </header>

      {!isConnected && (
        <div className="alert alert-warning">
          Please connect your MetaMask wallet to get started
        </div>
      )}

      {isConnected && !contractAddress && (
        <div className="alert alert-info">
          ⚠️ Contract address not configured. Deploy the contract first and update contractAddress in src/config.js
        </div>
      )}

      {isConnected && contractAddress && contract && (
        <div className="main-content">
          <div className="section">
            <RegisterLand contract={contract} signer={signer} />
          </div>

          <div className="section">
            <TransferOwnership contract={contract} signer={signer} />
          </div>

          <div className="section">
            <ViewLands contract={contract} account={account} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
