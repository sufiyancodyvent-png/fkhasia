import { useLocation, useNavigate } from 'react-router-dom'
import BrandMark from '../brand/BrandMark'
import Icon from '../icons/Icon'

const railItems = [
  { key: 'dashboard', icon: 'grid', label: 'Dashboard', path: '/admin' },
  { key: 'hr', icon: 'userCheck', label: 'Employee Directory', path: '/admin/employees', section: 'hr' },
  { key: 'attendance', icon: 'clock', label: 'Attendance', path: '/admin/attendance', section: 'attendance' },
]

const hrItems = [
  { icon: 'building', label: 'Departments', path: '/admin/departments' },
  { icon: 'userCheck', label: 'Employee Directory', path: '/admin/employees' },
]

const attendanceItems = [
  { icon: 'calendarCheck', label: 'Employee Attendance', path: '/admin/attendance' },
  { icon: 'userCheck', label: 'Attendance Approvals', path: '/admin/attendance/approvals' },
  { icon: 'workflow', label: 'Attendance Settings', path: '/admin/attendance/settings' },
]

function Sidebar({ menuOpen, onOpenMenu, onToggleMenu }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hrActive = pathname.startsWith('/admin/departments') || pathname.startsWith('/admin/employees')
  const attendanceActive = pathname.startsWith('/admin/attendance')
  const visibleSection = hrActive ? 'hr' : attendanceActive ? 'attendance' : 'system'
  const activeRailKey = hrActive ? 'hr' : attendanceActive ? 'attendance' : 'dashboard'
  const expandedItems = visibleSection === 'hr'
      ? hrItems
      : visibleSection === 'attendance'
        ? attendanceItems
        : [{ icon: 'trending', label: 'Dashboard', path: '/admin' }]
  const sectionLabel = visibleSection === 'hr'
      ? 'HUMAN RESOURCE MANAGEMENT'
      : visibleSection === 'attendance'
        ? 'ATTENDANCE'
        : 'SYSTEM'

  const handleRailClick = (item) => {
    if (item.section) {
      onOpenMenu()
    }

    if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark compact />
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
      <nav className="side-nav" aria-label="Admin navigation" data-section={sectionLabel}>
        {railItems.map((item) => (
          <button
            className={item.key === activeRailKey ? 'active rail-item' : 'rail-item'}
            type="button"
            key={item.label}
            onClick={() => handleRailClick(item)}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        ))}
        <div className="expanded-nav-list">
          {expandedItems.map((item) => (
            <button
              className={pathname === item.path ? 'active' : ''}
              type="button"
              key={item.label}
              onClick={() => {
                navigate(item.path)
              }}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <button
        className={menuOpen ? 'logout-button sidebar-toggle open' : 'logout-button sidebar-toggle'}
        type="button"
        aria-label={menuOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        onClick={onToggleMenu}
      >
        <Icon name="arrowRight" size={22} />
      </button>
    </aside>
  )
}

export default Sidebar
