import { useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'
import Registration from './components/Registration'
import SellerDashboard from './components/SellerDashboard'
import BuyerDashboard from './components/BuyerDashboard'
import InspectorDashboard from './components/InspectorDashboard'
import LandRegistryABIV2 from './abi/LandRegistryV2.json'
import { CONTRACT_CONFIG } from './config'
import './App.css'

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [userRole, setUserRole] = useState(null) // 'seller', 'buyer', 'inspector', or null
  const [userName, setUserName] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [switching, setSwitching] = useState(false)
  const infraDropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!infraDropdownRef.current) return
      if (!infraDropdownRef.current.open) return
      if (!infraDropdownRef.current.contains(event.target)) {
        infraDropdownRef.current.open = false
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  const shortenAddress = (value) => {
    if (!value) return ''
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  // Connect wallet
  const connectWallet = async () => {
    try {
      setError(null)
      setLoading(true)
      
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()

      if (network.chainId !== 1337n) {
        setError('Wrong network. Please switch MetaMask to Localhost 8545 (Chain ID 1337).')
        setLoading(false)
        return
      }

      const deployedCode = await provider.getCode(CONTRACT_CONFIG.ADDRESS)
      if (!deployedCode || deployedCode === '0x') {
        setError(`No contract found at ${CONTRACT_CONFIG.ADDRESS} on Localhost 8545. Re-deploy and refresh.`)
        setLoading(false)
        return
      }

      setAccount(accounts[0])
      setProvider(provider)
      setSigner(signer)
      setIsConnected(true)

      const isInspectorAccount =
        accounts[0].toLowerCase() === CONTRACT_CONFIG.INSPECTOR_ADDRESS.toLowerCase()

      if (isInspectorAccount) {
        setUserRole('inspector')
      }

      // Initialize contract
      if (CONTRACT_CONFIG.ADDRESS) {
        try {
          const contractInstance = new ethers.Contract(
            CONTRACT_CONFIG.ADDRESS,
            LandRegistryABIV2,
            signer
          )
          setContract(contractInstance)

          // Check if user is already registered
          try {
            const user = await contractInstance.getUser(accounts[0])
            setUserName(user.name)
            setIsVerified(user.isVerified)
            
            // Map role: 1 = Seller, 2 = Buyer
            if (user.role === 1n) {
              setUserRole('seller')
            } else if (user.role === 2n) {
              setUserRole('buyer')
            }

            if (isInspectorAccount) {
              setUserRole('inspector')
            }
          } catch (err) {
            // User not registered yet
            if (!isInspectorAccount) {
              setUserRole(null)
            }
            setUserName('')
            setIsVerified(false)
            console.log('User not registered:', err.message)
          }
        } catch (contractError) {
          console.error('Contract initialization error:', contractError)
          setError(`Contract Error: ${contractError.message}`)
          setLoading(false)
        }
      } else {
        setError('Contract address not configured')
        setLoading(false)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setError(`Connection Error: ${error.message}`)
      setLoading(false)
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setIsConnected(false)
    setUserRole(null)
    setUserName('')
    setIsVerified(false)
    setError(null)
  }

  // Switch account - prompt MetaMask to show account selector
  const switchAccount = async () => {
    if (switching) return // Prevent duplicate requests
    
    try {
      setSwitching(true)
      
      if (!window.ethereum) {
        alert('MetaMask not detected!')
        setSwitching(false)
        return
      }

      // Request permissions to force account selection popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })

      // After user selects account, reconnect
      disconnectWallet()
      setTimeout(() => {
        connectWallet()
        setSwitching(false)
      }, 200)
    } catch (error) {
      console.error('Error switching account:', error)
      setSwitching(false)
      
      // User cancelled the request
      if (error.code === 4001) {
        console.log('Account switch cancelled by user')
      } else if (error.message && error.message.includes('already pending')) {
        console.log('Request already pending, please wait')
      }
    }
  }

  // Handle registration success
  const handleRegistrationSuccess = (role, name) => {
    setUserRole(role)
    setUserName(name)
    setIsVerified(false) // Newly registered users are not verified yet
  }

  return (
    <div className="container">
      <header className="header">
        <h1>TerraLedger</h1>
        <div className="header-right">
          <details className="infra-dropdown" ref={infraDropdownRef}>
            <summary>Network & Contract</summary>
            <div className="infra-menu">
              <div><strong>Network:</strong> Localhost 8545</div>
              <div><strong>Contract:</strong> {CONTRACT_CONFIG.ADDRESS ? shortenAddress(CONTRACT_CONFIG.ADDRESS) : 'Not configured'}</div>
            </div>
          </details>
          {isConnected ? (
            <div className="connected">
              <span className="account">{account.slice(0, 6)}...{account.slice(-4)}</span>
              {userRole && <span className="role-badge">{userRole.toUpperCase()}</span>}
              <button onClick={switchAccount} className="btn-switch" disabled={switching}>
                {switching ? 'Switching...' : 'Switch Account'}
              </button>
              <button onClick={disconnectWallet} className="btn-disconnect" disabled={switching}>Disconnect</button>
            </div>
          ) : (
            <button onClick={connectWallet} className="btn-connect">Connect MetaMask</button>
          )}
        </div>
      </header>

      {!isConnected && (
        <>
          <div className="alert alert-warning">
            Please connect your MetaMask wallet to get started
          </div>
        </>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {isConnected && !CONTRACT_CONFIG.ADDRESS && (
        <div className="alert alert-info">
          ⚠️ Contract address not configured. Deploy the contract first and update src/config.js
        </div>
      )}

      {isConnected && CONTRACT_CONFIG.ADDRESS && contract && (
        <>
          {userRole === null ? (
            // User not registered - show registration
            <Registration contract={contract} onRegisterSuccess={handleRegistrationSuccess} />
          ) : userRole === 'seller' ? (
            // Seller dashboard
            <SellerDashboard contract={contract} account={account} userName={userName} provider={provider} />
          ) : userRole === 'buyer' ? (
            // Buyer dashboard
            <BuyerDashboard contract={contract} account={account} userName={userName} provider={provider} />
          ) : userRole === 'inspector' ? (
            // Inspector dashboard
            <InspectorDashboard contract={contract} account={account} />
          ) : null}
        </>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">TerraLedger</span>
            <span className="footer-divider">•</span>
            <span className="footer-text">Blockchain Land Registry</span>
          </div>
          <div className="footer-center">
            <span className="footer-text">Building secure property ownership on blockchain</span>
          </div>
          <div className="footer-right">
            <span className="footer-text">&copy; {new Date().getFullYear()} TerraLedger. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
