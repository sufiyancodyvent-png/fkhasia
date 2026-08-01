import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/icons/Icon'
import { clearGatewayToken } from '../lib/api'

function PartnerCard({ company }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div className="partner-card" title={company.name}>
      {!imgFailed && company.logo ? (
        <img
          src={company.logo}
          onError={() => setImgFailed(true)}
          alt={`${company.name} Logo`}
          className="partner-img"
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '11px',
            flexShrink: 0
          }}>
            {company.name.charAt(0)}
          </div>
          <span className="partner-fallback-name">{company.name}</span>
        </div>
      )}
    </div>
  )
}

function RoleSelectionPage() {
  const navigate = useNavigate()

  const handleRoleSelect = (rolePath) => {
    navigate(`/login/${rolePath}`)
  }

  const handleLockPortal = () => {
    clearGatewayToken()
    navigate('/gateway')
  }

  const companies = [
    { name: 'Western Digital', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Western_Digital_logo.svg/320px-Western_Digital_logo.svg.png' },
    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/320px-Microsoft_logo.svg.png' },
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png' },
    { name: 'Proton motors thailand', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Proton_Holding_logo_%282016%29.svg/320px-Proton_Holding_logo_%282016%29.svg.png' },
    { name: 'Siam motors Thailand', logo: 'https://www.siammotors.com/templates/siammotors/images/logo.png' },
    { name: 'SB FURNITURE GROUP', logo: 'https://www.sbdesignsquare.com/assets/images/logo-sb.png' },
    { name: 'DELTA ELECTRONICS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Delta_Electronics_logo.svg/320px-Delta_Electronics_logo.svg.png' },
    { name: 'THAI PARFUN', logo: 'https://thaiparfun.com/wp-content/uploads/2021/04/logo.png' },
    { name: 'THE REON SCH CHEMICALS', logo: 'https://logo.clearbit.com/reon.co.th' },
    { name: 'SYSTEM STONE', logo: 'https://www.factorium.tech/wp-content/uploads/2022/09/Logo-Factorium-2022.png' },
    { name: 'UPCYDE', logo: 'https://upcyde.co/wp-content/uploads/2022/10/upcyde-logo.png' },
    { name: 'MUI ROBOTICS', logo: 'https://muirobotics.com/wp-content/uploads/2021/03/mui_logo_website.png' },
    { name: 'SWEES PLANT BASED FOOD', logo: 'https://sweescheese.com/wp-content/uploads/2021/09/swees-logo.png' },
    { name: 'METICULY', logo: 'https://www.meticuly.com/images/logo.png' },
    { name: 'TEETRACS', logo: 'https://teetracs.com/wp-content/uploads/2022/11/logo.png' }
  ]

  return (
    <div className="role-container">
      <style>{`
        .role-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          background: #f8fafc;
          padding: 30px 40px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .role-content-width {
          width: 100%;
          max-width: 1340px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .role-logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 0px;
          font-family: 'Kalam', cursive;
          font-size: 18px;
          font-weight: 900;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
        }

        .role-header h2 {
          font-family: 'Kalam', cursive;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #0f172a;
          line-height: 1.1;
        }

        .role-header p {
          font-size: 15px;
          font-weight: 500;
          color: #475569;
          line-height: 1.3;
          margin: 0;
        }

        .role-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .role-container {
            overflow-y: auto;
          }
          .role-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .partner-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .partner-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 500px) {
          .role-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .partner-grid {
            grid-template-columns: 1fr !important;
          }
          .role-container {
            padding: 20px !important;
          }
        }

        .role-grid-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }

        .role-grid-item:hover {
          transform: translateY(-4px);
          border-color: #2563eb;
          box-shadow: 0 16px 36px rgba(37, 99, 235, 0.08);
        }

        .role-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 12px;
          transition: all 0.25s ease;
        }

        .role-grid-item:hover .role-item-icon {
          background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%);
          color: #ffffff;
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.2);
        }

        .role-item-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          font-family: var(--font-ui), sans-serif;
        }

        .role-item-desc {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          line-height: 1.4;
          margin: 0;
        }

        /* Partners Card Grid styles */
        .partner-section {
          width: 100%;
          text-align: center;
        }

        .partner-section-title {
          font-size: 11px;
          font-weight: 900;
          color: #94a3b8;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .partner-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .partner-card {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-sizing: border-box;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(15, 37, 72, 0.02);
        }

        .partner-card:hover {
          transform: translateY(-2px);
          border-color: #2563eb;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.06);
        }

        .partner-img {
          max-height: 28px;
          max-width: 100%;
          object-fit: contain;
          transition: all 0.2s ease;
        }

        .partner-fallback-name {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lock-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 auto;
          width: fit-content;
          padding: 8px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .lock-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04);
        }
      `}</style>

      <div className="role-content-width">
        <div className="role-header-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="role-logo-badge">FKH</div>
          <div className="role-header">
            <h2>Select Your Portal</h2>
            <p>Choose your designation to access your specific workspace tools.</p>
          </div>
        </div>

        <div className="role-grid">
          <button className="role-grid-item" onClick={() => handleRoleSelect('heads')}>
            <div className="role-item-icon">
              <Icon name="shield" size={20} />
            </div>
            <h3 className="role-item-title">Heads Login</h3>
            <p className="role-item-desc">Access high-level administration panel, analytics, and business configuration settings.</p>
          </button>

          <button className="role-grid-item" onClick={() => handleRoleSelect('manager')}>
            <div className="role-item-icon">
              <Icon name="briefcase" size={20} />
            </div>
            <h3 className="role-item-title">Manager Login</h3>
            <p className="role-item-desc">Manage your department tasks, check team logs, and review incoming requests.</p>
          </button>

          <button className="role-grid-item" onClick={() => handleRoleSelect('supervisor')}>
            <div className="role-item-icon">
              <Icon name="clipboardCheck" size={20} />
            </div>
            <h3 className="role-item-title">Supervisor Login</h3>
            <p className="role-item-desc">Oversee day-to-day work floor operations, review attendance, and assign daily tickets.</p>
          </button>

          <button className="role-grid-item" onClick={() => handleRoleSelect('team')}>
            <div className="role-item-icon">
              <Icon name="users" size={20} />
            </div>
            <h3 className="role-item-title">Team Login</h3>
            <p className="role-item-desc">Clock in, submit attendance, manage active tasks, and connect with support desk.</p>
          </button>
        </div>

        {/* Corporate Clients Grid */}
        <div className="partner-section">
          <div className="partner-section-title">Trusted By Corporate Partners</div>
          <div className="partner-grid">
            {companies.map((company, index) => (
              <PartnerCard company={company} key={index} />
            ))}
          </div>
        </div>

        <button className="lock-btn" onClick={handleLockPortal}>
          <Icon name="lock" size={14} />
          Lock Secure Portal
        </button>
      </div>
    </div>
  )
}

export default RoleSelectionPage
