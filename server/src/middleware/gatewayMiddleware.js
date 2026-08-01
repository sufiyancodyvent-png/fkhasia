import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function requireGateway(req, res, next) {
  // Allow bypassing gateway in development for testing if specified, but default to true
  if (process.env.BYPASS_GATEWAY === 'true') {
    return next()
  }

  const gatewayToken = req.headers['x-gateway-token']

  if (!gatewayToken) {
    return res.status(403).json({ message: 'Gateway authorization required' })
  }

  try {
    const decoded = jwt.verify(gatewayToken, env.jwtSecret)
    if (decoded.role !== 'gateway') {
      return res.status(403).json({ message: 'Invalid gateway authorization' })
    }
    next()
  } catch {
    return res.status(403).json({ message: 'Gateway token expired or invalid' })
  }
}
