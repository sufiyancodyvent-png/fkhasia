import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../components/employee/EmployeeLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getMyAttendance, getSession } from '../lib/api'
import { formatClockTime } from '../lib/time'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))
}

function totalHours(log) {
  if (!log.clockInAt || !log.clockOutAt) return '-'
  const minutes = Math.max(0, Math.round((new Date(log.clockOutAt) - new Date(log.clockInAt)) / 60000) - (log.totalBreakMinutes || 0))
  return `${(minutes / 60).toFixed(2)}h`
}

function EmployeeAttendancePage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ summary: {}, logs: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        if (!getSession()) {
          navigate('/login')
          return
        }
        setData(await getMyAttendance())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const attendanceSummary = [
    { tone: 'blue', icon: 'clock', label: 'Monthly Total', value: data.summary.workedHours || 0, unit: 'h', note: 'This Month' },
    { tone: 'blue', icon: 'calendar', label: 'Days Worked', value: data.summary.daysWorked || 0, unit: '', note: 'This Month' },
    { tone: 'amber', icon: 'arrowRight', label: 'Avg. Daily', value: data.summary.daysWorked ? (data.summary.workedHours / data.summary.daysWorked).toFixed(1) : 0, unit: 'h', note: 'Per day' },
    { tone: 'purple', icon: 'filter', label: 'Approved', value: data.summary.approved || 0, unit: `/${data.summary.records || 0}`, note: 'Records' },
  ]
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <EmployeeLayout>
      <div className="employee-attendance-page">
        {error && <p className="page-error">{error}</p>}
        {loading ? (
          <PageLoader label="Loading attendance..." />
        ) : (
          <>
        <header className="employee-attendance-head">
          <div>
            <h1>My Attendance</h1>
            <p>{currentMonthLabel}</p>
          </div>
          <button className="employee-month-picker" type="button">
            <Icon name="calendar" size={18} />
            <span>{currentMonthLabel}</span>
            <Icon name="calendar" size={18} />
          </button>
        </header>

        <section className="employee-attendance-summary">
          {attendanceSummary.map((item) => (
            <article className={`employee-attendance-card ${item.tone}`} key={item.label}>
              <div>
                <span className="employee-attendance-icon">
                  <Icon name={item.icon} size={25} />
                </span>
                <strong>{item.label}</strong>
              </div>
              <b>{item.value}<small>{item.unit}</small></b>
              <p>{item.note}</p>
            </article>
          ))}
        </section>

        <section className="employee-attendance-table">
          <div className="employee-attendance-row header">
            <span>Date</span>
            <span>Clock In</span>
            <span>Clock Out</span>
            <span>Hours</span>
            <span>Status</span>
            <span>Type</span>
          </div>
          {data.logs.map((log) => (
            <div className="employee-attendance-row" key={log._id || log.date}>
              <strong>{formatDate(log.date)}</strong>
              <span>{formatClockTime(log.clockInAt)}</span>
              <span>{formatClockTime(log.clockOutAt)}</span>
              <b>{totalHours(log)}</b>
              <em>{log.status || 'pending'}</em>
              <small>{log.source || 'self'} / {log.workMode || 'office'}</small>
            </div>
          ))}
          {!data.logs.length && (
            <div className="employee-attendance-row">
              <strong>No records yet</strong>
              <span>-</span>
              <span>-</span>
              <b>-</b>
              <em>Pending</em>
              <small>-</small>
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeAttendancePage
