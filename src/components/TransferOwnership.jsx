import { useState } from 'react'

function TransferOwnership({ contract, signer }) {
  const [landId, setLandId] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleTransfer = async (e) => {
    e.preventDefault()
    
    if (!landId || !newOwner) {
      setMessage('Please fill all fields')
      return
    }

    if (!newOwner.startsWith('0x') || newOwner.length !== 42) {
      setMessage('Invalid Ethereum address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.transferOwnership(BigInt(landId), newOwner)
      setMessage('Transferring ownership... Please wait')
      
      const receipt = await tx.wait()
      setMessage(`✅ Ownership transferred successfully! TX: ${receipt.hash.slice(0, 10)}...`)
      
      setLandId('')
      setNewOwner('')
    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Transfer Ownership</h2>
      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label>Land ID</label>
          <input
            type="number"
            value={landId}
            onChange={(e) => setLandId(e.target.value)}
            placeholder="e.g., 1"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>New Owner Address</label>
          <input
            type="text"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Processing...' : 'Transfer Ownership'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default TransferOwnership
