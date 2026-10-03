import { Screen } from '../components/Screen'
import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  PlayersIcon,
  PlusIcon,
  SpyIcon,
} from '../components/Icons'
import type { GameConfig } from '../game/types'
import { toFa } from '../game/logic'
import spotlightSrc from '../assets/spotlight.svg'
import spyHeroSrc from '../assets/spy-hero.svg'

interface HomeScreenProps {
  config: GameConfig
  setConfig: (patch: Partial<GameConfig>) => void
  onStart: () => void
  onOpenGuide: () => void
  validationError: string | null
}

const RANGE = {
  playerCount: { min: 3, max: 30 },
  spyCount: { min: 1, max: 8 },
  minutes: { min: 1, max: 30 },
} as const

export function HomeScreen({
  config,
  setConfig,
  onStart,
  onOpenGuide,
  validationError,
}: HomeScreenProps) {
  const step = (key: keyof typeof RANGE, delta: number) => {
    const { min, max } = RANGE[key]
    const next = Math.min(max, Math.max(min, config[key] + delta))
    if (key === 'spyCount' && next >= config.playerCount) return
    if (key === 'playerCount' && config.spyCount >= next) {
      setConfig({ playerCount: next, spyCount: Math.max(1, next - 1) })
      return
    }
    setConfig({ [key]: next } as Partial<GameConfig>)
  }

  return (
    <Screen
      topActions={
        <button type="button" className="icon-btn" aria-label="راهنمای بازی" onClick={onOpenGuide}>
          <span className="help-badge">?</span>
        </button>
      }
      background={
        <>
          <img className="home-spotlight" src={spotlightSrc} alt="" aria-hidden />
          <img className="home-hero" src={spyHeroSrc} alt="" aria-hidden />
        </>
      }
    >
      <section className="settings" aria-label="تنظیمات بازی">
        <Row
          icon={<PlayersIcon />}
          label="تعداد بازیکن‌ها"
          value={config.playerCount}
          onInc={() => step('playerCount', 1)}
          onDec={() => step('playerCount', -1)}
        />
        <Row
          icon={<SpyIcon />}
          label="تعداد جاسوس‌ها"
          value={config.spyCount}
          onInc={() => step('spyCount', 1)}
          onDec={() => step('spyCount', -1)}
        />
        <Row
          icon={<ClockIcon />}
          label="زمان بازی (دقیقه)"
          value={config.minutes}
          onInc={() => step('minutes', 1)}
          onDec={() => step('minutes', -1)}
        />
      </section>

      <button
        type="button"
        className="spy-guide-row"
        onClick={() => setConfig({ spyGuide: !config.spyGuide })}
        aria-pressed={config.spyGuide}
      >
        <span>راهنما برای جاسوس</span>
        <span className={`toggle ${config.spyGuide ? 'toggle--on' : ''}`} aria-hidden>
          {config.spyGuide ? <CheckIcon width={14} height={14} /> : null}
        </span>
      </button>

      {validationError ? <p className="error">{validationError}</p> : null}

      <div className="footer-actions">
        <button type="button" className="btn" onClick={onStart}>
          بزن بریم!
        </button>
      </div>
    </Screen>
  )
}

interface RowProps {
  icon: React.ReactNode
  label: string
  value: number
  onInc: () => void
  onDec: () => void
}

function Row({ icon, label, value, onInc, onDec }: RowProps) {
  return (
    <div className="setting-row">
      <span className="setting-row__label">
        {icon}
        <span>{label}</span>
      </span>
      <span className="setting-row__value">
        <button type="button" className="stepper-btn" onClick={onInc} aria-label="اضافه کردن">
          <PlusIcon width={32} height={32} />
        </button>
        <span className="setting-row__value-text">{toFa(value)}</span>
        <button type="button" className="stepper-btn" onClick={onDec} aria-label="کم کردن">
          <MinusIcon width={32} height={32} />
        </button>
      </span>
    </div>
  )
}
