const API_BASE = import.meta.env.VITE_API_URL || '/api'
const SESSION_KEY = 'fkhasia_session'

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function authHeader() {
  const session = getSession()
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {}
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  })
}

export function sendPresenceHeartbeat(path) {
  return apiRequest('/presence/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

export function getLiveSessions() {
  return apiRequest('/presence/sessions')
}

export function getMyMessages() {
  return apiRequest('/messages/mine')
}

export function sendMessage(to, body) {
  return apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ to, body }),
  })
}

export function markMessageRead(id) {
  return apiRequest(`/messages/${id}/read`, {
    method: 'PATCH',
  })
}

export function updateMyProfile(payload) {
  return apiRequest('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function changeMyPassword(payload) {
  return apiRequest('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getEmployeeDashboard() {
  return apiRequest('/dashboard/employee')
}

export function getAdminDashboard() {
  return apiRequest('/dashboard/admin')
}

export function getMyAttendance() {
  return apiRequest('/attendance/summary/me')
}

export function getAllAttendance() {
  return apiRequest('/attendance/all')
}

export function clockIn(payload = {}) {
  return apiRequest('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function clockOut() {
  return apiRequest('/attendance/clock-out', {
    method: 'POST',
  })
}

export function startBreak() {
  return apiRequest('/attendance/break/start', {
    method: 'POST',
  })
}

export function endBreak() {
  return apiRequest('/attendance/break/end', {
    method: 'POST',
  })
}

export function updateDailyNote(note) {
  return apiRequest('/attendance/today/note', {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  })
}

export function updateAttendanceStatus(id, status) {
  return apiRequest(`/attendance/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getAttendanceSettings() {
  return apiRequest('/settings/attendance')
}

export function updateAttendanceSettings(payload) {
  return apiRequest('/settings/attendance', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getUsers() {
  return apiRequest('/users')
}

export function createUser(payload) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id, payload) {
  return apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id) {
  return apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })
}

export function getDepartments() {
  return apiRequest('/departments')
}

export function createDepartment(payload) {
  return apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDepartment(id, payload) {
  return apiRequest(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteDepartment(id) {
  return apiRequest(`/departments/${id}`, {
    method: 'DELETE',
  })
}

export function getSupportTeamDashboard() {
  return apiRequest('/dashboard/support-team')
}

// Support Tickets API
export function getSupportTickets(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.category) params.append('category', filters.category)
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.sort) params.append('sort', filters.sort)

  const queryString = params.toString()
  return apiRequest(`/support${queryString ? '?' + queryString : ''}`)
}

export function getSupportTicket(id) {
  return apiRequest(`/support/${id}`)
}

export function createSupportTicket(payload) {
  return apiRequest('/support', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSupportTicket(id, payload) {
  return apiRequest(`/support/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function assignSupportTicket(id, assignedTo) {
  return apiRequest(`/support/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  })
}

export function resolveSupportTicket(id, payload = {}) {
  return apiRequest(`/support/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteSupportTicket(id) {
  return apiRequest(`/support/${id}`, {
    method: 'DELETE',
  })
}


