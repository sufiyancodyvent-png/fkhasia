import app from '../server/src/app.js'
import { assertEnv } from '../server/src/config/env.js'
import { connectDb } from '../server/src/config/db.js'

let ready

async function ensureReady() {
  assertEnv()
  ready ||= connectDb()
  await ready
}

export default async function handler(req, res) {
  try {
    await ensureReady()
    return app(req, res)
  } catch (error) {
    console.error('[api:init]', error)

    if (!res.headersSent) {
      res.status(500).json({
        message: 'API initialization failed',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
      })
    }
  }
}
