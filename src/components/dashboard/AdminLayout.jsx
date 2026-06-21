import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const pageCopy = {
  '/admin': ['Admin Dashboard', 'Today\'s attendance, people, and pending actions'],
  '/admin/live-users': ['Live Users', 'Logged-in staff, last activity, and quick messages'],
  '/admin/employees': ['Employee Directory', 'Manage employees, roles, departments, and records'],
  '/admin/departments': ['Departments', 'Organize departments and team structure'],
  '/admin/attendance': ['Attendance', 'Review employee attendance and work hours'],
  '/admin/attendance/approvals': ['Attendance Approvals', 'Approve or reject pending attendance records'],
  '/admin/attendance/settings': ['Attendance Settings', 'Configure shifts, work modes, and monthly goals'],
  '/admin/profile': ['My Profile', 'Update account details and password'],
}

function AdminLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const [title, subtitle] = pageCopy[pathname] || ['Admin Panel', 'Manage HR workflows']

  return (
    <main className={menuOpen ? 'dashboard-shell nav-expanded' : 'dashboard-shell'}>
      <Sidebar
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <section className="dashboard-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          menuOpen={menuOpen}
          onMenuClick={() => setMenuOpen((open) => !open)}
        />
        {children}
      </section>
    </main>
  )
}

export default AdminLayout
