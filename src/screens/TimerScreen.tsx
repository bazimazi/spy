import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatTime } from '../game/logic'
import { useRoundClock } from '../game/useRoundClock'
import { useWakeLock } from '../game/useWakeLock'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'

interface TimerScreenProps {
  totalSeconds: number
  onFinish: (timedOut: boolean) => void
}

export function TimerScreen({ totalSeconds, onFinish }: TimerScreenProps) {
  const { remaining, allocatedSeconds, isRunning, pause, resume, addMinute } = useRoundClock(totalSeconds)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const wasRunning = useRef(false)
  const finished = useRef(false)
  const isWarning = remaining <= 10
  useWakeLock(isRunning && remaining > 0)

  useEffect(() => {
    if (remaining > 0 || finished.current) return
    finished.current = true
    onFinish(true)
  }, [remaining, onFinish])

  const cancelEnd = () => {
    setConfirmingEnd(false)
    if (wasRunning.current) resume()
  }

  return (
    <Screen className="timer-screen">
      <div className="center-block">
        <p className="eyebrow">وقت سرنخ گرفتن</p>
        <h1 className="title" tabIndex={-1} data-screen-title>جاسوس رو پیدا کنید</h1>
        <img src={isWarning ? watchRedSrc : watchSrc} alt=""
          className={`stopwatch ${isWarning && isRunning ? 'is-warn' : ''}`} aria-hidden />
        <div className={`timer-display ${isWarning ? 'is-warn' : ''}`} role="timer" aria-label="زمان باقی‌مانده" aria-live="off" dir="ltr">
          {formatTime(remaining)}
        </div>
        <p className="timer-status" role="status">{!isRunning ? 'بازی مکث شده؛ هر وقت آماده بودید ادامه بدید.'
          : isWarning ? '۱۰ ثانیه‌ی آخر! برای تصمیم نهایی آماده بشید.' : 'سؤال‌های غیرمستقیم، جواب‌های کوتاه.'}</p>
        <progress className="round-progress" max={allocatedSeconds} value={remaining} aria-label="زمان باقی‌مانده‌ی دور" />
        <details className="tip-panel timer-tips">
          <summary>برای سؤال بعدی ایده می‌خوای؟</summary>
          <p>«چه وقت‌هایی باهاش سر و کار داری؟»</p>
          <p>«چه چیزی درباره‌ش دوست داری؟»</p>
          <p>«یاد چه خاطره‌ای می‌افتی؟»</p>
          <p>خود کلمه، تعداد حرف‌ها و بخش‌هاش رو نگویید.</p>
        </details>
      </div>
      <div className="footer-actions stack">
        <p className="privacy-note">{isRunning ? 'وقتی از صفحه خارج بشی، زمان ادامه داره.' : 'تا ادامه رو نزنی، زمان کم نمی‌شه.'}</p>
        <button type="button" className="btn" onClick={isRunning ? pause : resume}>{isRunning ? 'مکث بازی' : 'ادامه‌ی بازی'}</button>
        <div className="action-pair">
          <button type="button" className="btn btn--ghost" onClick={addMinute}>۱ دقیقه بیشتر</button>
          <button type="button" className="btn btn--ghost" onClick={() => {
            wasRunning.current = isRunning
            pause()
            setConfirmingEnd(true)
          }}>پایان گفت‌وگو</button>
        </div>
      </div>
      {confirmingEnd && <ConfirmDialog title="گفت‌وگو رو تمام کنیم؟"
        description="زمان مکث شده. بعد از پایان گفت‌وگو، برای رأی‌گیری و حدس نهایی فرصت دارید؛ کلمه هنوز پنهان می‌مونه."
        confirmLabel="بریم برای تصمیم نهایی" onCancel={cancelEnd} onConfirm={() => onFinish(false)} />}
    </Screen>
  )
}
