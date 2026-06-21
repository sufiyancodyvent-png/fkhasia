import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSession, sendPresenceHeartbeat } from '../lib/api'

const HEARTBEAT_MS = 25000

function usePresenceHeartbeat() {
  const location = useLocation()

  useEffect(() => {
    const session = getSession()

    if (!session?.token) return undefined

    let cancelled = false
    const path = `${location.pathname}${location.search}`

    const pulse = () => {
      if (cancelled || document.visibilityState === 'hidden') return
      sendPresenceHeartbeat(path).catch(() => {})
    }

    pulse()
    const timer = window.setInterval(pulse, HEARTBEAT_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') pulse()
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [location.pathname, location.search])
}

export default usePresenceHeartbeat
