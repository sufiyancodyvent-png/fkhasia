import app from '../server/src/app.js'
import { assertEnv } from '../server/src/config/env.js'

async function ensureReady() {
  assertEnv()
}

function restoreApiPath(req) {
  const url = new URL(req.url, 'http://vercel.local')
  const routedPath = url.searchParams.get('path')

  if (!routedPath) return

  url.searchParams.delete('path')
  const query = url.searchParams.toString()
  req.url = `/api/${routedPath}${query ? `?${query}` : ''}`
}

export default async function handler(req, res) {
  try {
    await ensureReady()
    restoreApiPath(req)
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
