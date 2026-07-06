import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getSession, getSupportTeamDashboard, getSupportTickets, assignSupportTicket, getUsers } from '../lib/api'

function formatNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return String(value)
}

function AdminSupportDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Tabs and pagination states
  const [activeTab, setActiveTab] = useState('unassigned') // 'unassigned', 'open', 'solved'
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })

  useEffect(() => {
    // Show success message if ticket was just created
    if (location.state?.ticketCreated) {
      setSuccessMessage('Ticket created successfully! Your ticket has been added to the system.')
      setTimeout(() => setSuccessMessage(''), 5000)
      // Clear the location state
      navigate('/admin/support-dashboard', { replace: true })
    }
  }, [location.state, navigate])

  // Load stats and agents on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const session = getSession()
        if (!session) {
          navigate('/login')
          return
        }

        if (!['admin', 'manager'].includes(session.user.role)) {
          navigate('/employee/dashboard')
          return
        }

        setLoading(true)
        const dashboardData = await getSupportTeamDashboard()
        setData(dashboardData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [navigate])

  // Load tickets dynamically based on activeTab and page
  const loadTickets = useCallback(async () => {
    try {
      setTicketsLoading(true)
      const ticketsData = await getSupportTickets({
        status: activeTab,
        limit: 10,
        page: page,
        sort: activeTab === 'solved' ? '-updatedAt' : '-createdAt',
      })
      setTickets(ticketsData.tickets || [])
      if (ticketsData.pagination) {
        setPagination(ticketsData.pagination)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setTicketsLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setPage(1)
  }

  // Custom SVG Gauge Circle Helpers
  const radius = 55
  const circumference = 2 * Math.PI * radius

  // Semi-circle sweep for Occupancy/NPS
  // For standard circular gauge (approx 280deg sweep)
  const getStrokeDashoffset = (percentage, maxVal = 100) => {
    const fraction = percentage / maxVal
    return circumference * (1 - fraction)
  }

  // No modal helpers needed

  return (
    <div className="support-dashboard-container" style={{ minHeight: '100vh', width: '100%', margin: 0, padding: '24px', boxSizing: 'border-box', backgroundColor: '#071c24' }}>
        {error && <p className="page-error">{error}</p>}
        {loading && !data ? (
          <PageLoader label="Loading support dashboard..." />
        ) : (
          <>
            <header className="support-dashboard-header">
              <h1 style={{ display: 'flex', alignItems: 'center', fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginRight: '0.8rem', flexShrink: 0 }}>
                  <path d="M5 6l9 10-9 10h6l9-10-9-10H5z" fill="#ffffff" />
                  <path d="M13 6l9 10-9 10h6l9-10-9-10h-6z" fill="#00adb5" />
                </svg>
                Support Team Performance Dashboard
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#a3c2cb',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                    e.target.style.color = '#a3c2cb'
                  }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }}></i>
                  Back to Portal
                </button>
                <button
                  onClick={() => navigate('/admin/support/create-ticket')}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#2ec4b6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#24a199'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2ec4b6'}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: '0.4rem' }}></i>
                  Create Ticket
                </button>
                <div className="support-dashboard-filter">
                  <Icon name="calendar" size={16} />
                  <span>Period: {data?.period || 'Last 30 Days'}</span>
                </div>
              </div>
            </header>

            <main className="support-dashboard-grid">
              {/* Left Column */}
              <div className="support-column">
                {/* 2x2 Ticket Count Grid */}
                <section className="ticket-counts-grid" aria-label="Ticket volume summary">
                  <article className="ticket-count-tile">
                    <span className="tile-label">Unassigned</span>
                    <strong className="tile-value">{data?.ticketCounts?.unassigned}</strong>
                  </article>
                  <article className="ticket-count-tile">
                    <span className="tile-label">Open</span>
                    <strong className="tile-value">{data?.ticketCounts?.open}</strong>
                  </article>
                  <article className="ticket-count-tile solved">
                    <span className="tile-label">Solved</span>
                    <strong className="tile-value">{formatNumber(data?.ticketCounts?.solved || 0)}</strong>
                  </article>
                  <article className="ticket-count-tile escalated">
                    <span className="tile-label">Escalated</span>
                    <strong className="tile-value">{data?.ticketCounts?.escalated}</strong>
                  </article>
                </section>

                {/* Avg First Contact Resolution Rate */}
                <article className="support-card">
                  <h2 className="support-card-title">Avg First Contact Resolution Rate</h2>
                  <div className="gauge-wrapper">
                    <svg className="gauge-svg" viewBox="0 0 160 160">
                      <circle className="gauge-bg" cx="80" cy="80" r={radius} />
                      <circle
                        className="gauge-fill cyan"
                        cx="80"
                        cy="80"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={getStrokeDashoffset(data?.fcr?.rate || 0)}
                        transform="rotate(-90 80 80)"
                      />
                    </svg>
                    <div className="gauge-value-overlay">
                      <strong>{data?.fcr?.rate}%</strong>
                    </div>
                  </div>

                  <div className="category-breakdown-list">
                    {data?.fcr?.categories?.map((cat, index) => {
                      const fillClasses = ['progress-blue', 'progress-teal', 'progress-orange', 'progress-red']
                      const fillClass = fillClasses[index % fillClasses.length]
                      return (
                        <div className="category-row" key={cat.name}>
                          <div className="category-info">
                            <span className="category-name">{cat.name}</span>
                            <span className="category-value">{cat.rate}%</span>
                          </div>
                          <div className="category-progress-bg">
                            <div
                              className={`category-progress-fill ${fillClass}`}
                              style={{ width: `${cat.rate}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              </div>

              {/* Middle Column */}
              <div className="support-column">
                {/* Occupancy Rate */}
                <article className="support-card">
                  <h2 className="support-card-title">Occupancy Rate</h2>
                  <div className="gauge-wrapper">
                    {/* Semi-circular speedometer gauge */}
                    <svg className="gauge-svg" viewBox="0 0 160 160">
                      <path
                        d="M 25 110 A 55 55 0 1 1 135 110"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      {/* Sweep value path */}
                      <path
                        d="M 25 110 A 55 55 0 1 1 135 110"
                        fill="none"
                        stroke="#2ec4b6"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray="259.18"
                        // Arc length is ~259, mapping 78% of 259
                        strokeDashoffset={259.18 * (1 - (data?.occupancyRate?.rate || 0) / 100)}
                      />
                      {/* Needle pointing to angle */}
                      {/* 0% is ~ -125deg, 100% is ~ 125deg. Angle for 78% is roughly -125 + (250 * 0.78) = 70deg */}
                      <polygon
                        className="gauge-needle"
                        points="77,80 83,80 80,25"
                        style={{
                          transform: `rotate(${-125 + 250 * ((data?.occupancyRate?.rate || 0) / 100)}deg)`,
                          transformOrigin: '80px 80px',
                        }}
                      />
                      <circle className="gauge-center-dot" cx="80" cy="80" r="8" />
                    </svg>
                    <div className="gauge-value-overlay" style={{ top: '65%' }}>
                      <strong>{data?.occupancyRate?.rate}%</strong>
                    </div>
                  </div>
                  <p className="gauge-range-label">
                    Target Range: {data?.occupancyRate?.minTarget}% - {data?.occupancyRate?.maxTarget}%
                  </p>
                </article>

                {/* Net Promoter Score */}
                <article className="support-card">
                  <h2 className="support-card-title">Net Promoter Score</h2>
                  <div className="gauge-wrapper">
                    {/* Gauge from Red (Detractors) -> Yellow (Passives) -> Green (Promoters) */}
                    <svg className="gauge-svg" viewBox="0 0 160 160">
                      <defs>
                        <linearGradient id="npsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ff5e7e" />
                          <stop offset="50%" stopColor="#f39c12" />
                          <stop offset="100%" stopColor="#2ec4b6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 25 110 A 55 55 0 1 1 135 110"
                        fill="none"
                        stroke="url(#npsGradient)"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      {/* NPS score is typically from -100 to 100, mapped to gauge:
                          48 score mapped to percentage = (48 + 100)/200 = 74% */}
                      <polygon
                        className="gauge-needle"
                        points="77,80 83,80 80,25"
                        style={{
                          transform: `rotate(${-125 + 250 * (((data?.nps?.score || 0) + 100) / 200)}deg)`,
                          transformOrigin: '80px 80px',
                        }}
                      />
                      <circle className="gauge-center-dot" cx="80" cy="80" r="8" />
                    </svg>
                    <div className="gauge-value-overlay" style={{ top: '65%' }}>
                      <strong>{data?.nps?.score}</strong>
                    </div>
                  </div>

                  <div className="nps-legend-grid" aria-label="NPS user distributions">
                    <div className="nps-legend-item">
                      <span className="nps-legend-badge promoter">{data?.nps?.promoters}%</span>
                      <span className="nps-legend-text">Promoters</span>
                    </div>
                    <div className="nps-legend-item">
                      <span className="nps-legend-badge passive">{data?.nps?.passives}%</span>
                      <span className="nps-legend-text">Passives</span>
                    </div>
                    <div className="nps-legend-item">
                      <span className="nps-legend-badge detractor">{data?.nps?.detractors}%</span>
                      <span className="nps-legend-text">Detractors</span>
                    </div>
                  </div>
                </article>
              </div>

              {/* Right Column */}
              <div className="support-column">
                {/* Top Agents List */}
                <article className="support-card" style={{ flex: 1 }}>
                  <h2 className="support-card-title">Top Agents by Solved Tickets</h2>
                  <div className="top-agents-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {data?.topAgents?.map((agent) => {
                      const initials = agent.name
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()

                      const agentPhotos = {
                        'Tanner Hodge': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
                        'Lynda Shames': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=150&h=150&q=80',
                        'Kai Gaines': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
                        'Sophie Mortimer': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
                        'Kenzie Fields': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                      }
                      const photoUrl = agentPhotos[agent.name]

                      return (
                        <div className="agent-row-card" key={agent.name} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#09222b',
                          border: '1px solid rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                        }}>
                          <div className="agent-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={agent.name}
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #00adb5',
                                }}
                              />
                            ) : (
                              <div className="agent-avatar-circle" style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                border: '2px solid #00adb5',
                                backgroundColor: '#0c2b36',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                color: '#00adb5',
                              }}>
                                {initials}
                              </div>
                            )}
                            <div className="agent-meta" style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="agent-name" style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                                {agent.name}
                              </span>
                              <div className="agent-stats" style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#7fa1ab', marginTop: '2px', textTransform: 'uppercase' }}>
                                <span>
                                  Open: <strong style={{ color: '#fff' }}>{agent.open}</strong>
                                </span>
                                <span>
                                  Solved: <strong style={{ color: '#fff' }}>{formatNumber(agent.solved)}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="agent-satisfaction-badge" style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(0, 173, 181, 0.08)',
                            border: '1px solid rgba(0, 173, 181, 0.18)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            minWidth: '120px',
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                              <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 2z" fill="#f39c12" />
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#f39c12" strokeWidth="1.5" strokeDasharray="3 3" />
                            </svg>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }}>
                              <strong style={{ fontSize: '1.1rem', color: '#00adb5', fontWeight: '800' }}>{agent.satisfaction}%</strong>
                              <span style={{ fontSize: '0.65rem', color: '#7fa1ab', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.3px' }}>Satisfaction</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              </div>
            </main>

            {/* Recent Tickets Section */}
            <section className="support-tickets-section" style={{ marginTop: '2rem' }}>
              {successMessage && (
                <div style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(46, 204, 113, 0.15)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  borderRadius: '6px',
                  color: '#2ecc71',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Icon name="checkmark" size={16} />
                  {successMessage}
                </div>
              )}
              {/* Tabs Switcher */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
              }}>
                <button
                  type="button"
                  onClick={() => handleTabChange('unassigned')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'unassigned' ? '#2ec4b6' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderBottom: activeTab === 'unassigned' ? '2px solid #2ec4b6' : 'none',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  Unassigned ({data?.ticketCounts?.unassigned || 0})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('open')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'open' ? '#2ec4b6' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderBottom: activeTab === 'open' ? '2px solid #2ec4b6' : 'none',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  Open / Assigned ({data?.ticketCounts?.open || 0})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('solved')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'solved' ? '#2ec4b6' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderBottom: activeTab === 'solved' ? '2px solid #2ec4b6' : 'none',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  Solved ({data?.ticketCounts?.solved || 0})
                </button>
              </div>

              {ticketsLoading ? (
                <PageLoader label="Loading tickets..." />
              ) : tickets.length > 0 ? (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <thead style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    }}>
                      <tr>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Subject
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Category
                        </th>
                        {activeTab === 'unassigned' && (
                          <>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Created
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Action
                            </th>
                          </>
                        )}
                        {activeTab === 'open' && (
                          <>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Assigned Agent
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Assigned Date
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Action
                            </th>
                          </>
                        )}
                        {activeTab === 'solved' && (
                          <>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Solved By
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Rating
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              FCR
                            </th>
                            <th style={{
                              padding: '1rem',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Date Solved
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket, index) => (
                        <tr
                          key={ticket._id}
                          style={{
                            borderBottom: index < tickets.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                            backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                          }}
                        >
                          <td style={{
                            padding: '1rem',
                            fontSize: '0.875rem',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {ticket.subject}
                          </td>
                          <td style={{
                            padding: '1rem',
                            fontSize: '0.875rem',
                          }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(46, 196, 182, 0.1)',
                              color: '#2ec4b6',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            }}>
                              {ticket.category}
                            </span>
                          </td>

                          {activeTab === 'unassigned' && (
                            <>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                              }}>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : 'Just now'}
                              </td>
                              <td style={{
                                padding: '1rem',
                                textAlign: 'center',
                              }}>
                                <button
                                  onClick={() => navigate(`/admin/support/assign-ticket/${ticket._id}`)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#2ec4b6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Assign
                                </button>
                              </td>
                            </>
                          )}

                          {activeTab === 'open' && (
                            <>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: '#fff',
                              }}>
                                {ticket.assignedTo?.name || 'Unassigned'}
                              </td>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                              }}>
                                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : '-'}
                              </td>
                              <td style={{
                                padding: '1rem',
                                textAlign: 'center',
                              }}>
                                <button
                                  onClick={() => navigate(`/admin/support/assign-ticket/${ticket._id}`)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3498db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reassign
                                </button>
                              </td>
                            </>
                          )}

                          {activeTab === 'solved' && (
                            <>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: '#fff',
                              }}>
                                {ticket.assignedTo?.name || 'Unassigned'}
                              </td>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: '#f39c12',
                                fontWeight: '700',
                              }}>
                                {ticket.satisfactionRating ? `${ticket.satisfactionRating}/10` : '-'}
                              </td>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                              }}>
                                <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: ticket.firstContactResolved ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                                  color: ticket.firstContactResolved ? '#2ecc71' : '#e74c3c',
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                }}>
                                  {ticket.firstContactResolved ? 'FCR' : 'Standard'}
                                </span>
                              </td>
                              <td style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                              }}>
                                {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  {pagination.pages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    }}>
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          cursor: page === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Previous
                      </button>
                      
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0.5rem' }}>
                        Page <strong>{page}</strong> of {pagination.pages}
                      </span>

                      <button
                        type="button"
                        disabled={page === pagination.pages}
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: page === pagination.pages ? 'rgba(255,255,255,0.2)' : '#fff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}>
                  <Icon name="checkmark" size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255, 255, 255, 0.6)' }}>
                    No tickets found in this tab.
                  </p>
                </div>
              )}

              {/* No modal JSX needed */}
            </section>
          </>
        )}
    </div>
  )
}

export default AdminSupportDashboardPage
