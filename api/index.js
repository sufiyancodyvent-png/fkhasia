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
  await ensureReady()
  return app(req, res)
}
