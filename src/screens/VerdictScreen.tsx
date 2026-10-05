import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { judgeAccusation, playerName } from '../game/logic'
import { cue } from '../game/feedback'
import type { GameConfig, RoundState } from '../game/types'
import spyFaceSrc from '../assets/logo.svg'

interface VerdictScreenProps {
  config: GameConfig
  round: RoundState
  accused: number[]
  onContinue: () => void
  onHome: () => void
}

/** Drumroll, then each suspect's card turns over and the verdict is stamped. */
export function VerdictScreen({ config, round, accused, onContinue, onHome }: VerdictScreenProps) {
  const caught = judgeAccusation(round, accused) === 'caught'
  const spyLabel = round.spyIndices.length > 1 ? 'جاسوس‌ها' : 'جاسوس'

  useEffect(() => cue('drumroll'), [])

  return <GameplayScreen className="verdict-screen" onHome={onHome}>
    <h1 className="title play-heading" tabIndex={-1} data-screen-title>رأی جمع</h1>
    <p className="verdict-suspense" aria-hidden>و نقش واقعی<span className="verdict-dots"><span>.</span><span>.</span><span>.</span></span></p>
    <ul className="verdict-cards" style={{ '--count': accused.length } as CSSProperties}>
      {accused.map((seat, index) => {
        const isSpy = round.spyIndices.includes(seat)
        return <li key={seat} className={`verdict-card${isSpy ? ' is-spy' : ''}`} style={{ '--i': index } as CSSProperties}>
          <span className="verdict-card__inner">
            <span className="verdict-card__face verdict-card__face--back" aria-hidden>?</span>
            <span className="verdict-card__face verdict-card__face--front">
              {isSpy && <img src={spyFaceSrc} alt="" aria-hidden />}
              <strong>{playerName(config.names, seat)}</strong>
              <span>{isSpy ? 'جاسوس بود!' : 'شهروند بود!'}</span>
            </span>
          </span>
        </li>
      })}
    </ul>
    <div className="verdict-result" style={{ '--count': accused.length } as CSSProperties}>
      <p className={`verdict-stamp${caught ? ' is-caught' : ' is-wrong'}`}
        onAnimationStart={(event) => { if (event.animationName === 'stamp-in') cue('stamp') }}>
        {caught ? 'گیر افتاد!' : 'اشتباه شد!'}
      </p>
      <p className="play-instruction">{caught
        ? `${spyLabel} یک شانس آخر داره: اگه کلمه رو درست حدس بزنه، باز هم می‌بره.`
        : `یک شهروند بی‌گناه متهم شد؛ ${spyLabel} بردند!`}</p>
    </div>
    <div className="footer-actions verdict-actions" style={{ '--count': accused.length } as CSSProperties}>
      <button type="button" className="btn" onClick={onContinue}>{caught ? 'شانس آخر جاسوس' : 'نمایش نتیجه'}</button>
    </div>
  </GameplayScreen>
}
