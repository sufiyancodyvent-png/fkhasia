import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken(user, tokenId) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, sid: tokenId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}
