import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()
const VALID_ROLES = ['admin', 'manager', 'employee']
const VALID_STATUSES = ['active', 'inactive']

function publicUser(user) {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

router.get('/', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 }).select('-passwordHash')
  res.json({ users })
}))

router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role = 'employee', status = 'active', profile = {} } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Role must be admin, manager, or employee' })
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive' })
  }

  const exists = await User.exists({ email: String(email).toLowerCase().trim() })

  if (exists) {
    return res.status(409).json({ message: 'A user with this email already exists' })
  }

  const user = await User.create({
    name,
    email,
    role,
    status,
    profile,
    passwordHash: await User.hashPassword(password),
  })

  res.status(201).json({ user: publicUser(user) })
}))

router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role, status, profile = {} } = req.body
  const target = await User.findById(req.params.id).select('+passwordHash')

  if (!target) {
    return res.status(404).json({ message: 'User not found' })
  }

  const editingSelf = target._id.toString() === req.user._id.toString()

  if (email && email.toLowerCase().trim() !== target.email) {
    const exists = await User.exists({ email: email.toLowerCase().trim(), _id: { $ne: target._id } })
    if (exists) {
      return res.status(409).json({ message: 'A user with this email already exists' })
    }
    target.email = email
  }

  if (name) target.name = name
  if (role) {
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role must be admin, manager, or employee' })
    }

    if (editingSelf && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove admin access from your own account' })
    }

    target.role = role
  }
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be active or inactive' })
    }

    if (editingSelf && status === 'inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own account' })
    }

    target.status = status
  }
  target.profile = { ...target.profile?.toObject?.(), ...profile }
  if (password) target.passwordHash = await User.hashPassword(password)

  await target.save()
  res.json({ user: publicUser(target) })
}))

router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id)

  if (!target) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (target._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account' })
  }

  if (target.role === 'admin') {
    return res.status(403).json({ message: 'Admin account cannot be deleted' })
  }

  await target.deleteOne()
  res.json({ ok: true })
}))

export default router
