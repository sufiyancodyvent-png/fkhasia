import dotenv from 'dotenv'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: process.env.ENV_FILE || 'server/.env' })
}

const required = ['MONGODB_URI', 'JWT_SECRET']

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function vercelOrigin(value) {
  return value ? `https://${value}` : null
}

const configuredClientOrigins = splitCsv(process.env.CLIENT_ORIGIN)
const deploymentOrigins = [
  vercelOrigin(process.env.VERCEL_URL),
  vercelOrigin(process.env.VERCEL_BRANCH_URL),
  vercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
].filter(Boolean)

export function assertEnv() {
  const missing = required.filter((key) => !process.env[key])

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigins: configuredClientOrigins.length
    ? [...new Set([...configuredClientOrigins, ...deploymentOrigins])]
    : ['http://localhost:5173', ...deploymentOrigins],
  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB_NAME || 'fkhasia',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@fkhasia.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
  seedEmployeeEmail: process.env.SEED_EMPLOYEE_EMAIL || 'employee@fkhasia.com',
  seedEmployeePassword: process.env.SEED_EMPLOYEE_PASSWORD,
  timezone: process.env.TZ || 'Asia/Karachi',
}
