import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnimationEvent } from 'react'
import { Screen } from '../components/Screen'
import { Card } from '../components/Card'
import { toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import spyCardSrc from '../assets/spy-card.svg'
import spyFaceSrc from '../assets/logo.png'

interface RevealScreenProps {
  config: GameConfig
  round: RoundState
  /** Zero-based index of the current player. */
  playerIndex: number
  onNext: () => void
}

/** Upper bound for the deal-out animation; the fallback timer uses it so the
 *  flow can never stall if `animationend` is missed (e.g. tab backgrounded). */
const DEAL_OUT_MS = 560

/**
 * One player at a time: tap the deck to flip → see your role → tap again to
 * pass the phone. Passing deals the current card up and off the top of the
 * deck before the next player's card rises into place. Layouts mirror the
 * Figma frames `card-back`, `card-front-citisen`, and `card-front-spy`.
 */
export function RevealScreen({ config, round, playerIndex, onNext }: RevealScreenProps) {
  const [revealed, setRevealed] = useState(false)
  const [dealing, setDealing] = useState(false)
  const advanced = useRef(false)
  const isSpy = round.spyIndices.includes(playerIndex)

  // Advance exactly once per pass, whichever fires first: the card's
  // `animationend` or the fallback timer.
  const advance = useCallback(() => {
    if (advanced.current) return
    advanced.current = true
    setDealing(false)
    setRevealed(false)
    onNext()
  }, [onNext])

  // Fallback: guarantee the pass completes even if `animationend` never lands.
  useEffect(() => {
    if (!dealing) return
    const timer = window.setTimeout(advance, DEAL_OUT_MS + 120)
    return () => window.clearTimeout(timer)
  }, [dealing, advance])

  const handleReveal = () => {
    if (dealing) return
    setRevealed(true)
  }

  const handlePass = () => {
    if (dealing) return
    advanced.current = false
    setDealing(true)
  }

  const handleDealOutEnd = (event: AnimationEvent<HTMLElement>) => {
    // Ignore bubbled child animations and any non-dealing state.
    if (event.target !== event.currentTarget) return
    if (!dealing) return
    advance()
  }

  if (!revealed) {
    return (
      <Screen>
        <div className="center-block">
          <Card key={`back-${playerIndex}`} variant="back" onClick={handleReveal}>
            <img className="card-bg-art" src={spyCardSrc} alt="" aria-hidden />
            <div className="card-text">
              <h2 className="card-title card-title--muted">بازیکن {toFa(playerIndex + 1)}</h2>
              <p className="card-sub card-sub--muted">برای دیدن کلمه روی کارت بزن</p>
            </div>
          </Card>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="center-block">
        <Card
          key={`front-${playerIndex}`}
          variant="front"
          onClick={handlePass}
          className={dealing ? 'is-dealing-out' : undefined}
          onAnimationEnd={handleDealOutEnd}
        >
          {isSpy ? (
            <img className="card-art card-art--face" src={spyFaceSrc} alt="" aria-hidden />
          ) : null}
          <div className="card-text">
            <h2 className="card-title">{isSpy ? 'جاسوس' : round.word.word}</h2>
            <p className="card-sub">
              {isSpy && config.spyGuide
                ? `موضوع: ${round.word.category}`
                : 'دوباره بزن و گوشی رو به نفر بعدی بده'}
            </p>
          </div>
        </Card>
      </div>
    </Screen>
  )
}
