import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { playerName, toFa } from '../game/logic'
import { cue } from '../game/feedback'
import type { GameConfig, RoundState } from '../game/types'
import watchSrc from '../assets/watch.png'

const SPINS = 14

export function ReadyScreen({ config, round, roundNumber, onStart, onHome }: {
  config: GameConfig; round: RoundState; roundNumber: number; onStart: () => void; onHome: () => void
}) {
  const [landed, setLanded] = useState(false)
  const starter = playerName(config.names, round.startingPlayerIndex)
  // A slot-machine strip that always comes to rest on the chosen player.
  const strip = useMemo(() => Array.from({ length: SPINS + 1 }, (_, step) =>
    playerName(config.names, (round.startingPlayerIndex - SPINS + step + config.playerCount * SPINS) % config.playerCount),
  ), [config.names, config.playerCount, round.startingPlayerIndex])

  return <GameplayScreen className="ready-screen" onHome={onHome}>
    <div className="play-focus">
      <img src={watchSrc} className="stopwatch" alt="" aria-hidden />
      <h1 className="title play-heading" tabIndex={-1} data-screen-title>همه آماده‌اید؟</h1>
      <p className="play-instruction">
        <span className="ready-starter__label">سؤال اول با</span>
        <span className={`roulette${landed ? ' is-landed' : ''}`}>
          <span className="roulette__strip" aria-hidden style={{ '--steps': SPINS } as CSSProperties}
            onAnimationEnd={() => { setLanded(true); cue('ding') }}>
            {strip.map((name, index) => <span key={index} className="roulette__item">{name}</span>)}
          </span>
          <span className="visually-hidden">{starter}</span>
        </span>
      </p>
      <p className="play-note">گوشی رو وسط جمع بذارید و هر وقت آماده بودید شروع کنید.</p>
      <p className="play-meta">دور {toFa(roundNumber)} · {toFa(config.minutes)} دقیقه</p>
    </div>
    <div className="footer-actions"><button type="button" className="btn btn--glow" onClick={onStart}>شروع گفت‌وگو</button></div>
  </GameplayScreen>
}
