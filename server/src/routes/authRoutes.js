import express from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signToken } from '../utils/tokens.js'
import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'

const router = express.Router()

function publicUser(user) {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profile: user.profile,
  }
}

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash')

  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: 'Account is inactive' })
  }

  user.lastLoginAt = new Date()
  await user.save()

  res.json({
    token: signToken(user),
    user: publicUser(user),
  })
}))

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, profile = {} } = req.body
  const user = await User.findById(req.user._id)

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (name) user.name = name
  user.profile = { ...user.profile?.toObject?.(), ...profile }

  await user.save()
  res.json({ user: publicUser(user) })
}))

router.patch('/password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' })
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  const user = await User.findById(req.user._id).select('+passwordHash')

  if (!user || !(await user.verifyPassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }

  user.passwordHash = await User.hashPassword(newPassword)
  await user.save()

  res.json({ ok: true })
}))

export default router
