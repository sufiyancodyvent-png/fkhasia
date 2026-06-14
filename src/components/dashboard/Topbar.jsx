import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import { clearSession, getSession } from '../../lib/api'

function Topbar({ title, subtitle, avatar = 'SA', employee = false, onMenuClick, menuOpen = true }) {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const session = getSession()
  const displayName = session?.user?.name || 'Account'
  const displayEmail = session?.user?.email || ''

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    clearSession()
    navigate('/login')
  }

  const handleProfile = () => {
    setAccountOpen(false)
    navigate(session?.user?.role === 'employee' ? '/employee/profile' : '/admin/profile')
  }

  return (
    <header className={employee ? 'topbar employee' : 'topbar'}>
      <div className="topbar-title">
        <button
          className="icon-button"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={onMenuClick}
        >
          <Icon name="menu" size={25} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <button className={employee ? 'icon-button plain' : 'notification'} type="button" aria-label="Notifications">
          <Icon name="bell" size={23} />
          {!employee && <span>1</span>}
        </button>
        <div className="account-menu-wrap" ref={menuRef}>
          <button
            className={employee ? 'avatar slate' : 'avatar'}
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
          >
            {avatar}
          </button>
          {accountOpen && (
            <div className="account-dropdown" role="menu">
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
              <button className="profile-menu-button" type="button" onClick={handleProfile} role="menuitem">
                My Profile
              </button>
              <button className="logout-menu-button" type="button" onClick={handleLogout} role="menuitem">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
