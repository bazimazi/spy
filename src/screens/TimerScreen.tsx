import { useEffect, useRef, useState } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PauseIcon, PlayIcon } from '../components/Icons'
import { formatTime } from '../game/logic'
import { useRoundClock } from '../game/useRoundClock'
import { useWakeLock } from '../game/useWakeLock'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'
import spyHeroSrc from '../assets/spy-hero.svg'

interface TimerScreenProps {
  totalSeconds: number
  onFinish: (timedOut: boolean) => void
  onHome: () => void
}

export function TimerScreen({ totalSeconds, onFinish, onHome }: TimerScreenProps) {
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

  const pauseForConfirmation = () => {
    wasRunning.current = isRunning
    pause()
  }

  return (
    <GameplayScreen className="timer-screen" onHome={onHome} onRequestHome={pauseForConfirmation}
      onCancelHome={() => { if (wasRunning.current) resume() }}>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>جاسوس رو پیدا کنید</h1>
      <div className="play-focus">
        <img src={isWarning ? watchRedSrc : watchSrc} alt=""
          className={`stopwatch ${isWarning && isRunning ? 'is-warn' : ''}`} aria-hidden />
        <div className="timer-reading">
          <div className={`timer-display ${isWarning ? 'is-warn' : ''}`} role="timer" aria-label="زمان باقی‌مانده" aria-live="off" dir="ltr">
            {formatTime(remaining)}
          </div>
          <button type="button" className="timer-pause" onClick={isRunning ? pause : resume}
            aria-label={isRunning ? 'مکث بازی' : 'ادامه‌ی بازی'}>
            {isRunning ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
            <span>{isRunning ? 'مکث' : 'ادامه'}</span>
          </button>
        </div>
        <p className="timer-status" role="status">{!isRunning ? 'بازی مکث شده؛ هر وقت آماده بودید ادامه بدید.'
          : isWarning ? '۱۰ ثانیه‌ی آخر! برای رأی و حدس آماده بشید.' : 'با سؤال‌های غیرمستقیم، جاسوس رو پیدا کنید.'}</p>
      </div>
      <div className="footer-actions play-footer">
        <div className="play-footer__above">
          <details className="timer-tools">
            <summary>زمان و راهنما</summary>
            <div className="timer-tools__panel" role="region" aria-label="زمان و راهنمای بازی" tabIndex={0}>
              <button type="button" className="btn btn--ghost" onClick={addMinute}>۱ دقیقه بیشتر</button>
              <progress className="round-progress" max={allocatedSeconds} value={remaining} aria-label="زمان باقی‌مانده‌ی دور" />
              <p className="play-note">{isRunning ? 'وقتی از صفحه خارج بشی، زمان ادامه داره.' : 'تا ادامه رو نزنی، زمان کم نمی‌شه.'}</p>
              <p className="timer-tools__title">برای سؤال بعدی:</p>
              <ul>
                <li>«چه وقت‌هایی باهاش سر و کار داری؟»</li>
                <li>«چه چیزی درباره‌ش دوست داری؟»</li>
                <li>«یاد چه خاطره‌ای می‌افتی؟»</li>
              </ul>
              <p className="play-note">خود کلمه، تعداد حرف‌ها و بخش‌هاش رو نگویید.</p>
            </div>
          </details>
          <img className="play-spy" src={spyHeroSrc} alt="" aria-hidden />
        </div>
        <button type="button" className="btn" onClick={() => {
          pauseForConfirmation()
          setConfirmingEnd(true)
        }}>پایان گفت‌وگو</button>
      </div>
      {confirmingEnd && <ConfirmDialog title="گفت‌وگو رو تمام کنیم؟"
        description="زمان مکث شده. بعد از پایان گفت‌وگو، برای رأی‌گیری و حدس نهایی فرصت دارید؛ کلمه هنوز پنهان می‌مونه."
        confirmLabel="بریم برای تصمیم نهایی" onCancel={cancelEnd} onConfirm={() => onFinish(false)} />}
    </GameplayScreen>
  )
}
