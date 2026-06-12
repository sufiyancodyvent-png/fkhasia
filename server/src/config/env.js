import dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || 'server/.env' })

const required = ['MONGODB_URI', 'JWT_SECRET']

export function assertEnv() {
  const missing = required.filter((key) => !process.env[key])

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@fkhasia.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
  seedEmployeeEmail: process.env.SEED_EMPLOYEE_EMAIL || 'employee@fkhasia.com',
  seedEmployeePassword: process.env.SEED_EMPLOYEE_PASSWORD,
  timezone: process.env.TZ || 'Asia/Karachi',
}
