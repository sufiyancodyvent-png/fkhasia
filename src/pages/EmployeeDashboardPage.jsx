import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../components/employee/EmployeeLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { clockIn, clockOut, endBreak, getEmployeeDashboard, getSession, startBreak, updateDailyNote } from '../lib/api'
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

  const loadDashboard = useCallback(async () => {
    try {
      if (!getSession()) {
        navigate('/login')
        return
      }

      setLoading(true)
      setData(await getEmployeeDashboard())
    } catch (err) {
      setError(err.message)
      if (/auth|session|token/i.test(err.message)) navigate('/login')
    } finally {
      setLoading(false)
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
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeDashboardPage
