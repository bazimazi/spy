import { useState } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { guessOptions, playerName } from '../game/logic'
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
  const [options] = useState(() => guessOptions(round.word))
  const [choice, setChoice] = useState<string | null>(null)
  const early = accused.length === 0
  const caughtNames = accused.map((seat) => playerName(config.names, seat)).join('، ')

  return <GameplayScreen className="guess-screen" onHome={onHome}>
    <img className="guess-face" src={spyFaceSrc} alt="" aria-hidden />
    <h1 className="title play-heading" tabIndex={-1} data-screen-title>جاسوس، کلمه چیه؟</h1>
    <p className="play-instruction">{early
      ? 'گفت‌وگو متوقف شد. حدس درست: برد جاسوس‌ها با ۳ امتیاز. حدس غلط: برد شهروندها.'
      : `${caughtNames} گیر افتاد؛ حدس درست هنوز می‌تونه بازی رو ببره.`}</p>
    <div className="guess-grid" role="group" aria-label="گزینه‌های حدس جاسوس">
      {options.map((word) => (
        <button key={word} type="button" className={`guess-option${choice === word ? ' is-selected' : ''}`}
          aria-pressed={choice === word} data-cue="select" onClick={() => setChoice(word)}>{word}</button>
      ))}
    </div>
    <div className="footer-actions">
      <button type="button" className="btn" disabled={!choice} data-cue="none"
        onClick={() => { if (choice) onGuess(choice) }}>ثبت حدس</button>
    </div>
  </GameplayScreen>
}
