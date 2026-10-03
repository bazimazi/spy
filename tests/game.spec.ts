import { test, expect } from '@playwright/test'
import { createRound, formatTime, validateConfig } from '../src/game/logic'
import { DEFAULT_CONFIG } from '../src/game/preferences'
import { CATEGORIES, getWordPool, VOCAB } from '../src/game/words'

test('vocabulary is distinct and every category has enough replay variety', () => {
  expect(VOCAB).toHaveLength(100)
  expect(new Set(VOCAB.map((entry) => entry.word)).size).toBe(100)
  for (const category of CATEGORIES) expect(getWordPool(category)).toHaveLength(20)
})

test('configuration rejects corrupt numeric values and invalid boundaries', () => {
  expect(validateConfig(DEFAULT_CONFIG)).toBeNull()
  for (const playerCount of [NaN, Infinity, 2, 31, 5.5]) {
    expect(validateConfig({ ...DEFAULT_CONFIG, playerCount })).not.toBeNull()
  }
  for (const spyCount of [0, 9, 5, 1.5]) {
    expect(validateConfig({ ...DEFAULT_CONFIG, spyCount })).not.toBeNull()
  }
  for (const minutes of [0, 31, 2.5]) {
    expect(validateConfig({ ...DEFAULT_CONFIG, minutes })).not.toBeNull()
  }
  expect(validateConfig({ ...DEFAULT_CONFIG, playerCount: 30, spyCount: 8, minutes: 30 })).toBeNull()
})

test('every supported group size gets exactly the configured distinct spy seats', () => {
  for (let playerCount = 3; playerCount <= 30; playerCount++) {
    for (let spyCount = 1; spyCount <= Math.min(8, playerCount - 1); spyCount++) {
      const round = createRound({ ...DEFAULT_CONFIG, playerCount, spyCount })
      expect(round.spyIndices).toHaveLength(spyCount)
      expect(new Set(round.spyIndices).size).toBe(spyCount)
      expect(round.spyIndices.every((index) => index >= 0 && index < playerCount)).toBe(true)
      expect(round.startingPlayerIndex).toBeGreaterThanOrEqual(0)
      expect(round.startingPlayerIndex).toBeLessThan(playerCount)
    }
  }
})

test('words do not repeat within a pool or immediately across pool resets', () => {
  for (const category of ['all', ...CATEGORIES] as const) {
    let history: string[] = []
    let previous = ''
    const size = getWordPool(category).length
    for (let cycle = 0; cycle < 2; cycle++) {
      const seen = new Set<string>()
      for (let index = 0; index < size; index++) {
        const round = createRound({ ...DEFAULT_CONFIG, category }, history)
        expect(round.word.word).not.toBe(previous)
        expect(seen.has(round.word.word)).toBe(false)
        if (category !== 'all') expect(round.word.category).toBe(category)
        seen.add(round.word.word)
        previous = round.word.word
        history = round.wordHistory
      }
      expect(seen.size).toBe(size)
    }
    expect(history).toHaveLength(size)
  }
})

test('switching categories retains history of previously played words', () => {
  const first = createRound({ ...DEFAULT_CONFIG, category: 'غذا' })
  const second = createRound({ ...DEFAULT_CONFIG, category: 'مکان' }, first.wordHistory)
  const third = createRound({ ...DEFAULT_CONFIG, category: 'غذا' }, second.wordHistory)
  expect(third.word.word).not.toBe(first.word.word)
  expect(third.wordHistory).toContain(first.word.word)
})

test('timer formatting has Persian digits and clamps negative values', () => {
  expect(formatTime(60)).toBe('۰۱:۰۰')
  expect(formatTime(9)).toBe('۰۰:۰۹')
  expect(formatTime(-2)).toBe('۰۰:۰۰')
})
