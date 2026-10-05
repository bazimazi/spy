import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PauseIcon, PlayIcon } from '../components/Icons'
import { formatTime } from '../game/logic'
import { cue } from '../game/feedback'
import { useRoundClock } from '../game/useRoundClock'
import { useWakeLock } from '../game/useWakeLock'
import { useBackButton } from '../platform/native'
import watchSrc from '../assets/watch.png'
import watchRedSrc from '../assets/watch-red.png'
import spyHeroSrc from '../assets/spy-hero.svg'

interface TimerScreenProps {
  totalSeconds: number
  onFinish: (timedOut: boolean) => void
  onSpyGuess: () => void
  onHome: () => void
}

export function TimerScreen({ totalSeconds, onFinish, onSpyGuess, onHome }: TimerScreenProps) {
  const { remaining, allocatedSeconds, isRunning, pause, resume, addMinute } = useRoundClock(totalSeconds)
  const [confirming, setConfirming] = useState<'end' | 'guess' | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const wasRunning = useRef(false)
  const finished = useRef(false)
  const isWarning = remaining <= 10
  useWakeLock(isRunning && remaining > 0)
  // Back folds the open panel before it offers to cancel the round.
  useBackButton(() => setToolsOpen(false), toolsOpen)

  useEffect(() => {
    if (remaining > 0 || finished.current) return
    finished.current = true
    onFinish(true)
  }, [remaining, onFinish])

  // A ticking clock builds tension through the final seconds.
  useEffect(() => {
    if (isRunning && remaining > 0 && remaining <= 10) cue('tick')
  }, [remaining, isRunning])

  const cancelConfirmation = () => {
    setConfirming(null)
    if (wasRunning.current) resume()
  }

  const pauseForConfirmation = () => {
    wasRunning.current = isRunning
    pause()
  }

  const [minutes, seconds] = formatTime(remaining).split(':')
  return (
    <GameplayScreen className={`timer-screen${isWarning ? ' is-warning' : ''}${isRunning ? '' : ' is-paused'}`}
      onHome={onHome} onRequestHome={pauseForConfirmation}
      onCancelHome={() => { if (wasRunning.current) resume() }}>
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>جاسوس رو پیدا کنید</h1>
      <div className="play-focus">
        <img src={isWarning ? watchRedSrc : watchSrc} alt=""
          className={`stopwatch ${isWarning && isRunning ? 'is-warn' : ''}`} aria-hidden />
        <div className="timer-reading">
          <div className={`timer-display ${isWarning ? 'is-warn' : ''}`} role="timer" aria-label="زمان باقی‌مانده" aria-live="off" dir="ltr">
            {minutes}:<span className="timer-display__seconds" key={seconds}>{seconds}</span>
          </div>
          <button type="button" className="timer-pause" onClick={isRunning ? pause : resume}
            aria-label={isRunning ? 'مکث بازی' : 'ادامه‌ی بازی'}>
            {isRunning ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
            <span>{isRunning ? 'مکث' : 'ادامه'}</span>
          </button>
        </div>
        <div className="timer-fuse" aria-hidden>
          <span className="timer-fuse__fill" style={{ transform: `scaleX(${allocatedSeconds ? remaining / allocatedSeconds : 0})` }} />
        </div>
        <p className="timer-status" role="status">{!isRunning ? 'بازی مکث شده؛ هر وقت آماده بودید ادامه بدید.'
          : isWarning ? '۱۰ ثانیه‌ی آخر! برای رأی و حدس آماده بشید.' : 'با سؤال‌های غیرمستقیم، جاسوس رو پیدا کنید.'}</p>
      </div>
      <div className="footer-actions play-footer">
        <div className="play-footer__above">
          {/* The click sets state at once; `toggle` arrives later and covers find-in-page. */}
          <details className="timer-tools" open={toolsOpen}
            onToggle={(event) => setToolsOpen(event.currentTarget.open)}>
            <summary onClick={(event) => { event.preventDefault(); setToolsOpen(!toolsOpen) }}>زمان و راهنما</summary>
            <div className="timer-tools__panel" role="region" aria-label="زمان و راهنمای بازی" tabIndex={0}>
              <button type="button" className="btn btn--ghost" onClick={addMinute} data-cue="select">۱ دقیقه بیشتر</button>
              <progress className="round-progress" max={allocatedSeconds} value={remaining} aria-label="زمان باقی‌مانده‌ی دور" />
              <p className="play-note">{isRunning ? 'وقتی از صفحه خارج بشی، زمان ادامه داره.' : 'تا ادامه رو نزنی، زمان کم نمی‌شه.'}</p>
              <button type="button" className="btn btn--ghost btn--spy" onClick={() => {
                pauseForConfirmation()
                setConfirming('guess')
              }}>جاسوسم؛ کلمه رو حدس می‌زنم</button>
              <p className="play-note">حدس درست وسط بازی ۳ امتیاز داره؛ حدس غلط یعنی باخت جاسوس‌ها.</p>
              <p className="timer-tools__title">برای سؤال بعدی:</p>
              <ul>
                <li>«چه وقت‌هایی باهاش سر و کار داری؟»</li>
                <li>«چه چیزی درباره‌ش دوست داری؟»</li>
                <li>«یاد چه خاطره‌ای می‌افتی؟»</li>
              </ul>
              <p className="play-note">خود کلمه، تعداد حرف‌ها و بخش‌هاش رو نگویید.</p>
            </div>
          </details>
          <img className="play-spy" src={spyHeroSrc} alt="" aria-hidden
            style={{ '--spy-elapsed': allocatedSeconds ? 1 - remaining / allocatedSeconds : 1 } as CSSProperties} />
        </div>
        <button type="button" className="btn" onClick={() => {
          pauseForConfirmation()
          setConfirming('end')
        }}>پایان گفت‌وگو</button>
      </div>
      {confirming === 'end' && <ConfirmDialog title="گفت‌وگو رو تمام کنیم؟"
        description="زمان مکث شده. بعد از پایان گفت‌وگو، برای رأی‌گیری و حدس نهایی فرصت دارید؛ کلمه هنوز پنهان می‌مونه."
        confirmLabel="بریم برای تصمیم نهایی" onCancel={cancelConfirmation} onConfirm={() => onFinish(false)} />}
      {confirming === 'guess' && <ConfirmDialog title="جاسوس حدس می‌زنه؟"
        description="جاسوس خودش رو لو می‌ده و گفت‌وگو همین‌جا تمام می‌شه. حدس درست یعنی برد جاسوس‌ها و حدس غلط یعنی برد شهروندها."
        confirmLabel="آره، حدس می‌زنم" onCancel={cancelConfirmation} onConfirm={onSpyGuess} />}
    </GameplayScreen>
  )
}
