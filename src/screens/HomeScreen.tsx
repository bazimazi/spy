import { Screen } from '../components/Screen'
import { Disclosure } from '../components/Disclosure'
import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { CheckIcon, ClockIcon, MinusIcon, PlayersIcon, PlusIcon, SoundOffIcon, SoundOnIcon, SpyIcon, UsersIcon } from '../components/Icons'
import type { GameConfig } from '../game/types'
import { toFa } from '../game/logic'
import { CATEGORIES, getWordPool } from '../game/words'
import { cue } from '../game/feedback'
import { isNative } from '../platform/native'
import spotlightSrc from '../assets/spotlight.svg'
import spyHeroSrc from '../assets/spy-hero.svg'

const canVibrate = isNative || 'vibrate' in navigator

interface HomeScreenProps {
  config: GameConfig
  setConfig: (patch: Partial<GameConfig>) => void
  onStart: () => void
  onOpenGuide: () => void
  onOpenPlayers: () => void
  /** Kept by the app so the panel is still open after editing names. */
  optionsOpen: boolean
  onOptionsToggle: (open: boolean) => void
  validationError: string | null
}

export function HomeScreen({ config, setConfig, onStart, onOpenGuide, onOpenPlayers, optionsOpen, onOptionsToggle,
  validationError }: HomeScreenProps) {
  const maxSpies = Math.min(8, config.playerCount - 1)
  const namedCount = config.names.slice(0, config.playerCount).filter((name) => name.trim()).length

  const updatePlayers = (playerCount: number) => {
    setConfig({ playerCount, spyCount: Math.min(config.spyCount, playerCount - 1) })
  }

  return (
    <Screen
      className={`home-screen${optionsOpen ? ' home-screen--options-open' : ''}`}
      topActions={<>
        <button type="button" className="icon-btn" aria-label="راهنمای بازی" onClick={onOpenGuide}>
          <span className="help-badge" aria-hidden>?</span>
        </button>
        <button type="button" className="icon-btn sound-toggle" aria-label="صدای بازی" aria-pressed={config.sound}
          onClick={() => setConfig({ sound: !config.sound })}>
          {config.sound ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
      </>}
      background={<img className="home-spotlight" src={spotlightSrc} alt="" aria-hidden />}
    >
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>جاسوس</h1>

      <div className="home-setup">
        <section className="settings" aria-label="تنظیمات بازی">
          <SettingStepper id="player-count" icon={<PlayersIcon />} label="تعداد بازیکن‌ها"
            value={config.playerCount} min={3} max={30} onChange={updatePlayers} />
          <SettingStepper id="spy-count" icon={<SpyIcon />} label="تعداد جاسوس‌ها"
            value={config.spyCount} min={1} max={maxSpies} onChange={(spyCount) => setConfig({ spyCount })} />
          <SettingStepper id="round-minutes" icon={<ClockIcon />} label="زمان بازی (دقیقه)"
            value={config.minutes} min={1} max={30} onChange={(minutes) => setConfig({ minutes })} />
        </section>

        <Disclosure className="home-options" open={optionsOpen} onOpenChange={onOptionsToggle} summary={<>
          تنظیمات بیشتر
          {(config.category !== 'all' || config.spyGuide) && (
            <span className="home-options__active">
              {[config.category !== 'all' ? config.category : null, config.spyGuide ? 'راهنمای جاسوس' : null]
                .filter(Boolean).join(' · ')}
            </span>
          )}
        </>}>
          <div className="home-options__panel">
            <CategoryPicker value={config.category} onChange={(category) => setConfig({ category })} />
            <p className="setting-note">{toFa(getWordPool(config.category).length)} کلمه؛ در این جلسه بدون تکرار تا پایان مجموعه.</p>
            <button type="button" className="spy-guide-row" onClick={onOpenPlayers}>
              <span className="toggle-copy">
                <strong>نام بازیکن‌ها</strong>
                <span>{namedCount ? `${toFa(namedCount)} نام ثبت شده` : 'به جای «بازیکن ۱»، اسم هر نفر رو بنویسید.'}</span>
              </span>
              <UsersIcon className="row-icon" />
            </button>
            <button type="button" className="spy-guide-row" role="switch" aria-checked={config.spyGuide}
              aria-describedby="spy-guide-description" onClick={() => setConfig({ spyGuide: !config.spyGuide })}>
              <span className="toggle-copy">
                <strong>راهنما برای جاسوس</strong>
                <span id="spy-guide-description">جاسوس فقط موضوع کلمه رو می‌بینه.</span>
              </span>
              <span className={`toggle ${config.spyGuide ? 'toggle--on' : ''}`} aria-hidden>
                {config.spyGuide ? <CheckIcon width={16} height={16} /> : null}
              </span>
            </button>
            {canVibrate && <button type="button" className="spy-guide-row" role="switch" aria-checked={config.vibration} aria-label="لرزش گوشی"
              onClick={() => setConfig({ vibration: !config.vibration })}>
              <span className="toggle-copy"><strong>لرزش گوشی</strong></span>
              <span className={`toggle ${config.vibration ? 'toggle--on' : ''}`} aria-hidden>
                {config.vibration ? <CheckIcon width={16} height={16} /> : null}
              </span>
            </button>}
            <p className="setting-note">{config.spyCount >= config.playerCount / 2
              ? 'برای دور متعادل‌تر، شهروندها بیشتر از جاسوس‌ها باشند.'
              : 'بار اولتونه؟ با یک جاسوس و راهنمای روشن شروع کنید.'}</p>
          </div>
        </Disclosure>
        {validationError && <p className="error" role="alert">{validationError}</p>}
      </div>

      <div className="home-art-stage" aria-hidden>
        <img className="home-hero" src={spyHeroSrc} alt="" />
      </div>
      <div className="footer-actions">
        <button type="button" className="btn btn--glow" data-cue="deal" onClick={onStart}>بزن بریم!</button>
      </div>
    </Screen>
  )
}

interface SettingStepperProps {
  id: string
  icon: ReactNode
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

const HOLD_DELAY = 400
const HOLD_INTERVAL = 90

/** Compact − value + control. Holding a button repeats the step so long ranges stay quick to cross. */
function SettingStepper({ id, icon, label, value, min, max, onChange }: SettingStepperProps) {
  const labelId = `${id}-label`
  const latest = useRef({ value, min, max, onChange })
  latest.current = { value, min, max, onChange }
  const holdTimer = useRef<number>(undefined)
  const previous = useRef(value)
  const direction = value > previous.current ? 'up' : value < previous.current ? 'down' : null
  useEffect(() => { previous.current = value }, [value])

  const set = (next: number) => {
    const { value: current, min: low, max: high, onChange: change } = latest.current
    const clamped = Math.min(high, Math.max(low, next))
    if (clamped === current) return false
    change(clamped)
    cue('select')
    return true
  }

  const stopHold = () => {
    window.clearTimeout(holdTimer.current)
  }
  useEffect(() => stopHold, [])

  const startHold = (delta: number) => {
    stopHold()
    if (!set(latest.current.value + delta)) return
    const repeat = () => {
      if (set(latest.current.value + delta)) holdTimer.current = window.setTimeout(repeat, HOLD_INTERVAL)
    }
    holdTimer.current = window.setTimeout(repeat, HOLD_DELAY)
  }

  const stepButton = (delta: number) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      startHold(delta)
    },
    onPointerUp: stopHold,
    onPointerCancel: stopHold,
    onLostPointerCapture: stopHold,
    onContextMenu: (event: MouseEvent) => event.preventDefault(),
    // Pointer presses already stepped; assistive technology clicks (detail 0) step here.
    onClick: (event: MouseEvent) => { if (event.detail === 0) set(latest.current.value + delta) },
  })

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const steps: Record<string, number> = {
      ArrowUp: value + 1, ArrowRight: value + 1, ArrowDown: value - 1, ArrowLeft: value - 1,
      PageUp: value + 5, PageDown: value - 5, Home: min, End: max,
    }
    if (!(event.key in steps)) return
    event.preventDefault()
    set(steps[event.key])
  }

  return (
    <div className="setting-row">
      <span className="setting-row__label">{icon}<span id={labelId}>{label}</span></span>
      <span className="stepper">
        <button type="button" className="stepper__btn" tabIndex={-1} aria-label={`کم کردن ${label}`}
          disabled={value <= min} {...stepButton(-1)}>
          <MinusIcon width={18} height={18} />
        </button>
        <span id={id} className="stepper__value" role="spinbutton" tabIndex={0} aria-labelledby={labelId}
          aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-valuetext={toFa(value)} onKeyDown={onKeyDown}>
          <span key={value} className={direction ? `stepper__digit stepper__digit--${direction}` : 'stepper__digit'}>
            {toFa(value)}
          </span>
        </span>
        <button type="button" className="stepper__btn" tabIndex={-1} aria-label={`زیاد کردن ${label}`}
          disabled={value >= max} {...stepButton(1)}>
          <PlusIcon width={18} height={18} />
        </button>
      </span>
    </div>
  )
}

