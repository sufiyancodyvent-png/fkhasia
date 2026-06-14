import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { AttendanceLog } from '../models/AttendanceLog.js'
import { AttendanceSettings } from '../models/AttendanceSettings.js'
import { LeaveRequest } from '../models/LeaveRequest.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function monthPrefix() {
  return new Date().toISOString().slice(0, 7)
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

router.get('/admin', requireAuth, asyncHandler(async (req, res) => {
  const [employeeCount, presentTodayUsers, pendingLeave, pendingAttendance] = await Promise.all([
    User.countDocuments({ role: { $in: ['employee', 'manager'] }, status: 'active' }),
    AttendanceLog.distinct('user', { date: todayKey(), clockInAt: { $exists: true } }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    AttendanceLog.countDocuments({ status: 'pending', clockInAt: { $exists: true } }),
  ])
  const presentToday = presentTodayUsers.length

  res.json({
    overview: {
      employeeCount,
      presentToday,
      absentToday: Math.max(employeeCount - presentToday, 0),
      lateEntry: 0,
    },
    approvals: {
      leaveRequests: pendingLeave,
      attendanceApprovals: pendingAttendance,
    },
  })
}))

router.get('/employee', requireAuth, asyncHandler(async (req, res) => {
  const [settings, logs, pendingLeave, activeTodayLog, latestTodayLog] = await Promise.all([
    AttendanceSettings.findOne(),
    AttendanceLog.find({ user: req.user._id, date: new RegExp(`^${monthPrefix()}`), clockInAt: { $exists: true } }).sort(sortLatestSession()),
    LeaveRequest.countDocuments({ user: req.user._id, status: 'pending' }),
    AttendanceLog.findOne(openSessionQuery(req.user._id, todayKey())).sort({ clockInAt: -1, createdAt: -1 }),
    AttendanceLog.findOne({ user: req.user._id, date: todayKey() }).sort({ updatedAt: -1, createdAt: -1 }),
  ])
  const todayLog = activeTodayLog || latestTodayLog
  const goal = settings?.monthlyGoalHours || 160
  const workedHours = logs.reduce((sum, log) => sum + hoursBetween(log.clockInAt, log.clockOutAt, log.totalBreakMinutes), 0)
  const approved = logs.filter((log) => log.status === 'approved').length
  const daysWorked = uniqueDates(logs)

  res.json({
    user: {
      name: req.user.name,
      role: req.user.role,
      workMode: req.user.profile?.workMode || 'office',
    },
    settings: settings || {
      monthlyGoalHours: 160,
      shiftStart: '09:00',
      shiftEnd: '18:00',
    },
    summary: {
      monthlyGoalHours: goal,
      workedHours: Number(workedHours.toFixed(1)),
      progress: goal ? Number(((workedHours / goal) * 100).toFixed(1)) : 0,
      daysWorked,
      approved,
      records: logs.length,
      pendingLeave,
      attendanceRate: logs.length ? Number(((approved / logs.length) * 100).toFixed(1)) : 0,
    },
    todayLog,
    logs,
  })
}))

export default router
