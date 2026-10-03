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
}

export function EndScreen({ config, round, onPlayAgain, onHome }: EndScreenProps) {
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
        <img src={spyHeroSrc} alt="" className="end-hero" aria-hidden="true" />

        <p className="end-reveal">
          {spyLabel}:{' '}
          <strong className="end-reveal__value">{spyNames.join('، ')}</strong>
        </p>

        <p className="end-reveal">
          کلمه: <strong className="end-reveal__value">{round.word.word}</strong>
        </p>

        {config.spyGuide ? (
          <p className="end-reveal end-reveal--muted">موضوع: {round.word.category}</p>
        ) : null}
      </div>

      <div className="footer-actions">
        <button type="button" className="btn" onClick={onPlayAgain}>
          دوباره بزن بریم!
        </button>
      </div>
    </Screen>
  )
}
