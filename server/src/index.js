import { assertEnv, env } from './config/env.js'
import { connectDb } from './config/db.js'
import app from './app.js'

async function start() {
  assertEnv()
  app.listen(env.port, () => {
    console.log(`FKHASIA API running on port ${env.port}`)
  })

  connectDb()
    .then(() => {
      console.log('MongoDB connected')
    })
    .catch((error) => {
      console.error(error.message)
      console.error('API is still running. Fix MongoDB access and retry the request.')
    })
}

start().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
