import type { GameConfig, OutcomeReason, RoundOutcome, RoundState, SecretWord, SessionScore } from './types'
import { CATEGORIES, getWordPool } from './words'

export const MAX_NAME_LENGTH = 16

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function pickWord(
  category: GameConfig['category'] = 'all',
  history: readonly string[] = [],
): SecretWord {
  const pool = getWordPool(category)
  const fresh = pool.filter((entry) => !history.includes(entry.word))
  // After exhausting a pool, begin again without repeating its most recent word,
  // even when words from other categories were played since.
  const lastFromPool = [...history].reverse().find((word) => pool.some((entry) => entry.word === word))
  const candidates = fresh.length ? fresh : pool.filter((entry) => entry.word !== lastFromPool)
  return candidates[Math.floor(Math.random() * candidates.length)]!
}

export function createRound(
  config: Pick<GameConfig, 'playerCount' | 'spyCount' | 'category'>,
  history: readonly string[] = [],
): RoundState {
  const pool = getWordPool(config.category)
  const hasFreshWords = pool.some((entry) => !history.includes(entry.word))
  const nextHistory = hasFreshWords
    ? [...history]
    : history.filter((word) => !pool.some((entry) => entry.word === word))
  const word = pickWord(config.category, history)
  const positions = shuffle(Array.from({ length: config.playerCount }, (_, i) => i))
  const spyIndices = positions.slice(0, config.spyCount).sort((a, b) => a - b)
  return {
    word,
    spyIndices,
    startingPlayerIndex: Math.floor(Math.random() * config.playerCount),
    wordHistory: [...nextHistory, word.word],
  }
}

export function validateConfig(c: GameConfig): string | null {
  if (![c.playerCount, c.spyCount, c.minutes].every(Number.isInteger)) {
    return 'تعدادها و زمان باید عدد صحیح باشند.'
  }
  if (c.playerCount < 3) return 'حداقل ۳ بازیکن لازم است.'
  if (c.playerCount > 30) return 'حداکثر ۳۰ بازیکن.'
  if (c.spyCount < 1) return 'حداقل یک جاسوس لازم است.'
  if (c.spyCount > 8) return 'حداکثر ۸ جاسوس.'
  if (c.spyCount >= c.playerCount) return 'تعداد جاسوس‌ها باید کمتر از بازیکنان باشد.'
  if (c.minutes < 1 || c.minutes > 30) return 'زمان بین ۱ تا ۳۰ دقیقه.'
  if (typeof c.spyGuide !== 'boolean') return 'تنظیم راهنمای جاسوس نامعتبر است.'
  if (c.category !== 'all' && !CATEGORIES.includes(c.category)) return 'موضوع نامعتبر است.'
  if (c.guessMode !== 'classic' && c.guessMode !== 'challenge') return 'روش حدس نامعتبر است.'
  if (!Array.isArray(c.names) || c.names.length > 30
    || !c.names.every((name) => typeof name === 'string' && name.length <= MAX_NAME_LENGTH)) {
    return 'نام بازیکن‌ها نامعتبر است.'
  }
  if (typeof c.sound !== 'boolean' || typeof c.vibration !== 'boolean') return 'تنظیم صدا نامعتبر است.'
  return null
}

/** The seat's custom name, or «بازیکن N» when none was entered. */
export function playerName(names: readonly string[], index: number): string {
  return names[index]?.trim() || `بازیکن ${toFa(index + 1)}`
}

/** The secret word among same-category decoys, for the spy's guess. */
export function guessOptions(word: SecretWord, count = 8): string[] {
  const decoys = shuffle(getWordPool(word.category).filter((entry) => entry.word !== word.word))
    .slice(0, count - 1)
    .map((entry) => entry.word)
  return shuffle([word.word, ...decoys])
}

/** Accusing any citizen ends the round for the spies; catching all spies earns them a last guess. */
export function judgeAccusation(round: RoundState, accused: readonly number[]): 'caught' | 'wrong-accusation' {
  return accused.length === round.spyIndices.length
    && new Set(accused).size === accused.length
    && accused.every((seat) => Number.isInteger(seat) && round.spyIndices.includes(seat))
    ? 'caught' : 'wrong-accusation'
}

/** Accept Persian/Arabic keyboard variants and spacing, without fuzzy or partial matches. */
export function normalizeGuess(value: string): string {
  return value.normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\p{M}\s\u200c\u200d\u0640]/gu, '')
    .toLocaleLowerCase('fa')
}

export function isCorrectGuess(guess: string, word: string): boolean {
  const normalized = normalizeGuess(guess)
  return normalized.length > 0 && normalized === normalizeGuess(word)
}

export function resolveRound(round: RoundState, accused: readonly number[], guess?: string): RoundOutcome {
  const early = accused.length === 0
  const correct = guess !== undefined && isCorrectGuess(guess, round.word.word)
  let reason: OutcomeReason
  if (early) reason = correct ? 'early-guess' : 'early-miss'
  else if (judgeAccusation(round, accused) === 'wrong-accusation') reason = 'wrong-accusation'
  else reason = correct ? 'last-guess' : 'caught'
  const winner = reason === 'caught' || reason === 'early-miss' ? 'citizens' : 'spies'
  return { winner, reason, accused: [...accused], guess }
}

/** Points per seat. A bold early guess pays the most; citizens share each win. */
export const POINTS: Record<OutcomeReason, number> = {
  caught: 1,
  'early-miss': 1,
  'wrong-accusation': 2,
  'last-guess': 2,
  'early-guess': 3,
}

export function scoreRound(round: RoundState, outcome: RoundOutcome, playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, seat) => {
    const isSpy = round.spyIndices.includes(seat)
    return (outcome.winner === 'spies') === isSpy ? POINTS[outcome.reason] : 0
  })
}

export function emptyScore(playerCount: number): SessionScore {
  return {
    points: Array(playerCount).fill(0),
    lastDelta: Array(playerCount).fill(0),
    wins: { citizens: 0, spies: 0 },
  }
}

export function addRoundScore(score: SessionScore, delta: readonly number[], winner: RoundOutcome['winner']): SessionScore {
  return {
    points: score.points.map((points, seat) => points + (delta[seat] ?? 0)),
    lastDelta: [...delta],
    wins: { ...score.wins, [winner]: score.wins[winner] + 1 },
  }
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
