import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { AttendanceSettings } from '../models/AttendanceSettings.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

async function getSettings() {
  let settings = await AttendanceSettings.findOne()

  if (!settings) {
    settings = await AttendanceSettings.create({})
  }

  return settings
}

router.get('/attendance', requireAuth, asyncHandler(async (req, res) => {
  const settings = await getSettings()
  res.json({ settings })
}))

router.put('/attendance', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const allowed = [
    'timezone',
    'allowManualEntry',
    'autoApproveAttendance',
    'monthlyGoalHours',
    'shiftStart',
    'shiftEnd',
    'lateGraceMinutes',
    'earlyLeaveGraceMinutes',
    'breakMinutesAllowed',
    'workModes',
  ]
  const update = {}

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      update[key] = req.body[key]
    }
  }

  const settings = await AttendanceSettings.findOneAndUpdate({}, update, {
    returnDocument: 'after',
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  })

  res.json({ settings })
}))

export default router
