import { Router } from 'express'
import { SupportTicket } from '../models/SupportTicket.js'
import { User } from '../models/User.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// GET all support tickets (with filters and pagination)
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, category, assignedTo, page = 1, limit = 20, sort = '-createdAt' } = req.query

    const filter = {}
    if (status) filter.status = status
    if (category) filter.category = category
    if (assignedTo) filter.assignedTo = assignedTo

    const skip = (page - 1) * limit
    const total = await SupportTicket.countDocuments(filter)

    const tickets = await SupportTicket.find(filter)
      .populate('assignedTo', 'name email profile')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  })
)

// GET single support ticket by ID
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id).populate('assignedTo', 'name email profile')

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' })
    }

    res.json(ticket)
  })
)

// CREATE a new support ticket
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { subject, category, status } = req.body

    if (!subject || !category) {
      return res.status(400).json({ message: 'Subject and category are required' })
    }

    const ticket = new SupportTicket({
      subject,
      category,
      status: status || 'unassigned',
    })

    await ticket.save()
    await ticket.populate('assignedTo', 'name email profile')

    res.status(201).json(ticket)
  })
)

// UPDATE support ticket
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { subject, status, category, assignedTo, firstContactResolved, satisfactionRating } = req.body

    const ticket = await SupportTicket.findById(req.params.id)

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' })
    }

    // Update allowed fields
    if (subject !== undefined) ticket.subject = subject
    if (status !== undefined) {
      if (!['unassigned', 'open', 'solved', 'escalated'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' })
      }
      ticket.status = status
    }
    if (category !== undefined) {
      ticket.category = category
    }
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null
    if (firstContactResolved !== undefined) ticket.firstContactResolved = firstContactResolved
    if (satisfactionRating !== undefined) {
      if (satisfactionRating < 1 || satisfactionRating > 10) {
        return res.status(400).json({ message: 'Satisfaction rating must be between 1 and 10' })
      }
      ticket.satisfactionRating = satisfactionRating
    }

    await ticket.save()
    await ticket.populate('assignedTo', 'name email profile')

    res.json(ticket)
  })
)

// ASSIGN ticket to an agent
router.patch(
  '/:id/assign',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { assignedTo } = req.body

    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo is required' })
    }

    // Verify user exists
    const user = await User.findById(assignedTo)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'open' },
      { new: true }
    ).populate('assignedTo', 'name email profile')

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' })
    }

    res.json(ticket)
  })
)

// MARK ticket as solved
router.patch(
  '/:id/resolve',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { satisfactionRating, firstContactResolved } = req.body

    const ticket = await SupportTicket.findById(req.params.id)

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' })
    }

    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role)
    const isAssignedAgent = ticket.assignedTo && ticket.assignedTo.toString() === req.user._id.toString()

    if (!isAdminOrManager && !isAssignedAgent) {
      return res.status(403).json({ message: 'You do not have permission to resolve this ticket' })
    }

    ticket.status = 'solved'
    if (satisfactionRating !== undefined) ticket.satisfactionRating = satisfactionRating
    if (firstContactResolved !== undefined) ticket.firstContactResolved = firstContactResolved

    await ticket.save()
    await ticket.populate('assignedTo', 'name email profile')

    res.json(ticket)
  })
)

// DELETE support ticket
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id)

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' })
    }

    res.json({ message: 'Support ticket deleted' })
  })
)

// GET dashboard stats (moved from dashboardRoutes for organization)
// This might already exist, keeping for reference
router.get(
  '/dashboard/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketCounts = await Promise.all([
      SupportTicket.countDocuments({ status: 'unassigned' }),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'solved' }),
      SupportTicket.countDocuments({ status: 'escalated' }),
    ])

    res.json({
      unassigned: ticketCounts[0],
      open: ticketCounts[1],
      solved: ticketCounts[2],
      escalated: ticketCounts[3],
    })
  })
)

export default router
