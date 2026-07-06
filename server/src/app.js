import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import presenceRoutes from './routes/presenceRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import supportRoutes from './routes/supportRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'fkhasia-api' })
})

app.use('/api', async (req, res, next) => {
  try {
    await connectDb()
    next()
  } catch (error) {
    const dbError = new Error(
      'Database connection failed. Make sure your current IP address is added to the MongoDB Atlas network access whitelist.',
    )
    dbError.statusCode = 503
    dbError.cause = error
    next(dbError)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/presence', presenceRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/users', userRoutes)

const distDir = path.join(rootDir, 'dist')
app.use(express.static(distDir))
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next()
  })
})

app.use(notFound)
app.use(errorHandler)

export default app
