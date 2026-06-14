import mongoose from 'mongoose'
import dns from 'dns'
import { env } from './env.js'
import { AttendanceLog } from '../models/AttendanceLog.js'

const cached = globalThis.__fkhasiaMongoose || { connection: null, indexesReady: false, promise: null }
globalThis.__fkhasiaMongoose = cached

async function ensureAttendanceIndexes() {
  let indexes = []

  try {
    indexes = await AttendanceLog.collection.indexes()
  } catch (error) {
    if (error.codeName !== 'NamespaceNotFound') {
      throw error
    }
  }

  const legacyUniqueDateIndex = indexes.find((index) => (
    index.unique
    && index.key?.user === 1
    && index.key?.date === 1
    && Object.keys(index.key).length === 2
  ))

  if (legacyUniqueDateIndex) {
    await AttendanceLog.collection.dropIndex(legacyUniqueDateIndex.name)
  }

  await AttendanceLog.collection.createIndex(
    { user: 1, date: 1, clockInAt: -1 },
    { name: 'user_1_date_1_clockInAt_-1' },
  )
}

export async function connectDb() {
  mongoose.set('strictQuery', true)

  if (cached.connection) {
    return cached.connection
  }

  if (env.mongoUri?.startsWith('mongodb+srv://')) {
    dns.setServers(['1.1.1.1', '8.8.8.8'])
  }

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(env.mongoUri, {
        dbName: env.mongoDbName,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
      })
    }

    await cached.promise
    cached.connection = mongoose.connection

    if (!cached.indexesReady) {
      await ensureAttendanceIndexes()
      cached.indexesReady = true
    }

    return cached.connection
  } catch (error) {
    cached.promise = null

    if (error.code === 'ECONNREFUSED' && /querySrv/i.test(error.message)) {
      throw new Error(
        'MongoDB Atlas DNS lookup failed. Check internet/DNS settings or use a network that allows SRV DNS records.',
        { cause: error },
      )
    }

    throw error
  }
}
