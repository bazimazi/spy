import { useEffect } from 'react'
import { Screen } from '../components/Screen'
import { toFa } from '../game/logic'
import { useRoundClock } from '../game/useRoundClock'
import watchSrc from '../assets/watch.png'

interface CountdownScreenProps {
  onFinish: () => void
}

/** Counts down from 3 to 1, then calls onFinish. */
export function CountdownScreen({ onFinish }: CountdownScreenProps) {
  const { remaining: n } = useRoundClock(3)

  useEffect(() => {
    if (n <= 0) onFinish()
  }, [n, onFinish])

  return (
    <Screen>
      <div className="center-block">
        <h1 className="title" tabIndex={-1} data-screen-title>گفت‌وگو شروع می‌شه</h1>
        <img src={watchSrc} alt="" className="stopwatch" aria-hidden="true" />
        <div className="countdown" key={n} aria-live="polite">
          {toFa(Math.max(1, n))}
        </div>
        <p className="countdown-text">
          آماده باش!{'\n'}چند ثانیه دیگه بازی شروع میشه
        </p>
      </div>
    </Screen>
  )
}
