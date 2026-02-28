import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

function BuyerDashboard({ contract, account, userName }) {
  const [availableLands, setAvailableLands] = useState([])
  const [myLands, setMyLands] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [tab, setTab] = useState('browse') // browse, myPurchases, myRequests
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedLand, setSelectedLand] = useState(null)

  const shortAddr = (value) => {
    if (!value) return 'N/A'
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  useEffect(() => {
    loadBuyerData()
  }, [contract, account])

  const loadBuyerData = async () => {
    try {
      setLoading(true)

      // Get available lands
      const lands = await contract.getAvailableLands()
      setAvailableLands(lands.map((land) => ({
        id: land.id.toString(),
        seller: land.seller,
        location: land.location,
        area: land.area.toString(),
        price: land.price.toString(),
        imageURL: land.imageURL, // Make sure to include imageURL
        isAvailable: Boolean(land.isAvailable)
      })))

      // Get buyer's lands (purchased lands)
      const buyerLands = await contract.getSellerLands(account)
      setMyLands(buyerLands.map((land) => ({
        id: land.id.toString(),
        seller: land.seller,
        location: land.location,
        area: land.area.toString(),
        price: land.price.toString(),
        imageURL: land.imageURL, // Make sure to include imageURL
        isAvailable: Boolean(land.isAvailable)
      })))

      // Get buyer's requests
      const requests = await contract.getBuyerRequests(account)
      // Filter for requests where this user is the buyer
      const buyerRequests = requests.filter(
        (req) => typeof req.buyer === 'string' && req.buyer.toLowerCase() === account.toLowerCase()
      )
      setMyRequests(buyerRequests.map((req) => ({
        id: req.id.toString(),
        landId: req.landId.toString(),
        buyer: req.buyer,
        seller: req.seller,
        price: req.price.toString(),
        status: Number(req.status),
        paymentReceived: Boolean(req.paymentReceived)
      })))
    } catch (error) {
      console.error('Error loading buyer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showRequestConfirmation = (land) => {
    setSelectedLand(land)
    setShowConfirmModal(true)
  }

  const handleConfirmRequest = async () => {
    if (!selectedLand) return

    setLoading(true)
    setMessage('')

    try {
      const priceInWei = selectedLand.price
      const tx = await contract.requestLand(selectedLand.id, { value: priceInWei })
      setMessage('Sending request... Please wait')
      setShowConfirmModal(false)
      await tx.wait()
      
      setMessage('✅ Request sent! Waiting for seller approval.')
      loadBuyerData()
    } catch (error) {
      setMessage(`❌ Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
      setSelectedLand(null)
    }
  }

  const formatEthPrice = (weiPrice) => {
    try {
      return ethers.formatEther(weiPrice)
    } catch {
      return 'N/A'
    }
  }

  const getPlaceholderSVG = (landId) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23e5e7eb' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em' font-family='Arial'%3ELand %23${landId}%3C/text%3E%3C/svg%3E`
  }

  const getImageSource = (imageKey) => {
    // If imageKey looks like a localStorage key, try to retrieve it
    if (imageKey && imageKey.startsWith('land_image_')) {
      try {
        const imageData = localStorage.getItem(imageKey)
        if (imageData) return imageData
      } catch (e) {
        console.error('Error retrieving image:', e)
      }
    }
    // Fallback to placeholder
    return null
  }

  return (
    <div className="dashboard buyer-dashboard">
      <div className="dashboard-header">
        <h1>Buyer Dashboard</h1>
        <p>Welcome, {userName}</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'browse' ? 'active' : ''}`}
          onClick={() => setTab('browse')}
        >
          Browse Lands ({availableLands.length})
        </button>
        <button
          className={`tab-btn ${tab === 'myPurchases' ? 'active' : ''}`}
          onClick={() => setTab('myPurchases')}
        >
          My Purchases ({myLands.length})
        </button>
        <button
          className={`tab-btn ${tab === 'myRequests' ? 'active' : ''}`}
          onClick={() => setTab('myRequests')}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      <div className="dashboard-content">
        {tab === 'browse' && (
          <div>
            <h2>Available Lands</h2>
            {availableLands.length === 0 ? (
              <p className="no-data">No lands available for purchase</p>
            ) : (
              <div className="lands-grid">
                {availableLands.map(land => (
                  <div key={land.id} className="land-card">
                    <div className="land-image">
                      <img 
                        src={getImageSource(land.imageURL) || getPlaceholderSVG(land.id)} 
                        alt={`Land ${land.id}`}
                        onError={(e) => e.target.src = getPlaceholderSVG(land.id)}
                      />
                    </div>
                    <h3>Land #{land.id}</h3>
                    <div className="land-details">
                      <p><strong>Location:</strong> {land.location}</p>
                      <p><strong>Area:</strong> {land.area} sq meters</p>
                      <p><strong>Price:</strong> {formatEthPrice(land.price)} ETH</p>
                      <p><strong>Seller:</strong> {shortAddr(land.seller)}</p>
                    </div>
                    <button
                      onClick={() => showRequestConfirmation(land)}
                      disabled={loading}
                      className="btn-primary"
                    >
                      Request to Buy
                    </button>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {showConfirmModal && selectedLand && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h2>Confirm Land Purchase</h2>
                  <div className="modal-body">
                    <p><strong>Land ID:</strong> {selectedLand.id}</p>
                    <p><strong>Location:</strong> {selectedLand.location}</p>
                    <p><strong>Area:</strong> {selectedLand.area} sq meters</p>
                    <p><strong>Seller:</strong> {shortAddr(selectedLand.seller)}</p>
                    <div className="price-highlight">
                      <p><strong>Purchase Price:</strong></p>
                      <p className="price-amount">{formatEthPrice(selectedLand.price)} ETH</p>
                      <p className="price-note">This amount will be sent to the contract and held until the inspector finalizes the transfer.</p>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false)
                        setSelectedLand(null)
                      }}
                      className="btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRequest}
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Confirm & Send Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'myPurchases' && (
          <div>
            <h2>My Purchases</h2>
            {myLands.length === 0 ? (
              <p className="no-data">You haven't purchased any lands yet</p>
            ) : (
              <div className="lands-grid">
                {myLands.map(land => (
                  <div key={land.id} className="land-card">
                    <div className="land-image">
                      <img 
                        src={getImageSource(land.imageURL) || getPlaceholderSVG(land.id)} 
                        alt={`Land ${land.id}`}
                        onError={(e) => e.target.src = getPlaceholderSVG(land.id)}
                      />
                    </div>
                    <div className="land-status">✅ Owned</div>
                    <h3>Land #{land.id}</h3>
                    <div className="land-details">
                      <p><strong>Location:</strong> {land.location}</p>
                      <p><strong>Area:</strong> {land.area} sq meters</p>
                      <p><strong>Current Owner:</strong> {shortAddr(land.seller)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'myRequests' && (
          <div>
            <h2>My Purchase Requests</h2>
            {myRequests.length === 0 ? (
              <p className="no-data">No purchase requests yet</p>
            ) : (
              <div className="requests-list">
                {myRequests.map(req => (
                  <div key={req.id} className="request-card">
                    <h3>Request #{req.id} - Land #{req.landId}</h3>
                    <div className="request-details">
                      <p><strong>Seller:</strong> {shortAddr(req.seller)}</p>
                      <p><strong>Amount:</strong> {formatEthPrice(req.price)} ETH</p>
                      <p><strong>Status:</strong> {
                        req.status === 0 ? '⏳ Pending - Waiting for seller approval' :
                        req.status === 1 ? '✅ Approved - Ready for finalization' :
                        req.status === 2 ? '❌ Rejected' : '🎉 Completed - Land transferred'
                      }</p>
                      <p><strong>Payment:</strong> {req.paymentReceived ? '✅ Sent' : '⏳ Pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyerDashboard
