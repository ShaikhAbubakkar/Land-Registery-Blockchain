import { useState } from 'react'

function RegisterLand({ contract, signer }) {
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (!location || !area) {
      setMessage('Please fill all fields')
      return
    }

    if (area <= 0) {
      setMessage('Area must be greater than zero')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const tx = await contract.registerLand(location, BigInt(area))
      setMessage('Registering land... Please wait')
      
      const receipt = await tx.wait()
      setMessage(`✅ Land registered successfully! TX: ${receipt.hash.slice(0, 10)}...`)
      
      setLocation('')
      setArea('')
    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Error: ${error.reason || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Register Land</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Area (in sq meters)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g., 1000"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Processing...' : 'Register Land'}
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

export default RegisterLand
