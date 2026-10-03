import { Screen } from '../components/Screen'
import { RoundExitButton } from '../components/RoundExitButton'

export function ResolutionScreen({ timedOut, onReveal, onHome }: { timedOut: boolean; onReveal: () => void; onHome: () => void }) {
  return <Screen topActions={<RoundExitButton onExit={onHome} />}>
    <div className="center-block resolution-content">
      <p className="eyebrow">{timedOut ? 'زمان گفت‌وگو تموم شد' : 'گفت‌وگو تموم شد'}</p>
      <h1 className="title" tabIndex={-1} data-screen-title>وقت تصمیمه!</h1>
      <p className="subtitle text-center">هنوز هیچ رازی لو نرفته. قبل از دیدن کارت‌ها، رأی و حدس نهایی رو مشخص کنید.</p>
      <ol className="resolution-steps">
        <li><strong>به جاسوس‌ها رأی بدهید</strong><span>جمع درباره‌ی بازیکن‌های مشکوک به توافق برسه.</span></li>
        <li><strong>حدس جاسوس رو بشنوید</strong><span>اگر جاسوس می‌خواد کلمه رو حدس بزنه، قبل از نمایش نتیجه بگه.</span></li>
        <li><strong>حالا راز رو باز کنید</strong><span>با دیدن کلمه و نقش‌ها، نتیجه رو با هم مشخص کنید.</span></li>
      </ol>
    </div>
    <div className="footer-actions"><button type="button" className="btn" onClick={onReveal}>نمایش کلمه و نقش‌ها</button></div>
  </Screen>
}
