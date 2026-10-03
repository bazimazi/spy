import type { GameConfig, RoundState, SecretWord } from './types'
import { VOCAB } from './words'

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function pickWord(): SecretWord {
  return VOCAB[Math.floor(Math.random() * VOCAB.length)]!
}

export function createRound(
  config: Pick<GameConfig, 'playerCount' | 'spyCount'>,
): RoundState {
  const positions = shuffle(Array.from({ length: config.playerCount }, (_, i) => i))
  const spyIndices = positions.slice(0, config.spyCount).sort((a, b) => a - b)
  return {
    word: pickWord(),
    spyIndices,
  }
}

export function validateConfig(c: GameConfig): string | null {
  if (c.playerCount < 3) return 'حداقل ۳ بازیکن لازم است.'
  if (c.playerCount > 30) return 'حداکثر ۳۰ بازیکن.'
  if (c.spyCount < 1) return 'حداقل یک جاسوس لازم است.'
  if (c.spyCount >= c.playerCount) return 'تعداد جاسوس‌ها باید کمتر از بازیکنان باشد.'
  if (c.minutes < 1 || c.minutes > 30) return 'زمان بین ۱ تا ۳۰ دقیقه.'
  return null
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** Convert an integer to its Persian-digit string form. */
export function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]!)
}

/** Format seconds as MM:SS using Persian digits. */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${toFa(m).padStart(2, '۰')}:${toFa(s).padStart(2, '۰')}`
}
