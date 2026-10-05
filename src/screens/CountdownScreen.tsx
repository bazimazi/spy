import { useEffect } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { toFa } from '../game/logic'
import { cue } from '../game/feedback'
import { useRoundClock } from '../game/useRoundClock'
import watchSrc from '../assets/watch.png'

interface CountdownScreenProps {
  onFinish: () => void
  onHome: () => void
}

/** Counts down from 3 to 1, then calls onFinish. */
export function CountdownScreen({ onFinish, onHome }: CountdownScreenProps) {
  const { remaining: n, pause, resume } = useRoundClock(3)

  useEffect(() => {
    if (n <= 0) {
      cue('go')
      onFinish()
    } else cue('beep')
  }, [n, onFinish])

  return (
    <GameplayScreen className="countdown-screen" onHome={onHome} onRequestHome={pause} onCancelHome={resume}>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>گفت‌وگو شروع می‌شه</h1>
      <div className="play-focus">
        <img src={watchSrc} alt="" className="stopwatch" key={`watch-${n}`} aria-hidden="true" />
        <div className="countdown-stage">
          <span className="countdown-ring" key={`ring-${n}`} aria-hidden />
          <div className="countdown" key={n} aria-live="polite">
            {toFa(Math.max(1, n))}
          </div>
        </div>
        <p className="countdown-text">
          آماده باش!{'\n'}چند ثانیه دیگه بازی شروع میشه
        </p>
      </div>
    </GameplayScreen>
  )
}
