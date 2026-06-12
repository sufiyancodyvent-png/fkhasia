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

function EmployeeRail() {
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
        </div>
        <div className="employee-panel-menu">
          <p>{activeItem.section}</p>
          <button className="active" type="button" onClick={() => navigate(activeItem.path)}>
            <Icon name={activeItem.icon} size={20} />
            <span>{activeItem.label}</span>
          </button>
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

function EmployeeLayout({ children }) {
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
      <EmployeeRail />
      <section className="employee-main">
        <Topbar
          title="Employee Dashboard"
          subtitle="Individual Performance & Workspace"
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
