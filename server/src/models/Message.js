import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    readAt: Date,
  },
  { timestamps: true },
)

messageSchema.index({ to: 1, readAt: 1, createdAt: -1 })

export const Message = mongoose.model('Message', messageSchema)
