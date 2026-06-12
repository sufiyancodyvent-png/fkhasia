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

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const logs = await AttendanceLog.find({ user: req.user._id }).sort({ date: -1 }).limit(40)
  res.json({ logs })
}))

router.get('/all', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const logs = await AttendanceLog.find().populate('user', 'name email profile').sort({ date: -1 }).limit(100)
  res.json({ logs })
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
  const existingLog = await AttendanceLog.findOne({ user: req.user._id, date: today })

  if (existingLog?.clockOutAt) {
    return res.status(400).json({ message: 'You have already clocked out today' })
  }

  const log = await AttendanceLog.findOneAndUpdate(
    { user: req.user._id, date: today },
    {
      $setOnInsert: {
        user: req.user._id,
        date: today,
        clockInAt: new Date(),
        status: settings?.autoApproveAttendance ? 'approved' : 'pending',
        workMode: req.body.workMode || 'In Office (HQ)',
        note: req.body.note || '',
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )

  res.json({ log })
}))

router.post('/clock-out', requireAuth, asyncHandler(async (req, res) => {
  const today = dateKey()
  const log = await AttendanceLog.findOne({ user: req.user._id, date: today })

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
  const log = await AttendanceLog.findOne({ user: req.user._id, date: today })

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
  const log = await AttendanceLog.findOne({ user: req.user._id, date: today })

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
  const logs = await AttendanceLog.find({ user: req.user._id, date: new RegExp(`^${monthPrefix}`) }).sort({ date: -1 })
  const workedHours = logs.reduce((sum, log) => sum + hoursBetween(log.clockInAt, log.clockOutAt, log.totalBreakMinutes), 0)
  const approved = logs.filter((log) => log.status === 'approved').length

  res.json({
    summary: {
      workedHours: Number(workedHours.toFixed(1)),
      daysWorked: logs.length,
      approved,
      records: logs.length,
    },
    logs,
  })
}))

export default router
