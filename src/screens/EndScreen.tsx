import { Screen } from '../components/Screen'
import { HomeIcon } from '../components/Icons'
import { toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import spyHeroSrc from '../assets/logo.png'

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
    <Screen
      topActions={
        <button type="button" className="icon-btn" aria-label="خانه" onClick={onHome}>
          <HomeIcon />
        </button>
      }
    >
      <div className="center-block">
        <p className="eyebrow">راز این دور باز شد</p>
        <h1 className="title" tabIndex={-1} data-screen-title>پایان دور {toFa(roundNumber)}</h1>
        <img src={spyHeroSrc} alt="" className="end-hero" aria-hidden="true" />

        <p className="end-reveal">
          {spyLabel}:{' '}
          <strong className="end-reveal__value">{spyNames.join('، ')}</strong>
        </p>

        <p className="end-reveal">
          کلمه: <strong className="end-reveal__value">{round.word.word}</strong>
        </p>

        <p className="end-reveal end-reveal--muted">موضوع: {round.word.category}</p>
        <details className="all-roles">
          <summary>نقش همه‌ی بازیکن‌ها</summary>
          <ul className="role-list">
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
        <p className="privacy-note">همون جمع، همون تنظیمات؛ با یک کلمه‌ی تازه.</p>
        <button type="button" className="btn" onClick={onPlayAgain}>
          دوباره بزن بریم!
        </button>
      </div>
    </Screen>
  )
}
