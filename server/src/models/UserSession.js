import mongoose from 'mongoose'

const userSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['active', 'logged_out', 'expired'], default: 'active', index: true },
    loginAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    logoutAt: Date,
    currentPath: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true },
)

userSessionSchema.index({ status: 1, lastSeenAt: -1 })

export const UserSession = mongoose.model('UserSession', userSessionSchema)
