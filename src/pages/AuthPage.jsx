import AuthBrandPanel from '../components/auth/AuthBrandPanel'
import AuthForm from '../components/auth/AuthForm'

function AuthPage({ mode }) {
  return (
    <main className="auth-shell">
      <AuthBrandPanel />
      <AuthForm mode={mode} />
    </main>
  )
}

export default AuthPage
