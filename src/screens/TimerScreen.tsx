import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { formatTime } from '../game/logic'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'

interface TimerScreenProps {
  totalSeconds: number
  onFinish: () => void
}

/** Counts down the round timer. Pauses if the user navigates away in the future. */
export function TimerScreen({ totalSeconds, onFinish }: TimerScreenProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const startedAt = useRef<number>(performance.now())

  useEffect(() => {
    const tick = () => {
      const elapsed = (performance.now() - startedAt.current) / 1000
      const next = Math.max(0, totalSeconds - elapsed)
      setRemaining(next)
      if (next <= 0) {
        onFinish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    let raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [totalSeconds, onFinish])

  const isWarning = remaining <= 10

  return (
    <Screen>
      <div className="center-block">
        <img
          src={isWarning ? watchRedSrc : watchSrc}
          alt=""
          className={`stopwatch ${isWarning ? 'is-warn' : ''}`}
          aria-hidden="true"
        />
        <div
          className={`timer-display ${isWarning ? 'is-warn' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatTime(remaining)}
        </div>
        <p className="timer-hint">
          وقتی زمان به پایان برسه بازی تموم میشه. پس سعی کنید جاسوس رو پیدا کنید
        </p>
      </div>

      <div className="footer-actions">
        <button type="button" className="btn" onClick={onFinish}>
          بازی تمومه!
        </button>
      </div>
    </Screen>
  )
}
