import { useState, useEffect } from 'react'

function ViewLands({ contract, account }) {
  const [lands, setLands] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLandId, setSelectedLandId] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (contract && account) {
      fetchLands()
    }
  }, [contract, account])

  const fetchLands = async () => {
    setLoading(true)
    setError('')
    try {
      const lands = await contract.getLandsByOwner(account)
      setLands(lands)
    } catch (err) {
      console.error('Error fetching lands:', err)
      setError('Error fetching lands')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (landId) => {
    try {
      const historyData = await contract.getOwnershipHistory(landId)
      setHistory(historyData)
      setSelectedLandId(landId)
    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Error fetching history')
    }
  }

  return (
    <div className="card">
      <h2>My Lands</h2>
      
      <button onClick={fetchLands} disabled={loading} className="btn-secondary">
        {loading ? 'Loading...' : 'Refresh Lands'}
      </button>

      {error && <div className="message error">{error}</div>}

      {lands.length === 0 ? (
        <p className="no-data">No lands registered yet</p>
      ) : (
        <div className="lands-list">
          {lands.map((land) => (
            <div key={land.id} className="land-item">
              <div className="land-info">
                <h3>Land #{land.id}</h3>
                <p><strong>Location:</strong> {land.location}</p>
                <p><strong>Area:</strong> {land.area.toString()} sq meters</p>
                <p><strong>Current Owner:</strong> {land.currentOwner.slice(0, 6)}...{land.currentOwner.slice(-4)}</p>
                <p><strong>Registered:</strong> {new Date(Number(land.registrationDate) * 1000).toLocaleDateString()}</p>
              </div>
              
              <button 
                onClick={() => fetchHistory(land.id)}
                className="btn-info"
              >
                {selectedLandId === land.id ? 'Hide History' : 'View History'}
              </button>

              {selectedLandId === land.id && history.length > 0 && (
                <div className="history">
                  <h4>Ownership History</h4>
                  <div className="history-list">
                    {history.map((record, index) => (
                      <div key={index} className="history-item">
                        <p><strong>Owner #{index + 1}:</strong> {record.owner.slice(0, 6)}...{record.owner.slice(-4)}</p>
                        <p><strong>Date:</strong> {new Date(Number(record.timestamp) * 1000).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ViewLands
