import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import { getAllAttendance, getSession, updateAttendanceStatus } from '../lib/api'
import { formatClockTime } from '../lib/time'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function AdminAttendanceApprovalsPage() {
  const navigate = useNavigate()
  const [pendingLogs, setPendingLogs] = useState([])
  const [error, setError] = useState('')

  const loadPendingLogs = useCallback(async () => {
    const result = await getAllAttendance()
    setPendingLogs((result.logs || []).filter((log) => log.status === 'pending'))
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const session = getSession()
        if (!session) {
          navigate('/login')
          return
        }

        await loadPendingLogs()
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [loadPendingLogs, navigate])

  const handleStatusChange = async (id, status) => {
    try {
      setError('')
      await updateAttendanceStatus(id, status)
      await loadPendingLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-account-page attendance-page attendance-simple-page">
        <header className="admin-page-head">
          <div>
            <h1>Attendance Approvals</h1>
            <p>Final Approval For Attendance Anomalies</p>
          </div>
        </header>

        {error && <p className="page-error">{error}</p>}
        {pendingLogs.length ? (
          <section className="attendance-history-card">
            <div className="attendance-table-row header">
              <span>Date</span>
              <span>Employee</span>
              <span>Clock In</span>
              <span>Status</span>
              <span>Source</span>
              <span>Actions</span>
            </div>
            {pendingLogs.map((log) => (
              <div className="attendance-table-row" key={log._id || log.date}>
                <strong>{formatDate(log.date)}</strong>
                <span>{log.user?.name || 'Employee'}</span>
                <span>{formatClockTime(log.clockInAt)}</span>
                <em>{log.status}</em>
                <span>{log.source || 'self'}</span>
                <span className="approval-actions">
                  <button type="button" onClick={() => handleStatusChange(log._id, 'approved')}>Approve</button>
                  <button type="button" onClick={() => handleStatusChange(log._id, 'rejected')}>Reject</button>
                </span>
              </div>
            ))}
          </section>
        ) : (
          <section className="approval-empty-card">
            <div className="approval-check">
              <Icon name="checkCircle" size={66} />
            </div>
            <h2>No Pending Approvals</h2>
            <p>All Attendance Anomalies Reviewed</p>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminAttendanceApprovalsPage
