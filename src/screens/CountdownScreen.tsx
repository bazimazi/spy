import { useEffect, useState } from 'react'
import { Screen } from '../components/Screen'
import { toFa } from '../game/logic'
import watchSrc from '../assets/watch.png'

interface CountdownScreenProps {
  onFinish: () => void
}

/** Counts down from 3 to 1, then calls onFinish. */
export function CountdownScreen({ onFinish }: CountdownScreenProps) {
  const [n, setN] = useState(3)

  useEffect(() => {
    if (n <= 0) {
      onFinish()
      return
    }
    const id = window.setTimeout(() => setN((v) => v - 1), 1000)
    return () => window.clearTimeout(id)
  }, [n, onFinish])

  return (
    <Screen>
      <div className="center-block">
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
