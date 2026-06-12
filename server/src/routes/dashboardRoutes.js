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

router.get('/admin', requireAuth, asyncHandler(async (req, res) => {
  const [employeeCount, presentToday, pendingLeave, pendingAttendance] = await Promise.all([
    User.countDocuments({ role: { $in: ['employee', 'manager'] }, status: 'active' }),
    AttendanceLog.countDocuments({ date: todayKey(), clockInAt: { $exists: true } }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    AttendanceLog.countDocuments({ status: 'pending' }),
  ])

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
  const [settings, logs, pendingLeave, todayLog] = await Promise.all([
    AttendanceSettings.findOne(),
    AttendanceLog.find({ user: req.user._id, date: new RegExp(`^${monthPrefix()}`) }).sort({ date: -1 }),
    LeaveRequest.countDocuments({ user: req.user._id, status: 'pending' }),
    AttendanceLog.findOne({ user: req.user._id, date: todayKey() }),
  ])
  const goal = settings?.monthlyGoalHours || 160
  const workedHours = logs.reduce((sum, log) => sum + hoursBetween(log.clockInAt, log.clockOutAt, log.totalBreakMinutes), 0)
  const approved = logs.filter((log) => log.status === 'approved').length

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
      daysWorked: logs.length,
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
