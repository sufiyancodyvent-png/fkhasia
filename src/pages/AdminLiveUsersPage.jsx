import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getLiveSessions, getSession, sendMessage } from '../lib/api'

function initials(name = 'User') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function timeAgo(value) {
  if (!value) return '-'

  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}

function statusLabel(status) {
  if (status === 'online') return 'Online'
  if (status === 'idle') return 'Idle'
  return 'Offline'
}

function MessagePanel({ target, text, saving, sent, onChange, onClose, onSend }) {
  if (!target) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="admin-modal live-message-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="message-user-title">Message {target.name}</h2>
            <p>{target.email}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close message form">x</button>
        </header>
        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type a short message for this user..."
          rows={5}
        />
        {sent && <p className="page-success">Message sent successfully.</p>}
        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="green-action" type="button" onClick={onSend} disabled={saving || !text.trim()}>
            {saving ? 'Sending...' : 'Send Message'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function AdminLiveUsersPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState({ online: 0, idle: 0, offline: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [messageTarget, setMessageTarget] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [savingMessage, setSavingMessage] = useState(false)

  const loadSessions = useCallback(async (silent = false) => {
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

      if (!silent) setLoading(true)
      const result = await getLiveSessions()
      setSessions(result.sessions || [])
      setSummary(result.summary || { online: 0, idle: 0, offline: 0 })
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadSessions()
    const timer = window.setInterval(() => loadSessions(true), 10000)
    return () => window.clearInterval(timer)
  }, [loadSessions])

  const filteredSessions = useMemo(() => {
    const search = query.trim().toLowerCase()

    return sessions.filter((session) => {
      const matchesSearch = !search
        || session.name?.toLowerCase().includes(search)
        || session.email?.toLowerCase().includes(search)
        || session.department?.toLowerCase().includes(search)
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && ['online', 'idle'].includes(session.status))
        || session.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [query, sessions, statusFilter])

  const openMessage = (session) => {
    setMessageTarget(session)
    setMessageText('')
    setMessageSent(false)
  }

  const handleSendMessage = async () => {
    if (!messageTarget || !messageText.trim()) return

    try {
      setSavingMessage(true)
      await sendMessage(messageTarget.userId, messageText)
      setMessageSent(true)
      setMessageText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingMessage(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-account-page live-users-page">
        <header className="admin-page-head">
          <div>
            <h1>Live Users</h1>
            <p>See who is logged in right now, when they were last active, and send quick messages.</p>
          </div>
          <button className="green-action" type="button" onClick={() => loadSessions()}>
            <Icon name="clock" size={18} />
            Refresh
          </button>
        </header>

        <section className="live-summary-grid">
          <article className="live-summary-card online">
            <Icon name="userCheck" size={22} />
            <span>Online</span>
            <strong>{summary.online}</strong>
          </article>
          <article className="live-summary-card idle">
            <Icon name="clock" size={22} />
            <span>Idle</span>
            <strong>{summary.idle}</strong>
          </article>
          <article className="live-summary-card offline">
            <Icon name="userMinus" size={22} />
            <span>Recently Offline</span>
            <strong>{summary.offline}</strong>
          </article>
        </section>

        <section className="hr-search-card live-user-filters">
          <div className="member-search employee-search">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search name, email, or department..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="active">Online + Idle</option>
            <option value="online">Online Only</option>
            <option value="idle">Idle Only</option>
            <option value="offline">Recently Offline</option>
            <option value="all">All Sessions</option>
          </select>
        </section>

        <section className="live-users-card">
          {error && <p className="page-error">{error}</p>}
          {loading ? (
            <PageLoader label="Loading live users..." />
          ) : (
            <>
              <div className="live-user-row header">
                <span>User</span>
                <span>Status</span>
                <span>Current Page</span>
                <span>Login / Last Seen</span>
                <span>Action</span>
              </div>
              {filteredSessions.map((session) => (
                <div className="live-user-row" key={session.id}>
                  <div className="live-user-person">
                    <span>{initials(session.name)}</span>
                    <div>
                      <strong>{session.name}</strong>
                      <small>{session.email}</small>
                      <small>{session.department} / {session.designation}</small>
                    </div>
                  </div>
                  <span className={`live-status ${session.status}`}>{statusLabel(session.status)}</span>
                  <span className="live-path">{session.currentPath || '-'}</span>
                  <div className="live-time">
                    <strong>{formatDateTime(session.loginAt)}</strong>
                    <small>{timeAgo(session.lastSeenAt)}</small>
                  </div>
                  <button className="live-message-button" type="button" onClick={() => openMessage(session)}>
                    <Icon name="mail" size={17} />
                    Message
                  </button>
                </div>
              ))}
              {!filteredSessions.length && (
                <div className="live-user-empty">
                  <Icon name="users" size={28} />
                  <strong>No matching sessions</strong>
                  <span>Try another status filter or refresh the page.</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <MessagePanel
        target={messageTarget}
        text={messageText}
        saving={savingMessage}
        sent={messageSent}
        onChange={(value) => {
          setMessageText(value)
          setMessageSent(false)
        }}
        onClose={() => setMessageTarget(null)}
        onSend={handleSendMessage}
      />
    </AdminLayout>
  )
}

export default AdminLiveUsersPage
