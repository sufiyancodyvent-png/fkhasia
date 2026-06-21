import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import { clearSession, getMyMessages, getSession, logout, markMessageRead } from '../../lib/api'

function formatMessageTime(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function Topbar({ title, subtitle, avatar = 'SA', employee = false, onMenuClick, menuOpen = true }) {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const notificationRef = useRef(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const session = getSession()
  const displayName = session?.user?.name || 'Account'
  const displayEmail = session?.user?.email || ''

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!session?.token) return undefined

    let cancelled = false

    const loadMessages = () => {
      getMyMessages()
        .then((result) => {
          if (cancelled) return
          setMessages(result.messages || [])
          setUnreadCount(result.unreadCount || 0)
        })
        .catch(() => {})
    }

    loadMessages()
    const timer = window.setInterval(loadMessages, 15000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [session?.token])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Local logout should still work if the API is temporarily unavailable.
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  const handleProfile = () => {
    setAccountOpen(false)
    navigate(session?.user?.role === 'employee' ? '/employee/profile' : '/admin/profile')
  }

  const handleOpenNotifications = async () => {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)

    if (!nextOpen) return

    const unreadMessages = messages.filter((message) => !message.readAt)
    setUnreadCount(0)
    await Promise.all(unreadMessages.map((message) => markMessageRead(message.id).catch(() => {})))
    setMessages((current) => current.map((message) => (
      message.readAt ? message : { ...message, readAt: new Date().toISOString() }
    )))
  }

  return (
    <header className={employee ? 'topbar employee' : 'topbar'}>
      <div className="topbar-title">
        <button
          className="icon-button"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={onMenuClick}
        >
          <Icon name="menu" size={25} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="notification-wrap" ref={notificationRef}>
          <button
            className={employee ? 'icon-button plain notification-trigger' : 'notification notification-trigger'}
            type="button"
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            onClick={handleOpenNotifications}
          >
            <Icon name="bell" size={23} />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-dropdown" role="menu">
              <div className="notification-head">
                <strong>Messages</strong>
                <span>{messages.length ? `${messages.length} recent` : 'No messages'}</span>
              </div>
              <div className="notification-list">
                {messages.map((message) => (
                  <article className={message.readAt ? 'message-preview' : 'message-preview unread'} key={message.id}>
                    <strong>{message.from?.name || 'Admin'}</strong>
                    <p>{message.body}</p>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </article>
                ))}
                {!messages.length && (
                  <p className="notification-empty">No messages yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="account-menu-wrap" ref={menuRef}>
          <button
            className={employee ? 'avatar slate' : 'avatar'}
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
          >
            {avatar}
          </button>
          {accountOpen && (
            <div className="account-dropdown" role="menu">
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
              <button className="profile-menu-button" type="button" onClick={handleProfile} role="menuitem">
                My Profile
              </button>
              <button className="logout-menu-button" type="button" onClick={handleLogout} role="menuitem">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
