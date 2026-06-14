import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AttendanceLog } from '../models/AttendanceLog.js'
import { AttendanceSettings } from '../models/AttendanceSettings.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function hoursBetween(start, end, breakMinutes = 0) {
  if (!start || !end) return 0
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000) - breakMinutes)
  return Number((minutes / 60).toFixed(2))
}

function sortLatestSession() {
  return { date: -1, clockInAt: -1, createdAt: -1 }
}

function openSessionQuery(user, date) {
  return {
    user,
    date,
    clockInAt: { $exists: true },
    clockOutAt: { $exists: false },
  }
}

function uniqueDates(logs) {
  return new Set(logs.map((log) => log.date)).size
}

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const logs = await AttendanceLog.find({ user: req.user._id, clockInAt: { $exists: true } }).sort(sortLatestSession()).limit(40)
  res.json({ logs })
}))

router.get('/all', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const logs = await AttendanceLog.find({ clockInAt: { $exists: true } }).populate('user', 'name email profile').sort(sortLatestSession()).limit(100)
  res.json({ logs })
}))

router.patch('/today/note', requireAuth, asyncHandler(async (req, res) => {
  const note = typeof req.body.note === 'string' ? req.body.note : ''
  const today = dateKey()
  const activeLog = await AttendanceLog.findOne(openSessionQuery(req.user._id, today)).sort({ clockInAt: -1, createdAt: -1 })
  const latestTodayLog = activeLog || await AttendanceLog.findOne({ user: req.user._id, date: today }).sort({ updatedAt: -1, createdAt: -1 })

  const log = latestTodayLog || new AttendanceLog({ user: req.user._id, date: today, source: 'self' })
  log.note = note
  await log.save()

  res.json({ log })
}))

router.patch('/:id/status', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status } = req.body

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' })
  }

  const log = await AttendanceLog.findByIdAndUpdate(
    req.params.id,
    { status },
    { returnDocument: 'after' },
  ).populate('user', 'name email profile')

  if (!log) {
    return res.status(404).json({ message: 'Attendance log not found' })
  }

  res.json({ log })
}))

router.post('/clock-in', requireAuth, asyncHandler(async (req, res) => {
  const today = dateKey()
  const settings = await AttendanceSettings.findOne()
  const activeLog = await AttendanceLog.findOne(openSessionQuery(req.user._id, today)).sort({ clockInAt: -1, createdAt: -1 })

  if (activeLog) {
    return res.json({ log: activeLog })
  }

  const latestTodayLog = await AttendanceLog.findOne({ user: req.user._id, date: today }).sort({ updatedAt: -1, createdAt: -1 })
  const pendingNoteLog = latestTodayLog && !latestTodayLog.clockInAt ? latestTodayLog : null
  const note = typeof req.body.note === 'string' ? req.body.note : pendingNoteLog?.note || latestTodayLog?.note || ''
  const log = pendingNoteLog || new AttendanceLog({ user: req.user._id, date: today, source: 'self' })

  log.clockInAt = new Date()
  log.clockOutAt = undefined
  log.breakStartedAt = undefined
  log.totalBreakMinutes = 0
  log.status = settings?.autoApproveAttendance ? 'approved' : 'pending'
  log.workMode = req.body.workMode || pendingNoteLog?.workMode || 'In Office (HQ)'
  log.note = note
  await log.save()

  res.json({ log })
}))

router.post('/clock-out', requireAuth, asyncHandler(async (req, res) => {
  const today = dateKey()
  const log = await AttendanceLog.findOne(openSessionQuery(req.user._id, today)).sort({ clockInAt: -1, createdAt: -1 })

  if (!log || !log.clockInAt) {
    return res.status(400).json({ message: 'Clock in before clocking out' })
  }

  if (log.clockOutAt) {
    return res.status(400).json({ message: 'You have already clocked out today' })
  }

  if (log.breakStartedAt) {
    log.totalBreakMinutes += Math.max(0, Math.round((Date.now() - log.breakStartedAt.getTime()) / 60000))
    log.breakStartedAt = undefined
  }

  log.clockOutAt = log.clockOutAt || new Date()
  await log.save()

  res.json({ log })
}))

router.post('/break/start', requireAuth, asyncHandler(async (req, res) => {
  const today = dateKey()
  const log = await AttendanceLog.findOne(openSessionQuery(req.user._id, today)).sort({ clockInAt: -1, createdAt: -1 })

  if (!log?.clockInAt) {
    return res.status(400).json({ message: 'Clock in before starting a break' })
  }

  if (log.clockOutAt) {
    return res.status(400).json({ message: 'Cannot start a break after clock out' })
  }

  if (log.breakStartedAt) {
    return res.status(400).json({ message: 'Break is already running' })
  }

  log.breakStartedAt = new Date()
  await log.save()

  res.json({ log })
}))

router.post('/break/end', requireAuth, asyncHandler(async (req, res) => {
  const today = dateKey()
  const log = await AttendanceLog.findOne(openSessionQuery(req.user._id, today)).sort({ clockInAt: -1, createdAt: -1 })

  if (!log?.clockInAt) {
    return res.status(400).json({ message: 'Clock in before ending a break' })
  }

  if (!log.breakStartedAt) {
    return res.status(400).json({ message: 'No active break to end' })
  }

  log.totalBreakMinutes += Math.max(0, Math.round((Date.now() - log.breakStartedAt.getTime()) / 60000))
  log.breakStartedAt = undefined
  await log.save()

  res.json({ log })
}))

router.get('/summary/me', requireAuth, asyncHandler(async (req, res) => {
  const now = new Date()
  const monthPrefix = now.toISOString().slice(0, 7)
  const logs = await AttendanceLog.find({ user: req.user._id, date: new RegExp(`^${monthPrefix}`), clockInAt: { $exists: true } }).sort(sortLatestSession())
  const workedHours = logs.reduce((sum, log) => sum + hoursBetween(log.clockInAt, log.clockOutAt, log.totalBreakMinutes), 0)
  const approved = logs.filter((log) => log.status === 'approved').length
  const daysWorked = uniqueDates(logs)

  res.json({
    summary: {
      workedHours: Number(workedHours.toFixed(1)),
      daysWorked,
      approved,
      records: logs.length,
    },
    logs,
  })
}))

export default router
