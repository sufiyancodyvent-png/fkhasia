import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { UserSession } from '../models/UserSession.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.sub).select('-passwordHash')

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid session' })
    }

    req.user = user

    if (payload.sid) {
      const session = await UserSession.findOne({ tokenId: payload.sid, user: user._id })

      if (!session || session.status !== 'active') {
        return res.status(401).json({ message: 'Invalid session' })
      }

      req.session = session
    }

    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action' })
    }

    next()
  }
}
