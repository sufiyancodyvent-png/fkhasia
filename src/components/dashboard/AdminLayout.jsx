import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AdminLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className={menuOpen ? 'dashboard-shell nav-expanded' : 'dashboard-shell'}>
      <Sidebar
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <section className="dashboard-main">
        <Topbar
          title="System Performance"
          subtitle="Global Infrastructure Monitoring"
          menuOpen={menuOpen}
          onMenuClick={() => setMenuOpen((open) => !open)}
        />
        {children}
      </section>
    </main>
  )
}

export default AdminLayout
