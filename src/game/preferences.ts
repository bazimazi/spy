import { validateConfig } from './logic'
import type { GameConfig } from './types'

export const DEFAULT_CONFIG: GameConfig = {
  playerCount: 5,
  spyCount: 1,
  minutes: 5,
  spyGuide: false,
  category: 'all',
  names: [],
  sound: true,
  vibration: true,
}

export const PREFERENCES_KEY = 'spy.preferences.v1'

export function readPreferences(): GameConfig {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { ...DEFAULT_CONFIG }
    const config = { ...DEFAULT_CONFIG, ...saved }
    return validateConfig(config) ? { ...DEFAULT_CONFIG } : config
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function savePreferences(config: GameConfig) {
  try {
    // Explicit allowlist: roles and secret words never go into browser storage.
    const { playerCount, spyCount, minutes, spyGuide, category, names, sound, vibration } = config
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
      playerCount, spyCount, minutes, spyGuide, category, names, sound, vibration,
    }))
  } catch {
    // Private browsing and denied storage must not interrupt a game.
  }
}
