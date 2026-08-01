import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminAttendanceApprovalsPage from './pages/AdminAttendanceApprovalsPage'
import AdminAttendancePage from './pages/AdminAttendancePage'
import AdminAttendanceSettingsPage from './pages/AdminAttendanceSettingsPage'
import AdminDepartmentsPage from './pages/AdminDepartmentsPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import AdminProfilePage from './pages/AdminProfilePage'
import AdminLiveUsersPage from './pages/AdminLiveUsersPage'
import AdminSupportDashboardPage from './pages/AdminSupportDashboardPage'
import CreateSupportTicketPage from './pages/CreateSupportTicketPage'
import AssignSupportTicketPage from './pages/AssignSupportTicketPage'
import AuthPage from './pages/AuthPage'
import EmployeeAttendancePage from './pages/EmployeeAttendancePage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import usePresenceHeartbeat from './hooks/usePresenceHeartbeat'
import { getGatewayToken } from './lib/api'
import './App.css'
import './employee-final.css'
import './support-dashboard.css'

function GatewayGuard() {
  const token = getGatewayToken()
  if (!token) {
    return <Navigate to="/gateway" replace />
  }
  return <Outlet />
}

function App() {
  usePresenceHeartbeat()

  return (
    <Routes>
      <Route path="/gateway" element={<AuthPage mode="gateway" />} />

      <Route element={<GatewayGuard />}>
        <Route path="/" element={<Navigate to="/select-role" replace />} />
        <Route path="/select-role" element={<RoleSelectionPage />} />
        <Route path="/login/:role" element={<AuthPage mode="login" />} />
        <Route path="/login" element={<Navigate to="/select-role" replace />} />
        <Route path="/register" element={<Navigate to="/select-role" replace />} />
        <Route path="/employee" element={<EmployeeDashboardPage />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
        <Route path="/employee/profile" element={<AdminProfilePage employee />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/members" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/roles" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
        <Route path="/admin/employees" element={<AdminEmployeesPage />} />
        <Route path="/admin/live-users" element={<AdminLiveUsersPage />} />
        <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        <Route path="/admin/attendance/approvals" element={<AdminAttendanceApprovalsPage />} />
        <Route path="/admin/attendance/settings" element={<AdminAttendanceSettingsPage />} />
        <Route path="/admin/support-dashboard" element={<AdminSupportDashboardPage />} />
        <Route path="/admin/support/create-ticket" element={<CreateSupportTicketPage />} />
        <Route path="/admin/support/assign-ticket/:id" element={<AssignSupportTicketPage />} />
        <Route path="*" element={<Navigate to="/select-role" replace />} />
      </Route>
    </Routes>
  )
}

export default App
