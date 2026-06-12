import mongoose from 'mongoose'

const attendanceSettingsSchema = new mongoose.Schema(
  {
    timezone: { type: String, default: 'Asia/Karachi' },
    allowManualEntry: { type: Boolean, default: true },
    autoApproveAttendance: { type: Boolean, default: false },
    monthlyGoalHours: { type: Number, default: 160, min: 1, max: 744 },
    shiftStart: { type: String, default: '09:00' },
    shiftEnd: { type: String, default: '18:00' },
    lateGraceMinutes: { type: Number, default: 10, min: 0, max: 240 },
    earlyLeaveGraceMinutes: { type: Number, default: 10, min: 0, max: 240 },
    breakMinutesAllowed: { type: Number, default: 60, min: 0, max: 240 },
    workModes: {
      type: [String],
      default: ['In Office (HQ)', 'Remote', 'Hybrid'],
    },
  },
  { timestamps: true },
)

export const AttendanceSettings = mongoose.model('AttendanceSettings', attendanceSettingsSchema)
