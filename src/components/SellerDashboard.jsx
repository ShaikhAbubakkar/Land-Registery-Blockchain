import { useState, useEffect } from 'react'

function SellerDashboard({ contract, account, userName, provider }) {
  const [lands, setLands] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('myLands') // myLands, addLand, requests
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [ethBalance, setEthBalance] = useState('0')
  const [formData, setFormData] = useState({
    location: '',
    area: '',
    price: '',
    imageURL: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageKey, setImageKey] = useState(null) // Track image key separately
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const shortAddr = (value) => {
    if (!value || typeof value !== 'string') return 'N/A'
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const getRequestStatusLabel = (status) => {
    const statusNum = Number(status)
    if (statusNum === 0) return 'Pending'
    if (statusNum === 1) return 'Approved'
    if (statusNum === 2) return 'Rejected'
    return 'Completed'
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image too large. Max 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Resize image using canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Resize to max 400x300 while maintaining aspect ratio
        let width = img.width
        let height = img.height
        const maxWidth = 400
        const maxHeight = 300
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed JPEG base64 (quality 0.7)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
        
        // Store image in localStorage (marked with timestamp for cleanup later)
        const generatedImageKey = `land_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        try {
          localStorage.setItem(generatedImageKey, compressedBase64)
          setImageKey(generatedImageKey) // Store key in separate state
          setImagePreview(compressedBase64)
          setMessage('Image ready (stored locally)')
        } catch (e) {
          setMessage('Error storing image in browser')
        }
      }
      img.onerror = () => {
        setMessage('Error loading image')
      }
      img.src = event.target?.result
    }
    reader.onerror = () => {
      setMessage('Error reading image file')
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    loadSellerData()
  }, [contract, account])

  useEffect(() => {
    const fetchEthBalance = async () => {
      if (!provider || !account) return
      try {
        const balance = await provider.getBalance(account)
        const ethValue = parseFloat(balance.toString()) / 1e18
        setEthBalance(ethValue.toFixed(4))
      } catch (error) {
        console.error('Error fetching ETH balance:', error)
      }
    }

    fetchEthBalance()
    const balanceInterval = setInterval(fetchEthBalance, 10000) // Update every 10 seconds
    return () => clearInterval(balanceInterval)
  }, [provider, account])

  const loadSellerData = async () => {
    try {
      setLoading(true)
      
      // Get seller's lands
      const sellerLands = await contract.getSellerLands(account)
      setLands(sellerLands.map(land => ({
        id: land.id.toString(),
        seller: land.seller,
        location: land.location,
        area: land.area.toString(),
        price: land.price.toString(),
        imageURL: land.imageURL, // Explicitly map imageURL
        isAvailable: Boolean(land.isAvailable)
      })))

      // Get seller's requests (both incoming and outgoing)
      const sellerRequests = await contract.getBuyerRequests(account)
      // Filter for requests where this user is the seller
      const incomingRequests = sellerRequests
        .filter((req) => typeof req.seller === 'string' && req.seller.toLowerCase() === account.toLowerCase())
        .map((req) => ({
          ...req,
          id: req.id.toString(),
          landId: req.landId.toString(),
          price: req.price.toString(),
          status: Number(req.status)
        }))
        .filter((req) => req.status === 0 || req.status === 1)
        .sort((a, b) => Number(b.id) - Number(a.id))

      setRequests(incomingRequests)
    } catch (error) {
      console.error('Error loading seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLand = async (e) => {
    e.preventDefault()

    if (!formData.location || !formData.area || !formData.price) {
      setMessage('Please fill all fields')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.registerLand(
        formData.location,
        formData.area,
        formData.price,
        imageKey || '' // Use the separate imageKey state
      )
      
      setMessage('Adding land... Please wait')
      await tx.wait()
      
      setMessage('Land added successfully')
      setFormData({ location: '', area: '', price: '', imageURL: '' })
      setImagePreview(null)
      setImageKey(null) // Clear image key
      setTab('myLands')
      loadSellerData()
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.approveLandRequest(requestId)
      setMessage('Approving request... Please wait')
      await tx.wait()
      
      setMessage('Request approved')
      loadSellerData()
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard seller-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Seller Dashboard</h1>
          <p>Welcome, {userName}</p>
        </div>
        <div className="dashboard-balance">
          <span className="balance-label">ETH Balance:</span>
          <span className="balance-value">{ethBalance} ETH</span>
        </div>
      </div>

      <div className="seller-layout">
        <aside className={`seller-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="seller-sidebar-header">
            {!sidebarCollapsed && <span>Navigation</span>}
            <button
              type="button"
              className="seller-sidebar-toggle"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? '»' : '«'}
            </button>
          </div>

          <button
            className={`seller-nav-btn ${tab === 'myLands' ? 'active' : ''}`}
            onClick={() => setTab('myLands')}
            title="My Lands"
          >
            <span className="seller-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17l6-6 4 4 7-7" />
                <path d="M14 8h6v6" />
              </svg>
            </span>
            {!sidebarCollapsed && <span>My Lands ({lands.length})</span>}
          </button>
          <button
            className={`seller-nav-btn ${tab === 'addLand' ? 'active' : ''}`}
            onClick={() => setTab('addLand')}
            title="Add Land"
          >
            <span className="seller-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            {!sidebarCollapsed && <span>Add Land</span>}
          </button>
          <button
            className={`seller-nav-btn ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
            title="Buyers Requests"
          >
            <span className="seller-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 8l9 6 9-6" />
              </svg>
            </span>
            {!sidebarCollapsed && <span>Buyers Requests ({requests.length})</span>}
          </button>
        </aside>

        <div className="dashboard-content seller-main-content">
        {tab === 'myLands' && (
          <div>
            <h2>My Lands</h2>
            {lands.length === 0 ? (
              <p className="no-data">No lands registered yet. Add your first land!</p>
            ) : (
              <div className="lands-grid">
                {lands.map(land => (
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
                      <p><strong>Price:</strong> {land.price} Wei</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'addLand' && (
          <div>
            <h2>Add New Land</h2>
            <form onSubmit={handleAddLand} className="land-form">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., New York, Downtown"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Area (sq meters)</label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g., 1000"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Price (Wei)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="e.g., 5000000000000000000"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Land Image (optional - jpg, png, etc.)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding...' : 'Add Land'}
              </button>
            </form>

            {message && (
              <div className={`message ${message.includes('successfully') ? 'success' : message.includes('Error') ? 'error' : 'info'}`}>
                {message}
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div>
            <h2>Buyer Requests</h2>
            {requests.length === 0 ? (
              <p className="no-data">No pending or approved buyer requests right now</p>
            ) : (
              <div className="requests-list">
                {requests.map(req => (
                  <div key={req.id} className="request-card">
                    <h3>Request #{req.id}</h3>
                    <div className="request-details">
                      <p><strong>Land ID:</strong> {req.landId}</p>
                      <p><strong>Buyer:</strong> {shortAddr(req.buyer)}</p>
                      <p><strong>Price:</strong> {req.price} Wei</p>
                      <p><strong>Status:</strong> {getRequestStatusLabel(req.status)}</p>
                    </div>
                    {req.status === 0 && (
                      <button 
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={loading}
                        className="btn-primary"
                      >
                        Approve Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('approved') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
