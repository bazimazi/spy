import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { Card } from '../components/Card'
import { RoundExitButton } from '../components/RoundExitButton'
import { GuideScreen } from './GuideScreen'
import { toFa } from '../game/logic'
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

export function RevealScreen({ config, round, playerIndex, onNext, onHome }: RevealScreenProps) {
  const [revealed, setRevealed] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const hideButton = useRef<HTMLButtonElement>(null)
  const cardArea = useRef<HTMLDivElement>(null)
  const hadReveal = useRef(false)
  const isSpy = round.spyIndices.includes(playerIndex)
  const lastPlayer = playerIndex === config.playerCount - 1

  useEffect(() => {
    if (revealed) {
      hadReveal.current = true
      hideButton.current?.focus({ preventScroll: true })
    } else if (hadReveal.current && !document.hidden) {
      cardArea.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    }
  }, [revealed])

  useEffect(() => {
    const hide = () => { if (document.hidden) setRevealed(false) }
    const hideOnLeave = () => setRevealed(false)
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', hideOnLeave)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', hideOnLeave)
    }
  }, [])

  if (guideOpen) return <GuideScreen onClose={() => setGuideOpen(false)} />

  return (
    <Screen className="reveal-screen" topActions={<>
      <button type="button" className="icon-btn" aria-label="راهنمای بازی"
        onClick={() => { setRevealed(false); setGuideOpen(true) }}>
        <span className="help-badge" aria-hidden>?</span>
      </button>
      <RoundExitButton onExit={onHome} onRequest={() => setRevealed(false)} />
    </>}>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>نوبت بازیکن {toFa(playerIndex + 1)}</h1>
      <div ref={cardArea} className="reveal-deck">
        <Card key={revealed ? 'front' : 'back'} variant={revealed ? 'front' : 'back'}
          onClick={revealed ? undefined : () => setRevealed(true)}
          label={revealed ? undefined : `دیدن کارت بازیکن ${toFa(playerIndex + 1)}`}>
          {!revealed ? <>
            <img className="card-bg-art" src={spyCardSrc} alt="" aria-hidden />
            <div className="card-text">
              <h2 className="card-title card-title--muted">بازیکن {toFa(playerIndex + 1)}</h2>
              <p className="card-sub">برای دیدن نقش و کلمه، روی کارت بزن</p>
            </div>
          </> : <>
            {isSpy && <img className="card-art card-art--face" src={spyFaceSrc} alt="" aria-hidden />}
            <div className="card-text">
              <h2 className="card-title secret-word">{isSpy ? 'جاسوس' : round.word.word}</h2>
              <button ref={hideButton} type="button" className="card-sub card-pass"
                onClick={() => { setRevealed(false); onNext() }}>
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
        <p><span>کارت {toFa(playerIndex + 1)} از {toFa(config.playerCount)}</span><span>فقط بازیکن {toFa(playerIndex + 1)} نگاه کنه</span></p>
        <progress className="round-progress" value={playerIndex + 1} max={config.playerCount} aria-label="پیشرفت پخش کارت‌ها" />
      </footer>
    </Screen>
  )
}
