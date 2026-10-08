import { test, expect } from '@playwright/test'
import { addRoundScore, createRound, emptyScore, formatTime, guessOptions, isCorrectGuess, judgeAccusation, normalizeGuess, playerName, resolveRound, scoreRound, validateConfig } from '../src/game/logic'
import { createQuestionDeck, QUESTION_PROMPTS } from '../src/game/questions'
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

test('a reset pool avoids its last word even after other categories were played', () => {
  const food = getWordPool('غذا').map((entry) => entry.word)
  const place = getWordPool('مکان')[0]!.word
  for (let attempt = 0; attempt < 200; attempt++) {
    const round = createRound({ ...DEFAULT_CONFIG, category: 'غذا' }, [...food, place])
    expect(round.word.word).not.toBe(food.at(-1))
    expect(round.wordHistory).toContain(place)
  }
})

test('the spy guess offers the word among distinct decoys from its own category', () => {
  for (const entry of VOCAB) {
    const options = guessOptions(entry)
    expect(options).toHaveLength(8)
    expect(new Set(options).size).toBe(8)
    expect(options).toContain(entry.word)
    const pool = getWordPool(entry.category).map((word) => word.word)
    expect(options.every((option) => pool.includes(option))).toBe(true)
  }
})

test('rounds resolve and score by accusation and guess', () => {
  const round = { ...createRound({ ...DEFAULT_CONFIG, playerCount: 5, spyCount: 2 }), spyIndices: [1, 3] }
  const word = round.word.word
  const cases = [
    { accused: [1, 3], guess: 'x', reason: 'caught', winner: 'citizens', points: [1, 0, 1, 0, 1] },
    { accused: [3, 1], guess: word, reason: 'last-guess', winner: 'spies', points: [0, 2, 0, 2, 0] },
    { accused: [1, 2], guess: undefined, reason: 'wrong-accusation', winner: 'spies', points: [0, 2, 0, 2, 0] },
    { accused: [], guess: word, reason: 'early-guess', winner: 'spies', points: [0, 3, 0, 3, 0] },
    { accused: [], guess: 'x', reason: 'early-miss', winner: 'citizens', points: [1, 0, 1, 0, 1] },
  ] as const
  let score = emptyScore(5)
  for (const { accused, guess, reason, winner, points } of cases) {
    const outcome = resolveRound(round, accused, guess)
    expect(outcome).toMatchObject({ reason, winner })
    expect(scoreRound(round, outcome, 5)).toEqual(points)
    score = addRoundScore(score, scoreRound(round, outcome, 5), outcome.winner)
  }
  expect(score.points).toEqual([2, 7, 2, 7, 2])
  expect(score.wins).toEqual({ citizens: 2, spies: 3 })
  expect(score.lastDelta).toEqual([1, 0, 1, 0, 1])
})

test('player names fall back to seat numbers and invalid settings are rejected', () => {
  expect(playerName(['سارا', '  '], 0)).toBe('سارا')
  expect(playerName(['سارا', '  '], 1)).toBe('بازیکن ۲')
  expect(playerName([], 9)).toBe('بازیکن ۱۰')
  expect(validateConfig({ ...DEFAULT_CONFIG, names: ['x'.repeat(17)] })).not.toBeNull()
  expect(validateConfig({ ...DEFAULT_CONFIG, names: [3 as unknown as string] })).not.toBeNull()
  expect(validateConfig({ ...DEFAULT_CONFIG, sound: 'yes' as unknown as boolean })).not.toBeNull()
})

test('free guesses accept keyboard variants but reject partial answers and extra guesses', () => {
  for (const guess of ['کتابخانه', 'كتابخانه', ' کِتاب خانه ', 'کتاب‌خانه', 'کـتابخانه']) {
    expect(isCorrectGuess(guess, 'کتابخانه')).toBe(true)
  }
  expect(isCorrectGuess('اسكي', 'اسکی')).toBe(true)
  for (const guess of ['', '  ‌', 'کتاب', 'کتابخانه یا مدرسه', 'مدرسه']) {
    expect(isCorrectGuess(guess, 'کتابخانه')).toBe(false)
  }
  expect(normalizeGuess('  ‌')).toBe('')
  const round = { ...createRound(DEFAULT_CONFIG), word: { word: 'کتابخانه', category: 'مکان' as const } }
  expect(resolveRound(round, [], 'كتاب خانه')).toMatchObject({ winner: 'spies', reason: 'early-guess' })
  expect(resolveRound(round, round.spyIndices, 'كتاب خانه')).toMatchObject({ winner: 'spies', reason: 'last-guess' })
  expect(validateConfig({ ...DEFAULT_CONFIG, guessMode: 'challenge' })).toBeNull()
  expect(validateConfig({ ...DEFAULT_CONFIG, guessMode: 'invalid' as 'classic' })).not.toBeNull()
})

test('only a complete ballot of distinct spy seats counts as a catch', () => {
  const round = { ...createRound(DEFAULT_CONFIG), spyIndices: [1, 3] }
  expect(judgeAccusation(round, [3, 1])).toBe('caught')
  for (const accused of [[], [1], [1, 1], [1, 3, 3], [1, 2], [-1, 3], [1.5, 3], [NaN, 3]]) {
    expect(judgeAccusation(round, accused)).toBe('wrong-accusation')
  }
})

test('question decks exhaust distinct prompts and never repeat across the boundary', () => {
  let previous: string | undefined
  for (let cycle = 0; cycle < 50; cycle++) {
    const deck = createQuestionDeck(previous)
    expect(deck).toHaveLength(18)
    expect(new Set(deck).size).toBe(18)
    expect(new Set(deck)).toEqual(new Set(QUESTION_PROMPTS))
    expect(deck[0]).not.toBe(previous)
    previous = deck.at(-1)
  }
})
