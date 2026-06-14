import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import { login, saveSession } from '../../lib/api'
import logo from '../../assets/logo.png'

const demoCredentials = {
  employee: {
    email: import.meta.env.VITE_DEMO_EMPLOYEE_EMAIL || 'employee@fkhasia.com',
    password: import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || '',
  },
  admin: {
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@fkhasia.com',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
  },
}

function AuthForm({ mode = 'login' }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ email: '', password: '' })
  const [demoRole, setDemoRole] = useState('employee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const activeDemo = demoCredentials[demoRole]

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const useDemoCredentials = (role = demoRole) => {
    const demo = demoCredentials[role]
    setDemoRole(role)
    setForm((current) => ({ email: demo.email, password: demo.password || current.password }))
    setError('')
  }

  const toggleDemoRole = () => {
    const nextRole = demoRole === 'employee' ? 'admin' : 'employee'
    useDemoCredentials(nextRole)
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
    <section className="auth-form-panel" aria-label="Authentication">
      <div className="auth-card">
        <button className="auth-theme-indicator" type="button" aria-label="Theme">
          <Icon name="moon" size={18} />
        </button>
        <div className="auth-logo-badge">
          <img src={logo} alt="FKH ASIA" />
        </div>
        <div className="auth-copy">
          <h2>{isRegister ? 'Create Account' : 'FKH ASIA'}</h2>
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
              <input type="password" placeholder="********" value={form.password} onChange={updateField('password')} required />
              <Icon name="eye" size={21} />
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
          <>
            <div className="demo-box">
              <div className="demo-box-head">
                <strong>
                  <Icon name="lock" size={14} />
                  Demo Credentials
                </strong>
                <button type="button" onClick={() => useDemoCredentials()}>Use</button>
              </div>
              <p>EMAIL: {activeDemo.email}</p>
              <p>PASS: {activeDemo.password ? activeDemo.password : '********'}</p>
            </div>

            <button className="auth-role-link" type="button" onClick={toggleDemoRole}>
              Login As {demoRole === 'employee' ? 'Admin' : 'Employee'}
              <Icon name="arrowRight" size={15} />
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default AuthForm
