import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

function publicMessage(message) {
  return {
    id: message._id.toString(),
    body: message.body,
    readAt: message.readAt,
    createdAt: message.createdAt,
    from: message.from ? {
      id: message.from._id?.toString?.() || message.from.id,
      name: message.from.name,
      email: message.from.email,
      role: message.from.role,
    } : null,
    to: message.to ? {
      id: message.to._id?.toString?.() || message.to.id,
      name: message.to.name,
      email: message.to.email,
      role: message.to.role,
    } : null,
  }
}

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const messages = await Message.find({ to: req.user._id })
    .populate('from', 'name email role')
    .populate('to', 'name email role')
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({
    messages: messages.map(publicMessage),
    unreadCount: messages.filter((message) => !message.readAt).length,
  })
}))

router.post('/', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { to, body } = req.body
  const cleanBody = String(body || '').trim()

  if (!to || !cleanBody) {
    return res.status(400).json({ message: 'Recipient and message are required' })
  }

  const target = await User.findById(to)

  if (!target || target.status !== 'active') {
    return res.status(404).json({ message: 'Active recipient not found' })
  }

  const message = await Message.create({
    from: req.user._id,
    to: target._id,
    body: cleanBody,
  })

  await message.populate('from', 'name email role')
  await message.populate('to', 'name email role')

  res.status(201).json({ message: publicMessage(message) })
}))

router.patch('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.id, to: req.user._id })

  if (!message) {
    return res.status(404).json({ message: 'Message not found' })
  }

  if (!message.readAt) {
    message.readAt = new Date()
    await message.save()
  }

  res.json({ ok: true })
}))

export default router
