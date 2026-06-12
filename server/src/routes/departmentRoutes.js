import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { Department } from '../models/Department.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

router.get('/', requireAuth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 })
  res.json({ departments })
}))

router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, description = '', status = 'active' } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' })
  }

  const department = await Department.create({ name, description, status })
  res.status(201).json({ department })
}))

router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, description, status } = req.body
  const update = {}

  if (name) update.name = name
  if (description !== undefined) update.description = description
  if (status && ['active', 'inactive'].includes(status)) update.status = status

  const department = await Department.findByIdAndUpdate(req.params.id, update, {
    returnDocument: 'after',
    runValidators: true,
  })

  if (!department) {
    return res.status(404).json({ message: 'Department not found' })
  }

  res.json({ department })
}))

router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)

  if (!department) {
    return res.status(404).json({ message: 'Department not found' })
  }

  await department.deleteOne()
  res.json({ ok: true })
}))

export default router
