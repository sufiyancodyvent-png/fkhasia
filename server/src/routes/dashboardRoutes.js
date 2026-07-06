import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { AttendanceLog } from '../models/AttendanceLog.js'
import { SupportTicket } from '../models/SupportTicket.js'
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

router.get('/support-team', requireAuth, asyncHandler(async (req, res) => {
  // Run all aggregations in parallel
  const [
    statusCounts,
    fcrOverall,
    fcrByCategory,
    npsData,
    agentLeaderboard,
  ] = await Promise.all([

    // 1. Ticket counts by status
    SupportTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // 2. Overall FCR rate (among solved tickets)
    SupportTicket.aggregate([
      { $match: { status: 'solved' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          fcr: { $sum: { $cond: ['$firstContactResolved', 1, 0] } },
        },
      },
    ]),

    // 3. FCR rate broken down by category
    SupportTicket.aggregate([
      { $match: { status: 'solved' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          fcr: { $sum: { $cond: ['$firstContactResolved', 1, 0] } },
        },
      },
    ]),

    // 4. NPS from satisfaction ratings on solved tickets
    SupportTicket.aggregate([
      { $match: { status: 'solved', satisfactionRating: { $exists: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          promoters: {
            $sum: { $cond: [{ $gte: ['$satisfactionRating', 9] }, 1, 0] },
          },
          passives: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$satisfactionRating', 7] }, { $lte: ['$satisfactionRating', 8] }] },
                1,
                0,
              ],
            },
          },
          detractors: {
            $sum: { $cond: [{ $lte: ['$satisfactionRating', 6] }, 1, 0] },
          },
        },
      },
    ]),

    // 5. Top agents leaderboard: solved count, open count, avg satisfaction
    SupportTicket.aggregate([
      { $match: { assignedTo: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTo',
          solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          ratingSum: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, '$satisfactionRating', 0] } },
          ratingCount: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'solved'] }, { $gt: ['$satisfactionRating', 0] }] }, 1, 0] } },
        },
      },
      { $match: { solved: { $gt: 0 } } },
      { $sort: { solved: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.status': 'active' } },
      {
        $project: {
          name: '$user.name',
          department: '$user.profile.department',
          designation: '$user.profile.designation',
          solved: 1,
          open: 1,
          satisfaction: {
            $cond: [
              { $gt: ['$ratingCount', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$ratingSum', { $multiply: ['$ratingCount', 10] }] }, 100] },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ]),
  ])

  // -- Process ticket counts --
  const countMap = {}
  statusCounts.forEach((s) => { countMap[s._id] = s.count })

  // -- Process FCR --
  const fcrRow = fcrOverall[0] || { total: 0, fcr: 0 }
  const fcrRate = fcrRow.total > 0
    ? Math.round((fcrRow.fcr / fcrRow.total) * 100)
    : 0

  const categoryOrder = ['Sales enquiry', 'Feature request', 'Setup Request', 'Bug']
  const catMap = {}
  fcrByCategory.forEach((c) => { catMap[c._id] = c })
  const categories = categoryOrder.map((name) => {
    const row = catMap[name] || { total: 0, fcr: 0 }
    return {
      name,
      rate: row.total > 0 ? Math.round((row.fcr / row.total) * 100) : 0,
    }
  })

  // -- Process NPS --
  const npsRow = npsData[0] || { total: 0, promoters: 0, passives: 0, detractors: 0 }
  const promotersPct = npsRow.total > 0
    ? Math.round((npsRow.promoters / npsRow.total) * 100) : 0
  const passivesPct = npsRow.total > 0
    ? Math.round((npsRow.passives / npsRow.total) * 100) : 0
  const detractorsPct = npsRow.total > 0
    ? Math.round((npsRow.detractors / npsRow.total) * 100) : 0
  const npsScore = promotersPct - detractorsPct

  // -- Occupancy rate: ratio of assigned open/solved vs total active agent capacity --
  const assignedTickets = (countMap.open || 0) + (countMap.solved || 0)
  const totalActiveAgents = agentLeaderboard.length || 1
  const avgTicketsPerAgent = Math.round(assignedTickets / totalActiveAgents)
  // Occupancy expressed as % of a capacity benchmark (800 tickets/agent/period)
  const CAPACITY_BENCHMARK = 800
  const occupancyRate = Math.min(Math.round((avgTicketsPerAgent / CAPACITY_BENCHMARK) * 100), 99)

  res.json({
    period: 'Last 30 Days',
    ticketCounts: {
      unassigned: countMap.unassigned || 0,
      open: countMap.open || 0,
      solved: countMap.solved || 0,
      escalated: countMap.escalated || 0,
    },
    occupancyRate: {
      rate: occupancyRate,
      minTarget: 75,
      maxTarget: 85,
    },
    nps: {
      score: npsScore,
      promoters: promotersPct,
      passives: passivesPct,
      detractors: detractorsPct,
    },
    fcr: {
      rate: fcrRate,
      categories,
    },
    topAgents: agentLeaderboard.map((a) => ({
      name: a.name,
      department: a.department,
      designation: a.designation,
      open: a.open,
      solved: a.solved,
      satisfaction: a.satisfaction,
    })),
  })
}))

export default router

