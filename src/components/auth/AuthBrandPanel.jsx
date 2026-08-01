import BrandMark from '../brand/BrandMark'

function AuthBrandPanel() {
  return (
    <section className="auth-brand-panel">
      <style>{`
        #root .auth-brand-content {
          margin-top: auto !important;
          margin-bottom: auto !important;
        }
      `}</style>
      <div className="auth-brand-content">
        <div>
          <h1>FKH ASIA</h1>
          <p className="auth-tagline">Streamline Your Workforce, Payroll, And Performance</p>
        </div>
        <ul className="feature-list">
          <li>Automated Attendance & Leave Management</li>
          <li>Precision Payroll & Tax Calculations</li>
          <li>Centralized Employee Data & Asset Tracking</li>
        </ul>
      </div>
      <p className="copyright">(c) 2026 FKH ASIA. All rights reserved.</p>
    </section>
  )
}

export default AuthBrandPanel
