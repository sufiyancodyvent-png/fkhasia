import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { UserSession } from '../models/UserSession.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()
const ONLINE_WINDOW_MS = 60 * 1000
const IDLE_WINDOW_MS = 5 * 60 * 1000

function presenceStatus(session, now = Date.now()) {
  if (session.status !== 'active' || session.logoutAt) return 'offline'

  const age = now - new Date(session.lastSeenAt || session.updatedAt || session.loginAt).getTime()
  if (age <= ONLINE_WINDOW_MS) return 'online'
  if (age <= IDLE_WINDOW_MS) return 'idle'
  return 'offline'
}

function publicSession(session) {
  const user = session.user || {}

  return {
    id: session._id.toString(),
    userId: user._id?.toString?.() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.profile?.department || 'General',
    designation: user.profile?.designation || user.role,
    status: presenceStatus(session),
    sessionStatus: session.status,
    loginAt: session.loginAt,
    lastSeenAt: session.lastSeenAt,
    logoutAt: session.logoutAt,
    currentPath: session.currentPath,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
  }
}

router.post('/heartbeat', requireAuth, asyncHandler(async (req, res) => {
  if (!req.session) {
    return res.json({ ok: true })
  }

  const { path = '' } = req.body || {}

  req.session.lastSeenAt = new Date()
  req.session.currentPath = String(path).slice(0, 240)
  req.session.status = 'active'
  await req.session.save()

  res.json({ ok: true })
}))

router.get('/sessions', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const sessions = await UserSession.find({
    $or: [
      { status: 'active' },
      { lastSeenAt: { $gte: cutoff } },
    ],
  })
    .populate('user', 'name email role profile status')
    .sort({ lastSeenAt: -1 })
    .limit(100)

  const visibleSessions = sessions
    .filter((session) => session.user?.status === 'active')
    .map(publicSession)

  res.json({
    sessions: visibleSessions,
    summary: {
      online: visibleSessions.filter((session) => session.status === 'online').length,
      idle: visibleSessions.filter((session) => session.status === 'idle').length,
      offline: visibleSessions.filter((session) => session.status === 'offline').length,
    },
  })
}))

export default router
