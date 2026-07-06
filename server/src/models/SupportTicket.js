import mongoose from 'mongoose'

const supportTicketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ['unassigned', 'open', 'solved', 'escalated'],
      default: 'unassigned',
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    firstContactResolved: { type: Boolean, default: false },
    satisfactionRating: { type: Number, min: 1, max: 10, index: true },
  },
  { timestamps: true },
)

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)
