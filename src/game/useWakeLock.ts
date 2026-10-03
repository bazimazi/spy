import { useEffect } from 'react'

/** Optional enhancement. Unsupported/denied wake locks never block a round. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let cancelled = false
    let lock: WakeLockSentinel | null = null
    let requesting = false

    const request = async () => {
      if (cancelled || document.hidden || requesting || (lock && !lock.released)) return
      requesting = true
      try {
        const acquired = await navigator.wakeLock.request('screen')
        if (cancelled) await acquired.release()
        else lock = acquired
      } catch {
        // Can be rejected in power-saving mode or insecure contexts.
      } finally {
        requesting = false
      }
    }
    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release().catch(() => {})
    }
  }, [enabled])
}
