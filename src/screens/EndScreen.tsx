import { GameplayScreen } from '../components/GameplayScreen'
import { toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import spyHeroSrc from '../assets/logo.svg'

interface EndScreenProps {
  config: GameConfig
  round: RoundState
  onPlayAgain: () => void
  onHome: () => void
  roundNumber: number
}

export function EndScreen({ config, round, roundNumber, onPlayAgain, onHome }: EndScreenProps) {
  const spyNames = round.spyIndices.map((idx) => `بازیکن ${toFa(idx + 1)}`)
  const spyLabel = spyNames.length > 1 ? 'جاسوس‌ها' : 'جاسوس'

  return (
    <GameplayScreen className="end-screen" onHome={onHome} roundComplete>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>پایان دور {toFa(roundNumber)}</h1>
      <div className="play-focus">
        <img src={spyHeroSrc} alt="" className="end-hero" aria-hidden="true" />

        <div className="end-results">
          <p className="end-reveal">
            {spyLabel}:{' '}
            <strong className="end-reveal__value">{spyNames.join('، ')}</strong>
          </p>
          <p className="end-reveal">
            کلمه: <strong className="end-reveal__value">{round.word.word}</strong>
          </p>
        </div>
        <details className="all-roles">
          <summary>نقش همه‌ی بازیکن‌ها</summary>
          <p className="play-meta">موضوع: {round.word.category}</p>
          <ul className="role-list" tabIndex={0} aria-label="نقش همه‌ی بازیکن‌ها">
            {Array.from({ length: config.playerCount }, (_, index) => {
              const isSpy = round.spyIndices.includes(index)
              return <li key={index} className={`role-row ${isSpy ? 'is-spy' : ''}`}>
                <span className="role-row__name">بازیکن {toFa(index + 1)}</span>
                <span className="role-row__tag">{isSpy ? 'جاسوس' : 'شهروند'}</span>
              </li>
            })}
          </ul>
        </details>
      </div>

      <div className="footer-actions">
        <button type="button" className="btn" onClick={onPlayAgain}>
          دوباره بزن بریم!
        </button>
      </div>
    </GameplayScreen>
  )
}
