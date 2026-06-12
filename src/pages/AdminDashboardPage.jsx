import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApprovalCard, ApprovalQueue, MetricCard } from '../components/dashboard/AdminCards'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getAdminDashboard, getSession } from '../lib/api'

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
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
        setData(await getAdminDashboard())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const overviewCards = useMemo(() => [
    { label: 'Employee Count', value: String(data?.overview?.employeeCount || 0), chip: 'Total', icon: 'users', tone: 'violet' },
    { label: 'Present Today', value: String(data?.overview?.presentToday || 0), chip: 'Live', icon: 'userCheck', tone: 'mint' },
    { label: 'Late Entry', value: String(data?.overview?.lateEntry || 0), chip: 'Warning', icon: 'clock', tone: 'amber' },
    { label: 'Absent Today', value: String(data?.overview?.absentToday || 0), chip: 'Today', icon: 'userMinus', tone: 'rose' },
  ], [data])

  const approvalCards = useMemo(() => [
    { label: 'Leave Requests', value: String(data?.approvals?.leaveRequests || 0), icon: 'calendarCheck', tone: 'mint' },
    { label: 'Attendance Approval', value: String(data?.approvals?.attendanceApprovals || 0), icon: 'userCheck', tone: 'blue' },
  ], [data])
  const todayLabel = new Intl.DateTimeFormat('en-GB').format(new Date())

  return (
    <AdminLayout>
      <div className="dashboard-content">
          {error && <p className="page-error">{error}</p>}
          {loading && !data ? (
            <PageLoader label="Loading admin dashboard..." />
          ) : (
            <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Workforce Overview</p>
              <h2>Today's Live Attendance & Personnel Status</h2>
            </div>
            <button className="date-pill" type="button">
              <Icon name="calendar" size={18} />
              {todayLabel}
            </button>
          </div>

          <div className="overview-grid">
            {overviewCards.map((card) => <MetricCard card={card} key={card.label} />)}
          </div>

          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Pending Approval Hub</p>
              <h2>Actions Required To Maintain Workflow Continuity</h2>
            </div>
          </div>

          <div className="approval-grid">
            {approvalCards.map((card) => <ApprovalCard card={card} key={card.label} />)}
          </div>

          <section className="dashboard-lower">
            <ApprovalQueue rows={[]} />
          </section>
            </>
          )}
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
