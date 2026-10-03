import { GameplayScreen } from '../components/GameplayScreen'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'

export function ResolutionScreen({ timedOut, onReveal, onHome }: { timedOut: boolean; onReveal: () => void; onHome: () => void }) {
  return <GameplayScreen className="resolution-screen" onHome={onHome}>
    <div className="play-focus">
      <img className="stopwatch" src={timedOut ? watchRedSrc : watchSrc} alt="" aria-hidden />
      <h1 className="title play-heading" tabIndex={-1} data-screen-title>وقت تصمیمه!</h1>
      <p className="play-instruction">رأی‌تون رو مشخص کنید و حدس جاسوس رو بشنوید.</p>
      <p className="play-note">کلمه و نقش‌ها تا زدن دکمه پنهان می‌مونند.</p>
    </div>
    <div className="footer-actions"><button type="button" className="btn" onClick={onReveal}>نمایش کلمه و نقش‌ها</button></div>
  </GameplayScreen>
}
