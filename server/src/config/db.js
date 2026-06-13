import mongoose from 'mongoose'
import dns from 'dns'
import { env } from './env.js'

const cached = globalThis.__fkhasiaMongoose || { connection: null, promise: null }
globalThis.__fkhasiaMongoose = cached

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
