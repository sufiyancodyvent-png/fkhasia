import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../components/employee/EmployeeLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { clockIn, clockOut, endBreak, getEmployeeDashboard, getSession, startBreak, updateDailyNote, getSupportTickets, resolveSupportTicket } from '../lib/api'
import { formatClockTime, formatShiftRange } from '../lib/time'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function totalHours(log) {
  if (!log.clockInAt || !log.clockOutAt) return '-'
  const minutes = Math.max(0, Math.round((new Date(log.clockOutAt) - new Date(log.clockInAt)) / 60000) - (log.totalBreakMinutes || 0))
  return `${(minutes / 60).toFixed(2)}h`
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(safeSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function formatLiveClock(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(value)
}

function normalizeWorkMode(value) {
  const mode = String(value || '').trim().toLowerCase()

  if (!mode || mode.includes('office')) return 'Office'
  if (mode === 'remote') return 'Remote'
  if (mode === 'hybrid') return 'Hybrid'

  return value
}

function shiftLabel(settings) {
  return formatShiftRange(settings?.shiftStart || '09:00', settings?.shiftEnd || '18:00')
}

function TimeCell({ time, badge, delta }) {
  return (
    <span className="edb-time-cell">
      <span>{time}</span>
      {badge && (
        <span className="edb-time-note">
          <b className={badge === 'LATE' ? 'late' : 'early'}>{badge}</b>
          <small>{delta}</small>
        </span>
      )}
    </span>
  )
}

function csvCell(value) {
  const text = String(value ?? '').replaceAll('"', '""')
  return `"${text}"`
}

function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [selectedWorkMode, setSelectedWorkMode] = useState('Office')
  const [dailyNote, setDailyNote] = useState('')
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState('')

  // Assigned support tickets states
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null)
  const [satisfactionRating, setSatisfactionRating] = useState(10)
  const [firstContactResolved, setFirstContactResolved] = useState(true)
  const [resolvingLoading, setResolvingLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const session = getSession()
      if (!session) {
        navigate('/login')
        return
      }

      setLoading(true)
      const dashboardData = await getEmployeeDashboard()
      setData(dashboardData)

      // Fetch assigned support tickets (status: 'open')
      setTicketsLoading(true)
      const ticketsData = await getSupportTickets({
        assignedTo: session.user._id,
        status: 'open',
        sort: '-updatedAt',
      })
      setTickets(ticketsData.tickets || [])
    } catch (err) {
      setError(err.message)
      if (/auth|session|token/i.test(err.message)) navigate('/login')
    } finally {
      setLoading(false)
      setTicketsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!data) return
    setSelectedWorkMode(normalizeWorkMode(data.todayLog?.workMode || data.user?.workMode || 'Office'))
    setDailyNote(data.todayLog?.note || '')
  }, [data])

  const stats = useMemo(() => [
    { icon: 'circleCheck', tone: 'blue', label: 'ATTENDANCE RATE', value: `${data?.summary?.attendanceRate || 0}%`, note: '' },
    { icon: 'clock', tone: 'blue', label: 'DAYS WORKED', value: String(data?.summary?.daysWorked || 0), note: 'This Month' },
    { icon: 'timer', tone: 'orange', label: 'TOTAL HOURS', value: `${data?.summary?.workedHours || 0}h`, note: 'This Month' },
  ], [data])

  const handleClockIn = async () => {
    try {
      setActionLoading('clock')
      setError('')
      await clockIn({ workMode: selectedWorkMode, note: dailyNote })
      await loadDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading('')
    }
  }

  const handleClockOut = async () => {
    try {
      setActionLoading('clock')
      setError('')
      await clockOut()
      await loadDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading('')
    }
  }

  const handleBreak = async () => {
    try {
      setActionLoading('break')
      setError('')
      if (todayLog?.breakStartedAt) {
        await endBreak()
      } else {
        await startBreak()
      }
      await loadDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading('')
    }
  }

  const handleSaveNote = async () => {
    try {
      setActionLoading('note')
      setError('')
      const result = await updateDailyNote(dailyNote)
      setData((current) => current ? { ...current, todayLog: result.log } : current)
      setNoteSaved(true)
      setIsNotesOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading('')
    }
  }

  const handleExportCsv = () => {
    const headers = ['Date', 'Shift Details', 'Clock In', 'Clock Out', 'Break', 'Total Work', 'Status', 'Daily Note']
    const rows = logs.map((log) => [
      formatDate(log.date),
      shiftLabel(settings),
      formatClockTime(log.clockInAt),
      formatClockTime(log.clockOutAt),
      log.totalBreakMinutes ? `${log.totalBreakMinutes}m` : '-',
      totalHours(log),
      String(log.status || 'pending').toUpperCase(),
      log.note || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fkhasia-attendance-${currentMonthLabel.toLowerCase().replace(' ', '-')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleResolveTicket = async () => {
    try {
      setResolvingLoading(true)
      setError('')
      await resolveSupportTicket(selectedTicketForResolve._id, {
        satisfactionRating,
        firstContactResolved,
      })
      setResolveModalOpen(false)
      setSelectedTicketForResolve(null)
      await loadDashboard()
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket')
    } finally {
      setResolvingLoading(false)
    }
  }

  const settings = data?.settings || {}
  const summary = data?.summary || {}
  const userName = data?.user?.name || getSession()?.user?.name || 'Employee'
  const logs = data?.logs || []
  const todayLog = data?.todayLog
  const isClockedIn = Boolean(todayLog?.clockInAt && !todayLog?.clockOutAt)
  const isOnBreak = Boolean(todayLog?.breakStartedAt && isClockedIn)
  const shiftStatus = isClockedIn ? (isOnBreak ? 'ON BREAK' : 'ONLINE') : 'OFFLINE'
  const workModeOptions = (() => {
    const modes = settings.workModes?.length ? settings.workModes : ['Office', 'Remote', 'Hybrid']
    return [...new Set(modes.map(normalizeWorkMode))]
  })()
  const workedSeconds = (() => {
    if (!todayLog?.clockInAt) return 0

    const endTime = todayLog.clockOutAt ? new Date(todayLog.clockOutAt).getTime() : now
    const breakSeconds = (todayLog.totalBreakMinutes || 0) * 60
    const activeBreakSeconds = todayLog.breakStartedAt && !todayLog.clockOutAt
      ? Math.max(0, Math.floor((now - new Date(todayLog.breakStartedAt).getTime()) / 1000))
      : 0

    return Math.floor((endTime - new Date(todayLog.clockInAt).getTime()) / 1000) - breakSeconds - activeBreakSeconds
  })()
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()).toUpperCase()

  return (
    <EmployeeLayout>
      <div className="employee-content employee-dashboard-ref">
        {error && <p className="page-error">{error}</p>}
        {loading && !data ? (
          <PageLoader label="Loading employee workspace..." />
        ) : (
          <>
        <div className="edb-welcome-row">
          <div>
            <h2>Welcome Back!, {userName}</h2>
            <p>Here Is What Is Happening With Your Account</p>
          </div>
          <div className="edb-clock">
            <strong>{formatLiveClock(new Date(now))}</strong>
            <span>{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: '2-digit' }).format(new Date()).toUpperCase()}</span>
          </div>
        </div>

        <section className="edb-shift-grid">
          <article className="edb-goal-card">
            <div className="edb-card-title">
              <h3>Monthly Goal</h3>
              <Icon name="infoCircle" size={18} />
            </div>
            <div className="edb-goal-meter">
              <strong>{summary.workedHours || 0}</strong>
              <span>/ {summary.monthlyGoalHours || 160}h</span>
            </div>
            <div className="edb-goal-label">
              <span>HOURS LOG PROGRESS</span>
              <b>{summary.progress || 0}%</b>
            </div>
            <div className="edb-progress-bar">
              <span style={{ width: `${Math.min(summary.progress || 0, 100)}%` }} />
            </div>
          </article>

          <article className="edb-shift-card">
            <div className="edb-shift-heading">
              <h3>Shift Controls</h3>
              <p>Scheduled: {shiftLabel(settings)} (General Shift)</p>
            </div>
            <span className={isClockedIn ? 'edb-offline online' : 'edb-offline'}>{shiftStatus}</span>
            <div className="edb-shift-actions">
              <button
                className="edb-clock-in"
                type="button"
                onClick={isClockedIn ? handleClockOut : handleClockIn}
                disabled={loading || actionLoading === 'clock' || isOnBreak}
              >
                <Icon name="clock" size={24} />
                <span>{actionLoading === 'clock' ? 'Saving...' : isClockedIn ? 'Clock Out' : 'Clock In'}</span>
              </button>
              <button
                className={isOnBreak ? 'edb-break active' : 'edb-break'}
                type="button"
                onClick={handleBreak}
                disabled={!isClockedIn || actionLoading === 'break'}
              >
                <Icon name="coffee" size={22} />
                <span>{actionLoading === 'break' ? 'Saving...' : isOnBreak ? 'End Break' : 'Take Break'}</span>
              </button>
              <div className="edb-active-timer">
                <span>ACTIVE TIMER</span>
                <strong>{formatDuration(workedSeconds)}</strong>
              </div>
            </div>
            <div className="edb-work-panel">
              <div className="edb-work-row">
                <span className="edb-work-icon pin"><Icon name="mapPin" size={22} /></span>
                <div>
                  <small>WORK MODE</small>
                  <select
                    className="edb-work-mode-select"
                    value={selectedWorkMode}
                    onChange={(event) => setSelectedWorkMode(event.target.value)}
                    disabled={isClockedIn}
                    aria-label="Work mode"
                  >
                    {workModeOptions.map((mode) => (
                      <option value={mode} key={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="edb-work-row">
                <span className="edb-work-icon"><Icon name="file" size={21} /></span>
                <div>
                  <small>DAILY NOTE</small>
                  <button
                    className="edb-notes-button"
                    type="button"
                    onClick={() => setIsNotesOpen(true)}
                  >
                    <Icon name="file" size={16} />
                    <span>{dailyNote ? 'View Notes' : 'Add Notes'}</span>
                  </button>
                  {noteSaved && <p className="edb-note-status">Saved</p>}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="edb-stats-grid" aria-label="Attendance summary">
          {stats.map((stat) => (
            <article className="edb-stat-card" key={stat.label}>
              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
              <Icon name={stat.icon} size={19} />
              {stat.note && <small className={stat.tone}>{stat.note}</small>}
            </article>
          ))}
        </section>

        {/* Assigned Support Tickets Section */}
        <article className="edb-log-card" style={{ marginBottom: '2rem' }}>
          <div className="edb-log-head">
            <h2>Assigned Support Tickets <span>ACTIVE</span></h2>
          </div>

          <div className="edb-table-wrap">
            {ticketsLoading ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading tickets...</p>
            ) : tickets.length > 0 ? (
              <table className="edb-log-table">
                <thead>
                  <tr>
                    <th>SUBJECT</th>
                    <th>CATEGORY</th>
                    <th>ASSIGNED DATE</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>{ticket.subject}</td>
                      <td>
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
                      <td>
                        {new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketForResolve(ticket)
                            setSatisfactionRating(10)
                            setFirstContactResolved(true)
                            setResolveModalOpen(true)
                          }}
                          style={{
                            padding: '0.4rem 1rem',
                            backgroundColor: '#2ec4b6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                No active tickets assigned to you.
              </div>
            )}
          </div>
        </article>

        <article className="edb-log-card">
          <div className="edb-log-head">
            <h2>Log History <span>{currentMonthLabel}</span></h2>
            <div className="edb-log-actions">
              <button className="edb-export-button" type="button" onClick={handleExportCsv}>
                <Icon name="download" size={18} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="edb-table-wrap">
            <table className="edb-log-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>SHIFT<br />DETAILS</th>
                  <th>CLOCK IN</th>
                  <th>CLOCK OUT</th>
                  <th>BREAK</th>
                  <th>TOTAL<br />WORK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id || log.date}>
                    <td>{formatDate(log.date)}</td>
                    <td>{shiftLabel(settings)}</td>
                    <td><TimeCell time={formatClockTime(log.clockInAt)} /></td>
                    <td><TimeCell time={formatClockTime(log.clockOutAt)} /></td>
                    <td>{log.totalBreakMinutes ? `${log.totalBreakMinutes}m` : '-'}</td>
                    <td><strong>{totalHours(log)}</strong></td>
                    <td><span className="edb-approved">{String(log.status || 'pending').toUpperCase()}</span></td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan="7">No attendance logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
          </>
        )}
        {isNotesOpen && (
          <div className="edb-note-modal-backdrop" role="presentation" onClick={() => setIsNotesOpen(false)}>
            <section
              className="edb-note-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="daily-note-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="edb-note-modal-head">
                <div>
                  <span>WORK NOTES</span>
                  <h2 id="daily-note-title">Daily Note</h2>
                </div>
                <button type="button" onClick={() => setIsNotesOpen(false)} aria-label="Close notes">x</button>
              </div>
              <textarea
                value={dailyNote}
                onChange={(event) => {
                  setDailyNote(event.target.value)
                  setNoteSaved(false)
                }}
                placeholder="Write today's work note..."
              />
              <div className="edb-note-modal-foot">
                <span>Saved until you change it</span>
                <div>
                  <button className="edb-note-cancel" type="button" onClick={() => setIsNotesOpen(false)}>Cancel</button>
                  <button
                    className="edb-note-save"
                    type="button"
                    onClick={handleSaveNote}
                    disabled={actionLoading === 'note'}
                  >
                    {actionLoading === 'note' ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Resolve Ticket Modal */}
        {resolveModalOpen && (
          <div className="edb-note-modal-backdrop" role="presentation" onClick={() => setResolveModalOpen(false)}>
            <section
              className="edb-note-modal"
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: '400px', backgroundColor: '#0c2b36', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="edb-note-modal-head">
                <div>
                  <span>RESOLVE TICKET</span>
                  <h2 style={{ fontSize: '1.1rem', margin: '0.2rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTicketForResolve?.subject}
                  </h2>
                </div>
                <button type="button" onClick={() => setResolveModalOpen(false)} aria-label="Close resolve details">x</button>
              </div>
              
              <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                    Customer Satisfaction (1-10)
                  </label>
                  <select
                    value={satisfactionRating}
                    onChange={(e) => setSatisfactionRating(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} style={{ backgroundColor: '#0c2b36' }}>
                        {num} - {num >= 9 ? 'Promoter' : num >= 7 ? 'Passive' : 'Detractor'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="fcr-checkbox"
                    checked={firstContactResolved}
                    onChange={(e) => setFirstContactResolved(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="fcr-checkbox" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                    Resolved on First Contact (FCR)
                  </label>
                </div>
              </div>

              <div className="edb-note-modal-foot">
                <span>Move ticket to solved state</span>
                <div>
                  <button className="edb-note-cancel" type="button" onClick={() => setResolveModalOpen(false)}>Cancel</button>
                  <button
                    className="edb-note-save"
                    type="button"
                    onClick={handleResolveTicket}
                    disabled={resolvingLoading}
                    style={{ backgroundColor: '#2ec4b6' }}
                  >
                    {resolvingLoading ? 'Saving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeDashboardPage
