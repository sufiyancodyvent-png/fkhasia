import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getAllAttendance, getSession } from '../lib/api'
import { formatClockTime } from '../lib/time'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-GB').format(value)
}

function currentMonthRange() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  }
}

function totalHours(log) {
  if (!log.clockInAt || !log.clockOutAt) return '-'
  const minutes = Math.max(0, Math.round((new Date(log.clockOutAt) - new Date(log.clockInAt)) / 60000) - (log.totalBreakMinutes || 0))
  return `${(minutes / 60).toFixed(2)}h`
}

function DateButton({ value }) {
  return (
    <button className="attendance-filter-btn" type="button">
      <Icon name="calendar" size={17} />
      <span>{value}</span>
    </button>
  )
}

function SummaryCard({ tone, icon, label, value, title, subtitle }) {
  return (
    <article className={`attendance-summary-card ${tone}`}>
      <div className="attendance-summary-top">
        <span className="attendance-summary-icon">
          <Icon name={icon} size={24} />
        </span>
        <strong>{label}</strong>
      </div>
      {title ? (
        <div className="attendance-employee-copy">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      ) : (
        <b>{value}</b>
      )}
    </article>
  )
}

function AdminAttendancePage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const session = getSession()
        if (!session) {
          navigate('/login')
          return
        }
        setLogs((await getAllAttendance()).logs)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const workedDays = logs.length
  const monthRange = currentMonthRange()
  const total = logs.reduce((sum, log) => {
    if (!log.clockInAt || !log.clockOutAt) return sum
    return sum + Math.max(0, Math.round((new Date(log.clockOutAt) - new Date(log.clockInAt)) / 60000) - (log.totalBreakMinutes || 0)) / 60
  }, 0)

  return (
    <AdminLayout>
      <div className="admin-account-page attendance-page">
        <header className="attendance-page-head">
          <div className="attendance-title-row">
            <button className="attendance-back-btn" type="button" aria-label="Back">
              <Icon name="arrowLeft" size={20} />
            </button>
            <div>
              <h1>Employee Attendance</h1>
              <p>Attendance history from the live system</p>
            </div>
          </div>
          <div className="attendance-filters">
            <DateButton value={formatShortDate(monthRange.start)} />
            <DateButton value={formatShortDate(monthRange.end)} />
            <button className="attendance-export-btn" type="button">
              <Icon name="download" size={18} />
              Export Csv
            </button>
          </div>
        </header>

        <section className="attendance-summary-grid">
          <SummaryCard tone="blue" icon="user" label="Employees" title={`${new Set(logs.map((log) => log.user?._id)).size}`} subtitle="With Attendance Logs" />
          <SummaryCard tone="blue" icon="calendar" label="Days Worked" value={workedDays} />
          <SummaryCard tone="amber" icon="clock" label="Total Hours" value={<><span>{total.toFixed(1)}</span>h</>} />
          <SummaryCard tone="purple" icon="filter" label="Avg. Daily" value={<><span>{workedDays ? (total / workedDays).toFixed(2) : 0}</span>h</>} />
        </section>

        <section className="attendance-history-card">
          {error && <p className="page-error">{error}</p>}
          {loading && <PageLoader label="Loading attendance records..." />}
          <div className="attendance-table-row header">
            <span>Date</span>
            <span>Clock In</span>
            <span>Clock Out</span>
            <span>Hours</span>
            <span>Status</span>
            <span>Type</span>
          </div>
          {!loading && logs.map((log) => (
            <div className="attendance-table-row" key={log._id || log.date}>
              <strong>{formatDate(log.date)}</strong>
              <span>{formatClockTime(log.clockInAt)}</span>
              <span>{formatClockTime(log.clockOutAt)}</span>
              <b>{totalHours(log)}</b>
              <em>{log.status}</em>
              <span>{log.source} / {log.user?.name || 'Employee'}</span>
            </div>
          ))}
          {!loading && !logs.length && (
            <div className="attendance-table-row">
              <strong>No records yet</strong>
              <span>-</span>
              <span>-</span>
              <b>-</b>
              <em>Pending</em>
              <span>-</span>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminAttendancePage
