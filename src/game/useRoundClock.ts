import { useCallback, useEffect, useRef, useState } from 'react'

/** Deadlines, rather than callback counts, keep time correct after tab throttling. */
export function useRoundClock(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [allocatedSeconds, setAllocatedSeconds] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(true)
  const deadline = useRef(Date.now() + totalSeconds * 1000)
  const pausedMs = useRef(totalSeconds * 1000)
  const running = useRef(true)

  const update = useCallback(() => {
    const ms = running.current ? Math.max(0, deadline.current - Date.now()) : pausedMs.current
    setRemaining(Math.ceil(ms / 1000))
  }, [])

  useEffect(() => {
    if (!isRunning) return
    update()
    const interval = window.setInterval(update, 250)
    const onVisible = () => { if (!document.hidden) update() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isRunning, update])

  const pause = useCallback(() => {
    if (!running.current) return
    pausedMs.current = Math.max(0, deadline.current - Date.now())
    running.current = false
    setIsRunning(false)
    update()
  }, [update])

  const resume = useCallback(() => {
    if (running.current || pausedMs.current <= 0) return
    deadline.current = Date.now() + pausedMs.current
    running.current = true
    setIsRunning(true)
    update()
  }, [update])

  const addMinute = useCallback(() => {
    setAllocatedSeconds((seconds) => seconds + 60)
    if (running.current) deadline.current += 60_000
    else pausedMs.current += 60_000
    update()
  }, [update])

  return { remaining, allocatedSeconds, isRunning, pause, resume, addMinute }
}
