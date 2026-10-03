import { useState } from 'react'
import { Screen } from '../components/Screen'
import { CheckIcon, ClockIcon, PlayersIcon, SpyIcon } from '../components/Icons'
import type { GameConfig } from '../game/types'
import { toFa } from '../game/logic'
import { CATEGORIES, getWordPool } from '../game/words'
import spotlightSrc from '../assets/spotlight.svg'
import spyHeroSrc from '../assets/spy-hero.svg'

interface HomeScreenProps {
  config: GameConfig
  setConfig: (patch: Partial<GameConfig>) => void
  onStart: () => void
  onOpenGuide: () => void
  validationError: string | null
}

export function HomeScreen({ config, setConfig, onStart, onOpenGuide, validationError }: HomeScreenProps) {
  const [optionsOpen, setOptionsOpen] = useState(false)
  const maxSpies = Math.min(8, config.playerCount - 1)

  const updatePlayers = (playerCount: number) => {
    setConfig({ playerCount, spyCount: Math.min(config.spyCount, playerCount - 1) })
  }

  return (
    <Screen
      className={`home-screen${optionsOpen ? ' home-screen--options-open' : ''}`}
      topActions={
        <button type="button" className="icon-btn" aria-label="راهنمای بازی" onClick={onOpenGuide}>
          <span className="help-badge" aria-hidden>?</span>
        </button>
      }
      background={<img className="home-spotlight" src={spotlightSrc} alt="" aria-hidden />}
    >
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>جاسوس</h1>

      <div className="home-setup">
        <section className="settings" aria-label="تنظیمات بازی">
          <SettingSelect id="player-count" icon={<PlayersIcon />} label="تعداد بازیکن‌ها"
            value={config.playerCount} min={3} max={30} onChange={updatePlayers} />
          <SettingSelect id="spy-count" icon={<SpyIcon />} label="تعداد جاسوس‌ها"
            value={config.spyCount} min={1} max={maxSpies} onChange={(spyCount) => setConfig({ spyCount })} />
          <SettingSelect id="round-minutes" icon={<ClockIcon />} label="زمان بازی (دقیقه)"
            value={config.minutes} min={1} max={30} onChange={(minutes) => setConfig({ minutes })} />
        </section>

        <details className="home-options" onToggle={(event) => setOptionsOpen(event.currentTarget.open)}>
          <summary>
            تنظیمات بیشتر
            {(config.category !== 'all' || config.spyGuide) && (
              <span className="home-options__active">
                {[config.category !== 'all' ? config.category : null, config.spyGuide ? 'راهنمای جاسوس' : null]
                  .filter(Boolean).join(' · ')}
              </span>
            )}
          </summary>
          <div className="home-options__panel">
            <div className="category-field">
              <label htmlFor="category">موضوع کلمه‌ها</label>
              <select id="category" value={config.category}
                onChange={(event) => setConfig({ category: event.target.value as GameConfig['category'] })}>
                <option value="all">همه‌ی موضوع‌ها</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <p className="setting-note">{toFa(getWordPool(config.category).length)} کلمه؛ در این جلسه بدون تکرار تا پایان مجموعه.</p>
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
            <p className="setting-note">{config.spyCount >= config.playerCount / 2
              ? 'برای دور متعادل‌تر، شهروندها بیشتر از جاسوس‌ها باشند.'
              : 'بار اولتونه؟ با یک جاسوس و راهنمای روشن شروع کنید.'}</p>
          </div>
        </details>
        {validationError && <p className="error" role="alert">{validationError}</p>}
      </div>

      <div className="home-art-stage" aria-hidden>
        <img className="home-hero" src={spyHeroSrc} alt="" />
      </div>
      <div className="footer-actions">
        <button type="button" className="btn" onClick={onStart}>بزن بریم!</button>
      </div>
    </Screen>
  )
}

interface SettingSelectProps {
  id: string
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function SettingSelect({ id, icon, label, value, min, max, onChange }: SettingSelectProps) {
  return (
    <label className="setting-row" htmlFor={id}>
      <span className="setting-row__label">{icon}<span>{label}</span></span>
      <span className="setting-select">
        <select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))}>
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((number) => (
            <option key={number} value={number}>{toFa(number)}</option>
          ))}
        </select>
        <svg className="setting-select__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  )
}
