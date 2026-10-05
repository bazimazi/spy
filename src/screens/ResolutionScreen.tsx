import { useEffect, useState } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { playerName, toFa } from '../game/logic'
import { cue } from '../game/feedback'
import type { GameConfig } from '../game/types'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'

interface ResolutionScreenProps {
  config: GameConfig
  timedOut: boolean
  onAccuse: (seats: number[]) => void
  onReveal: () => void
  onHome: () => void
}

/** The group agrees on as many suspects as there are spies, then the app judges the vote. */
export function ResolutionScreen({ config, timedOut, onAccuse, onReveal, onHome }: ResolutionScreenProps) {
  const [accused, setAccused] = useState<number[]>([])
  const needed = config.spyCount
  const ready = accused.length === needed

  useEffect(() => { if (timedOut) cue('alarm') }, [timedOut])

  const toggle = (seat: number) => setAccused((current) => {
    if (current.includes(seat)) return current.filter((s) => s !== seat)
    // With a full ballot, the newest pick replaces the oldest one.
    return [...current, seat].slice(-needed)
  })

  return <GameplayScreen className={`resolution-screen${timedOut ? ' is-timed-out' : ''}`} onHome={onHome}>
    <div className="play-focus">
      <img className="stopwatch" src={timedOut ? watchRedSrc : watchSrc} alt="" aria-hidden />
      <h1 className="title play-heading" tabIndex={-1} data-screen-title>وقت تصمیمه!</h1>
      <p className="play-instruction">{needed === 1
        ? 'رأی بدید: جاسوس کیه؟ حدس جاسوس بعد از رأی می‌آد.'
        : `رأی بدید: ${toFa(needed)} جاسوس رو انتخاب کنید. حدس جاسوس بعد از رأی می‌آد.`}</p>
    </div>
    <div className="suspect-grid" role="group" aria-label="انتخاب مظنون‌ها">
      {Array.from({ length: config.playerCount }, (_, seat) => {
        const selected = accused.includes(seat)
        return <button key={seat} type="button" className={`suspect${selected ? ' is-selected' : ''}`}
          aria-pressed={selected} data-cue="select" onClick={() => toggle(seat)}>
          <span className="suspect__seat" aria-hidden>{toFa(seat + 1)}</span>
          <span className="suspect__name">{playerName(config.names, seat)}</span>
        </button>
      })}
    </div>
    <div className="footer-actions">
      <button type="button" className="btn" disabled={!ready} data-cue="none" onClick={() => onAccuse(accused)}>
        {ready ? 'رأی نهایی' : `رأی نهایی (${toFa(accused.length)} از ${toFa(needed)})`}
      </button>
      <button type="button" className="text-btn" onClick={onReveal}>نمایش کلمه و نقش‌ها</button>
    </div>
  </GameplayScreen>
}