type Category = GameConfig['category']
const CATEGORY_OPTIONS: { value: Category, label: string }[] = [
  { value: 'all', label: 'همه' },
  ...CATEGORIES.map((category) => ({ value: category, label: category })),
]

/** Chip radio group; arrow keys move between chips like a native radio set. */
function CategoryPicker({ value, onChange }: { value: Category, onChange: (value: Category) => void }) {
  const chips = useRef<(HTMLButtonElement | null)[]>([])

  const select = (index: number) => {
    const option = CATEGORY_OPTIONS[index]
    chips.current[index]?.focus()
    if (option.value === value) return
    onChange(option.value)
    cue('select')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = CATEGORY_OPTIONS.length - 1
    // Next/previous follow reading order, which runs right-to-left here.
    const moves: Record<string, number> = {
      ArrowLeft: index === last ? 0 : index + 1, ArrowDown: index === last ? 0 : index + 1,
      ArrowRight: index === 0 ? last : index - 1, ArrowUp: index === 0 ? last : index - 1,
      Home: 0, End: last,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    select(moves[event.key])
  }

  return (
    <div className="category-field">
      <span id="category-label" className="category-field__label">موضوع کلمه‌ها</span>
      <div className="chip-group" role="radiogroup" aria-labelledby="category-label">
        {CATEGORY_OPTIONS.map((option, index) => {
          const checked = option.value === value
          return (
            <button key={option.value} ref={(node) => { chips.current[index] = node }} type="button" role="radio"
              className={`chip${checked ? ' chip--on' : ''}`} aria-checked={checked} tabIndex={checked ? 0 : -1}
              onClick={() => select(index)} onKeyDown={(event) => onKeyDown(event, index)}>
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
