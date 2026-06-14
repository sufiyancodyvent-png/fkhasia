import mongoose from 'mongoose'

const attendanceLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    clockInAt: Date,
    clockOutAt: Date,
    breakStartedAt: Date,
    totalBreakMinutes: { type: Number, default: 0 },
    workMode: { type: String, default: 'In Office (HQ)' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    source: { type: String, enum: ['self', 'admin', 'system'], default: 'self' },
  },
  { timestamps: true },
)

attendanceLogSchema.index({ user: 1, date: 1, clockInAt: -1 })

export const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema)
