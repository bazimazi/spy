import { Screen } from '../components/Screen'
import { RoundExitButton } from '../components/RoundExitButton'
import { toFa } from '../game/logic'
import type { GameConfig, RoundState } from '../game/types'
import watchSrc from '../assets/watch.png'

export function ReadyScreen({ config, round, roundNumber, onStart, onHome }: {
  config: GameConfig; round: RoundState; roundNumber: number; onStart: () => void; onHome: () => void
}) {
  return <Screen topActions={<RoundExitButton onExit={onHome} />}>
    <div className="center-block ready-content">
      <img src={watchSrc} className="stopwatch" alt="" aria-hidden />
      <p className="eyebrow">دور {toFa(roundNumber)} · همه کارت‌ها پخش شد</p>
      <h1 className="title" tabIndex={-1} data-screen-title>همه آماده‌اید؟</h1>
      <p className="subtitle text-center">گوشی رو وسط جمع بذارید. تا شروع رو نزنید، زمان کم نمی‌شه.</p>
      <div className="round-summary">{toFa(config.playerCount)} بازیکن · {toFa(config.spyCount)} جاسوس · {toFa(config.minutes)} دقیقه</div>
      <div className="tip-panel">
        <h2>بازیکن {toFa(round.startingPlayerIndex + 1)}، سؤال اول با تو!</h2>
        <p>از یک نفر بپرس: «معمولاً چه وقت‌هایی باهاش سر و کار داری؟»</p>
        <p>جواب کوتاه بدهید و خود کلمه رو نگویید. بعد، کسی که جواب داده سؤال بعدی رو بپرسه.</p>
      </div>
    </div>
    <div className="footer-actions"><button type="button" className="btn" onClick={onStart}>شروع گفت‌وگو</button></div>
  </Screen>
}
