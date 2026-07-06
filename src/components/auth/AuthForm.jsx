import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import { login, saveSession } from '../../lib/api'
import logo from '../../assets/logo.png'

function AuthForm({ mode = 'login' }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = await login(form.email, form.password)
      saveSession(session)
      navigate(session.user.role === 'admin' || session.user.role === 'manager' ? '/admin' : '/employee/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-form-panel auth-card" aria-label="Authentication">
      <button className="auth-theme-indicator" type="button" aria-label="Theme">
        <Icon name="moon" size={18} />
      </button>
      <div className="auth-logo-badge">
        <img src={logo} alt="FKH ASIA" />
      </div>
      <div className="auth-copy">
        <h2>
          {isRegister ? (
            'Create Account'
          ) : (
            <>
              <span className="auth-title-desktop">Sign In</span>
              <span className="auth-title-mobile">FKH ASIA</span>
            </>
          )}
        </h2>
        <p>
          {isRegister
            ? 'Register Your Workspace Profile To Access Your Dashboard'
            : 'Please Enter Your Details To Access Your Dashboard'}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        {isRegister && (
          <label>
            Full Name
            <span className="input-shell">
              <Icon name="user" size={21} />
              <input type="text" placeholder="Your Full Name" />
            </span>
          </label>
        )}
        <label>
          Email Address
          <span className="input-shell">
            <Icon name="mail" size={21} />
            <input type="email" placeholder="Name@Company.Com" value={form.email} onChange={updateField('email')} required />
          </span>
        </label>
        <label>
          Password
          <span className="input-shell">
            <Icon name="lock" size={21} />
            <input type={showPassword ? 'text' : 'password'} placeholder="********" value={form.password} onChange={updateField('password')} required />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={21} />
            </button>
          </span>
        </label>

        {isRegister && (
          <label>
            Confirm Password
            <span className="input-shell">
              <Icon name="lock" size={21} />
              <input type="password" placeholder="********" />
            </span>
          </label>
        )}

        {!isRegister && (
          <label className="check-row">
            <input type="checkbox" />
            <span>Stay Signed In</span>
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-action" type="submit" disabled={loading}>
          {loading ? 'Signing In...' : isRegister ? 'Create Secure Account' : 'Login To Platform'}
          <Icon name="arrowRight" size={22} />
        </button>
      </form>

      {!isRegister && (
        <section className="bank-association" aria-label="Bank associations">
          <p>In Association With Multiple Banks</p>
          <div className="bank-logo-row">
            <span className="bank-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_of_Habib_Bank.svg" alt="HBL" />
            </span>
            <span className="bank-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/United_Bank_Limited_logo.svg" alt="UBL" />
            </span>
            <span className="bank-logo">
              <img src="https://www.meezanbank.com/wp-content/themes/mbl/images/logo.png" alt="Meezan Bank" />
            </span>
            <span className="bank-logo">
              <img src="https://www.mcb.com.pk/assets/images/mcb-logo.svg" alt="MCB Bank" />
            </span>
          </div>
        </section>
      )}
    </section>
  )
}

export default AuthForm
