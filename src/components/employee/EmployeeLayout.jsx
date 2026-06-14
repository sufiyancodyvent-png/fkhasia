import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import Topbar from '../dashboard/Topbar'
import logo from '../../assets/logo.png'
import { getSession } from '../../lib/api'

const employeeRailItems = [
  { key: 'dashboard', icon: 'grid', label: 'Dashboard', path: '/employee/dashboard', section: 'MAIN MENU' },
  { key: 'attendance', icon: 'calendarCheck', label: 'My Attendance', path: '/employee/attendance', section: 'ATTENDANCE' },
]

function getActiveItem(pathname) {
  return employeeRailItems.find((item) => item.path && pathname.startsWith(item.path)) || employeeRailItems[0]
}

function EmployeeRail({ menuOpen, onToggleMenu }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeItem = getActiveItem(pathname)

  return (
    <aside className="employee-rail">
      <div className="employee-rail-logo-wrap" aria-hidden="true">
        <img src={logo} alt="" />
      </div>
      <div className="employee-menu-panel">
        <div className="employee-panel-brand">
          <img className="employee-panel-logo" src={logo} alt="FKHASIA" />
          <div>
            <strong>FKH ASIA</strong>
            <span>HR Management</span>
          </div>
          <button
            className="mobile-sidebar-toggle"
            type="button"
            aria-label={menuOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={onToggleMenu}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
        <div className="employee-panel-menu">
          <p>{activeItem.section}</p>
          {employeeRailItems.map((item) => (
            <button
              className={item.key === activeItem.key ? 'active' : ''}
              type="button"
              key={item.key}
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="employee-rail-brand">
      </div>
      <nav className="employee-rail-nav" aria-label="Employee navigation">
        {employeeRailItems.map((item) => (
          <button
            className={item.key === activeItem.key ? 'active' : ''}
            type="button"
            key={item.key}
            onClick={() => item.path && navigate(item.path)}
          >
            <Icon name={item.icon} size={22} />
          </button>
        ))}
      </nav>
    </aside>
  )
}

function EmployeeLayout({ children, title = 'Employee Dashboard', subtitle = 'Individual Performance & Workspace' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const session = getSession()
  const avatar = (session?.user?.name || 'Employee')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className={menuOpen ? 'employee-shell nav-expanded' : 'employee-shell'}>
      <EmployeeRail menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <section className="employee-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          avatar={avatar}
          employee
          menuOpen={menuOpen}
          onMenuClick={() => setMenuOpen((open) => !open)}
        />
        {children}
      </section>
    </main>
  )
}

export default EmployeeLayout
