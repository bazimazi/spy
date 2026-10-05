import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent } from 'react'
import { Screen } from '../components/Screen'
import { Card } from '../components/Card'
import { RoundExitButton } from '../components/RoundExitButton'
import { GuideScreen } from './GuideScreen'
import { playerName, toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import spyCardSrc from '../assets/spy-card.svg'
import spyFaceSrc from '../assets/logo.svg'

interface RevealScreenProps {
  config: GameConfig
  round: RoundState
  playerIndex: number
  onNext: () => void
  onHome: () => void
}

/**
 * `flipping` turns the back face away before the secret face turns in;
 * `leaving` deals the (already concealed) card off the deck.
 */
type Phase = 'back' | 'flipping' | 'front' | 'leaving'

export function RevealScreen({ config, round, playerIndex, onNext, onHome }: RevealScreenProps) {
  const [phase, setPhase] = useState<Phase>('back')
  const [guideOpen, setGuideOpen] = useState(false)
  const hideButton = useRef<HTMLButtonElement>(null)
  const cardArea = useRef<HTMLDivElement>(null)
  const hadReveal = useRef(false)
  const passed = useRef(false)
  const revealed = phase === 'front'
  const isSpy = round.spyIndices.includes(playerIndex)
  const lastPlayer = playerIndex === config.playerCount - 1
  const name = playerName(config.names, playerIndex)
  const nextName = lastPlayer ? '' : playerName(config.names, playerIndex + 1)

  useEffect(() => {
    if (revealed) {
      hadReveal.current = true
      hideButton.current?.focus({ preventScroll: true })
    } else if (phase === 'back' && hadReveal.current && !document.hidden) {
      cardArea.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    }
  }, [revealed, phase])

  useEffect(() => {
    const conceal = () => setPhase((current) => current === 'leaving' ? current : 'back')
    const hide = () => { if (document.hidden) conceal() }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', conceal)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', conceal)
    }
  }, [])

  const pass = () => {
    if (passed.current) return
    passed.current = true
    onNext()
  }

  // Animation events can be skipped in a background tab; never strand the deal.
  useEffect(() => {
    if (phase === 'flipping') {
      const timer = window.setTimeout(() => setPhase((current) => current === 'flipping' ? 'front' : current), 400)
      return () => window.clearTimeout(timer)
    }
    if (phase === 'leaving') {
      const timer = window.setTimeout(pass, 900)
      return () => window.clearTimeout(timer)
    }
  }, [phase])

  const onCardAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.animationName === 'card-flip-out') setPhase((current) => current === 'flipping' ? 'front' : current)
    if (event.animationName === 'card-deal-out') pass()
  }

  if (guideOpen) return <GuideScreen onClose={() => setGuideOpen(false)} />

  const remaining = config.playerCount - playerIndex
  return (
    <Screen className="reveal-screen" topActions={<>
      <button type="button" className="icon-btn" aria-label="راهنمای بازی"
        onClick={() => { setPhase('back'); setGuideOpen(true) }}>
        <span className="help-badge" aria-hidden>?</span>
      </button>
      <RoundExitButton onExit={onHome} onRequest={() => setPhase((current) => current === 'leaving' ? current : 'back')} />
    </>}>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>نوبت {name}</h1>
      <div ref={cardArea} className="reveal-deck">
        <Card key={revealed ? 'front' : 'back'} variant={revealed ? 'front' : 'back'}
          // Every card still in the deck is drawn, foreground included, so a
          // deck of up to MAX_DECK_LAYERS + 1 players shows its exact size.
          depth={config.playerCount - 1}
          layers={remaining - (phase === 'leaving' ? 2 : 1)}
          className={phase === 'flipping' ? 'is-flipping-out' : phase === 'leaving' ? 'is-dealing-out' : undefined}
          onClick={phase === 'back' ? () => setPhase('flipping') : undefined}
          cue="flip" onAnimationEnd={onCardAnimationEnd}
          label={phase === 'back' ? `دیدن کارت ${name}` : undefined}>
          {!revealed ? <>
            <img className="card-bg-art" src={spyCardSrc} alt="" aria-hidden />
            <div className="card-text">
              <h2 className="card-title card-title--muted">{name}</h2>
              <p className="card-sub">{phase === 'leaving'
                ? (lastPlayer ? 'همه کارت‌ها پخش شد' : `نوبت ${nextName}`)
                : 'برای دیدن نقش و کلمه، روی کارت بزن'}</p>
            </div>
          </> : <>
            {/* Spy and citizen faces share every effect, so nothing but the
                card's own content can give a role away across the table. */}
            <span className="card-shine" aria-hidden />
            {isSpy && <img className="card-art card-art--face" src={spyFaceSrc} alt="" aria-hidden />}
            <div className="card-text">
              <h2 className="card-title secret-word">{isSpy ? 'جاسوس' : round.word.word}</h2>
              <button ref={hideButton} type="button" className="card-sub card-pass" data-cue="deal"
                // A double tap on the card or a held Enter key must not pass the
                // card on before its owner has seen it.
                onKeyDown={(event) => { if (event.repeat) event.preventDefault() }}
                onClick={(event) => {
                  if (event.detail > 1) return
                  setPhase('leaving')
                }}>
                {lastPlayer ? 'کارت رو پنهان کن؛ همه آماده‌ایم' : 'کارت رو پنهان کن و گوشی رو بده'}
              </button>
            </div>
            {isSpy && config.spyGuide && <p className="card-role-hint">راهنمای تو: {round.word.category}</p>}
            <p className="card-tip">{isSpy
              ? 'از جواب‌ها سرنخ بگیر؛ کلمه رو حدس بزن.'
              : 'سؤال غیرمستقیم بپرس؛ خود کلمه رو نگو.'}</p>
          </>}
        </Card>
      </div>
      <footer className="reveal-progress">
        <p><span>کارت {toFa(playerIndex + 1)} از {toFa(config.playerCount)}</span><span>فقط {name} نگاه کنه</span></p>
        <div className="deal-pips" aria-hidden>
          {config.playerCount <= 12 && Array.from({ length: config.playerCount }, (_, index) => (
            <span key={index} className={`deal-pip${index < playerIndex ? ' is-done' : index === playerIndex ? ' is-current' : ''}`} />
          ))}
        </div>
        {config.playerCount > 12 && <progress className="round-progress" value={playerIndex + 1}
          max={config.playerCount} aria-label="پیشرفت پخش کارت‌ها" />}
      </footer>
    </Screen>
  )
}
