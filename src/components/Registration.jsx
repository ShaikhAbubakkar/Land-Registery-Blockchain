import { useState } from 'react'

// SVG Icons as components
const SellerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
    <path d="M12 12v6M9 15h6"/>
  </svg>
)

const BuyerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M12 14v2M9 17h6"/>
  </svg>
)

function Registration({ contract, onRegisterSuccess }) {
  const [step, setStep] = useState('roleSelect') // roleSelect -> form -> processing
  const [selectedRole, setSelectedRole] = useState(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setStep('form')
    setError('')
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!contract) {
        setError('Contract not initialized. Please refresh the page.')
        setLoading(false)
        return
      }
      
      // Call registration on blockchain
      const roleValue = selectedRole === 'seller' ? 1 : 2
      const tx = await contract.registerUser(roleValue, fullName)
      
      setError('Registration submitted... Please wait for confirmation')
      await tx.wait()

      // Success - notify parent
      onRegisterSuccess(selectedRole, fullName)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.reason || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h1>Land Registry</h1>
        <p className="subtitle">Choose your role to get started</p>

        {step === 'roleSelect' && (
          <div className="role-selection">
            <button
              className="role-btn seller-btn"
              onClick={() => handleRoleSelect('seller')}
            >
              <div className="role-icon seller-icon">
                <SellerIcon />
              </div>
              <h3>Register as Seller</h3>
              <p>List and sell your land</p>
            </button>

            <button
              className="role-btn buyer-btn"
              onClick={() => handleRoleSelect('buyer')}
            >
              <div className="role-icon buyer-icon">
                <BuyerIcon />
              </div>
              <h3>Register as Buyer</h3>
              <p>Browse and purchase land</p>
            </button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRegister} className="registration-form">
            <div className="role-badge">
              {selectedRole === 'seller' ? 'Registering as Seller' : 'Registering as Buyer'}
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('roleSelect')
                setFullName('')
                setError('')
              }}
              disabled={loading}
              className="btn-secondary"
            >
              Back
            </button>
          </form>
        )}

        {error && (
          <div className={`message ${error.includes('success') ? 'success' : error.includes('submitted') ? 'info' : 'error'}`}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default Registration
