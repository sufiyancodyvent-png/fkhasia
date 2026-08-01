import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '../icons/Icon'
import { login, saveSession, gatewayLogin } from '../../lib/api'

function AuthForm({ mode = 'login' }) {
  const navigate = useNavigate()
  const { role } = useParams()
  const isRegister = mode === 'register'
  const isGateway = mode === 'gateway'
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
      if (isGateway) {
        await gatewayLogin(form.email, form.password)
        navigate('/select-role')
      } else {
        const session = await login(form.email, form.password)
        saveSession(session)
        
        // Strict Role Validation based on selected login page
        if (role) {
          const expectedRole = role === 'heads' ? 'admin' : role === 'team' ? 'employee' : role;
          if (session.user.role !== expectedRole) {
            throw new Error(`Your account does not have ${role} permissions.`);
          }
        }
        
        navigate(session.user.role === 'admin' || session.user.role === 'manager' ? '/admin' : '/employee/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-form-panel auth-card" aria-label="Authentication">
      <style>{`
        #root .auth-copy p:last-child {
          margin-bottom: 20px !important;
        }
      `}</style>
      <button className="auth-theme-indicator" type="button" aria-label="Theme">
        <Icon name="moon" size={18} />
      </button>

      <div className="auth-copy">
        <h2>
          {isRegister ? (
            'Create Account'
          ) : isGateway ? (
            <>
              <span className="auth-title-desktop">Sign In</span>
              <span className="auth-title-mobile">FKH ASIA</span>
            </>
          ) : (
            <>
              <span className="auth-title-desktop">
                {role === 'heads'
                  ? 'Heads Login'
                  : role === 'manager'
                  ? 'Manager Login'
                  : role === 'supervisor'
                  ? 'Supervisor Login'
                  : role === 'team'
                  ? 'Team Login'
                  : 'Sign In'}
              </span>
              <span className="auth-title-mobile">FKH ASIA</span>
            </>
          )}
        </h2>
        <p style={{ marginBottom: '20px' }}>
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
          Sign In
          <span className="input-shell">
            <Icon name="user" size={21} />
            <input 
              type="text" 
              placeholder="Sign In" 
              value={form.email} 
              onChange={updateField('email')} 
              required 
            />
          </span>
        </label>
        <label>
          Password
          <span className="input-shell">
            <Icon name="lock" size={21} />
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={updateField('password')} required />
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

        {!isRegister && !isGateway && (
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

    </section>
  )
}

export default AuthForm
