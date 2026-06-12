import { assertEnv, env } from './config/env.js'
import { connectDb } from './config/db.js'
import app from './app.js'

async function start() {
  assertEnv()
  await connectDb()
  app.listen(env.port, () => {
    console.log(`FKHASIA API running on port ${env.port}`)
  })
}

start().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
