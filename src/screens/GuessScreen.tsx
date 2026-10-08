import { useRef, useState } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { guessOptions, normalizeGuess, playerName } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import spyFaceSrc from '../assets/logo.svg'

interface GuessScreenProps {
  config: GameConfig
  round: RoundState
  /** Caught spies get a last chance; an empty list means a spy stopped the discussion. */
  accused: number[]
  onGuess: (word: string) => void
  onHome: () => void
}

export function GuessScreen({ config, round, accused, onGuess, onHome }: GuessScreenProps) {
  const challenge = config.guessMode === 'challenge'
  const [options] = useState(() => challenge ? [] : guessOptions(round.word))
  const [choice, setChoice] = useState('')
  const [confirming, setConfirming] = useState(false)
  const submitted = useRef(false)
  const valid = normalizeGuess(choice).length > 0
  const early = accused.length === 0
  const caughtNames = accused.map((seat) => playerName(config.names, seat)).join('، ')

  return <GameplayScreen className="guess-screen" onHome={onHome}>
    <img className="guess-face" src={spyFaceSrc} alt="" aria-hidden />
    <h1 className="title play-heading" tabIndex={-1} data-screen-title>جاسوس، کلمه چیه؟</h1>
    <p className="play-instruction">{early
      ? 'گفت‌وگو متوقف شد. حدس درست: برد جاسوس‌ها با ۳ امتیاز. حدس غلط: برد شهروندها.'
      : `${caughtNames} گیر افتاد؛ حدس درست هنوز می‌تونه بازی رو ببره.`}</p>
    {challenge ? <form id="spy-guess" className="guess-entry" onSubmit={(event) => {
      event.preventDefault()
      if (valid) setConfirming(true)
    }}>
      <span className="guess-entry__badge">چالش حرفه‌ای · یک حدس</span>
      <label htmlFor="guess-word">حدس جاسوس</label>
      <input id="guess-word" value={choice} onChange={(event) => setChoice(event.target.value)}
        maxLength={80} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        enterKeyHint="done" aria-describedby="guess-entry-help" placeholder="کلمه رو اینجا بنویس…" />
      <p id="guess-entry-help" className="play-note">اسم دقیق کلمه رو بنویسید؛ فاصله، نیم‌فاصله و شکل فارسی یا عربی «ی» و «ک» مهم نیست. مترادف یا بخشی از کلمه قبول نیست.</p>
    </form> : <div className="guess-grid" role="group" aria-label="گزینه‌های حدس جاسوس">
      {options.map((word) => (
        <button key={word} type="button" className={`guess-option${choice === word ? ' is-selected' : ''}`}
          aria-pressed={choice === word} data-cue="select" onClick={() => setChoice(word)}>{word}</button>
      ))}
    </div>}
    <div className="footer-actions">
      <button type="button" className="btn" disabled={!valid}
        onClick={() => { if (valid) setConfirming(true) }}>ثبت حدس</button>
    </div>
    {confirming && <ConfirmDialog title="این حدس نهاییته؟" description={`حدس شما: «${choice.trim()}». فقط یک شانس دارید؛ بعد از ثبت، نتیجه و کلمه نمایش داده می‌شه.`}
      confirmLabel="ثبت حدس نهایی" cancelLabel="تغییر حدس" onCancel={() => setConfirming(false)}
      onConfirm={() => {
        if (submitted.current || !valid) return
        submitted.current = true
        onGuess(choice.trim())
      }} />}
  </GameplayScreen>
}
