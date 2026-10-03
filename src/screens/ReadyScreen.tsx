import { GameplayScreen } from '../components/GameplayScreen'
import { toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import watchSrc from '../assets/watch.png'

export function ReadyScreen({ config, round, roundNumber, onStart, onHome }: {
  config: GameConfig; round: RoundState; roundNumber: number; onStart: () => void; onHome: () => void
}) {
  return <GameplayScreen className="ready-screen" onHome={onHome}>
    <div className="play-focus">
      <img src={watchSrc} className="stopwatch" alt="" aria-hidden />
      <h1 className="title play-heading" tabIndex={-1} data-screen-title>همه آماده‌اید؟</h1>
      <p className="play-instruction">بازیکن {toFa(round.startingPlayerIndex + 1)}، سؤال اول با تو!</p>
      <p className="play-note">گوشی رو وسط جمع بذارید و هر وقت آماده بودید شروع کنید.</p>
      <p className="play-meta">دور {toFa(roundNumber)} · {toFa(config.minutes)} دقیقه</p>
    </div>
    <div className="footer-actions"><button type="button" className="btn" onClick={onStart}>شروع گفت‌وگو</button></div>
  </GameplayScreen>
}
