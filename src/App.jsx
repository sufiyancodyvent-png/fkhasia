import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminAttendanceApprovalsPage from './pages/AdminAttendanceApprovalsPage'
import AdminAttendancePage from './pages/AdminAttendancePage'
import AdminAttendanceSettingsPage from './pages/AdminAttendanceSettingsPage'
import AdminDepartmentsPage from './pages/AdminDepartmentsPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import AdminProfilePage from './pages/AdminProfilePage'
import AuthPage from './pages/AuthPage'
import EmployeeAttendancePage from './pages/EmployeeAttendancePage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import './App.css'
import './employee-final.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/employee" element={<EmployeeDashboardPage />} />
      <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
      <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/members" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/roles" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/profile" element={<AdminProfilePage />} />
      <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
      <Route path="/admin/employees" element={<AdminEmployeesPage />} />
      <Route path="/admin/attendance" element={<AdminAttendancePage />} />
      <Route path="/admin/attendance/approvals" element={<AdminAttendanceApprovalsPage />} />
      <Route path="/admin/attendance/settings" element={<AdminAttendanceSettingsPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
