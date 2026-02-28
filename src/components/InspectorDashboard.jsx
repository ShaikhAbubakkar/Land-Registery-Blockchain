import { useState, useEffect } from 'react'

function InspectorDashboard({ contract, account }) {
  const [unverifiedUsers, setUnverifiedUsers] = useState([])
  const [pendingApprovedRequests, setPendingApprovedRequests] = useState([])
  const [tab, setTab] = useState('users') // users, transfers
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userRoles, setUserRoles] = useState({})

  const shortAddr = (value) => {
    if (!value || typeof value !== 'string') return 'N/A'
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  useEffect(() => {
    loadInspectorData()
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(loadInspectorData, 5000)
    return () => clearInterval(interval)
  }, [contract, account])

  const loadInspectorData = async () => {
    if (!contract) return
    
    try {
      setLoading(true)
      
      // Get unverified users
      const unverified = await contract.getUnverifiedUsers()
      setUnverifiedUsers(unverified || [])
      
      // Build a map of roles for quick lookup
      const rolesMap = {}
      for (const user of unverified) {
        const roleNum = Number(user.role)
        rolesMap[user.walletAddress] = roleNum === 1 ? 'Seller' : roleNum === 2 ? 'Buyer' : 'Unknown'
      }
      setUserRoles(rolesMap)
      
      // Load approved requests ready for finalization
      const totalRequests = Number(await contract.getTotalRequests())
      const approvedRequests = []

      for (let requestId = 1; requestId <= totalRequests; requestId++) {
        const request = await contract.getLandRequest(requestId)
        const status = Number(request.status)

        if (status === 1 && request.paymentReceived) {
          approvedRequests.push({
            ...request,
            id: request.id.toString(),
            landId: request.landId.toString(),
            price: request.price.toString(),
            status
          })
        }
      }

      approvedRequests.sort((a, b) => Number(b.id) - Number(a.id))
      setPendingApprovedRequests(approvedRequests)
      
      if (unverified.length === 0 && message === '') {
        setMessage('✅ All users are verified!')
      }
    } catch (error) {
      console.error('Error loading inspector data:', error)
      setMessage(`❌ Error loading data: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyUser = async (userAddress) => {
    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.verifyUser(userAddress)
      setMessage('Verifying user... Please wait')
      await tx.wait()
      
      setMessage(`✅ User ${userAddress.substring(0, 6)}... verified successfully!`)
      await loadInspectorData()
    } catch (error) {
      setMessage(`❌ Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalizeTransfer = async (requestId) => {
    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.finalizeTransfer(requestId)
      setMessage('Finalizing transfer... Please wait')
      await tx.wait()
      
      setMessage(`✅ Transfer #${requestId} finalized successfully!`)
      await loadInspectorData()
    } catch (error) {
      setMessage(`❌ Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role) => {
    const roleNum = Number(role)
    return roleNum === 1 ? 'Seller' : roleNum === 2 ? 'Buyer' : 'Unknown'
  }

  return (
    <div className="dashboard inspector-dashboard">
      <div className="dashboard-header">
        <h1>Inspector Dashboard</h1>
        <p>Manage user verification and finalize transfers</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          Verify Users ({unverifiedUsers.length})
        </button>
        <button
          className={`tab-btn ${tab === 'transfers' ? 'active' : ''}`}
          onClick={() => setTab('transfers')}
        >
          Finalize Transfers
        </button>
      </div>

      <div className="dashboard-content">
        {tab === 'users' && (
          <div>
            <h2>Unverified Users</h2>
            
            {message && (
              <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            {unverifiedUsers.length === 0 ? (
              <div className="info-box">
                <p>✅ No unverified users. All registered users have been verified!</p>
              </div>
            ) : (
              <div className="users-list">
                {unverifiedUsers.map((user, index) => (
                  <div key={index} className="user-card">
                    <div className="user-header">
                      <div>
                        <h3>{user.name}</h3>
                        <p className="user-address">{user.walletAddress}</p>
                      </div>
                      <span className={`role-badge role-${Number(user.role) === 1 ? 'seller' : 'buyer'}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="user-info">
                      <p><strong>Status:</strong> <span className="unverified">Unverified</span></p>
                      <p><strong>Registered:</strong> {new Date(Number(user.registrationDate) * 1000).toLocaleDateString()}</p>
                    </div>
                    <button
                      className="btn btn-verify"
                      onClick={() => handleVerifyUser(user.walletAddress)}
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : '✓ Verify User'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'transfers' && (
          <div>
            <h2>Finalize Transfers</h2>
            
            {message && (
              <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="info-box">
              <p>This section shows approved land requests ready for transfer finalization.</p>
              <p>Once a seller approves a buyer's request, you can finalize the transfer here to complete the sale.</p>
            </div>

            {pendingApprovedRequests.length === 0 ? (
              <div className="info-box">
                <p>✅ No pending transfers at this time.</p>
              </div>
            ) : (
              <div className="transfers-list">
                {pendingApprovedRequests.map((request, index) => (
                  <div key={index} className="transfer-card">
                    <div className="transfer-info">
                      <p><strong>Request ID:</strong> {request.id}</p>
                      <p><strong>Land ID:</strong> {request.landId}</p>
                      <p><strong>Buyer:</strong> {shortAddr(request.buyer)}</p>
                      <p><strong>Seller:</strong> {shortAddr(request.seller)}</p>
                      <p><strong>Amount:</strong> {request.price} Wei</p>
                      <p><strong>Status:</strong> Approved - Ready for Finalization</p>
                    </div>
                    <button
                      className="btn btn-complete"
                      onClick={() => handleFinalizeTransfer(request.id)}
                      disabled={loading}
                    >
                      {loading ? 'Finalizing...' : '✓ Finalize Transfer'}
                    </button>
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

export default InspectorDashboard
