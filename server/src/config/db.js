import mongoose from 'mongoose'
import dns from 'dns'
import { env } from './env.js'

export async function connectDb() {
  mongoose.set('strictQuery', true)

  if (env.mongoUri?.startsWith('mongodb+srv://')) {
    dns.setServers(['1.1.1.1', '8.8.8.8'])
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 15000,
    })
  } catch (error) {
    if (error.code === 'ECONNREFUSED' && /querySrv/i.test(error.message)) {
      throw new Error(
        'MongoDB Atlas DNS lookup failed. Check internet/DNS settings or use a network that allows SRV DNS records.',
        { cause: error },
      )
    }

    throw error
  }
}
