export type Screen =
  | 'home'
  | 'guide'
  | 'players'
  | 'countdown'
  | 'reveal'
  | 'ready'
  | 'timer'
  | 'resolution'
  | 'verdict'
  | 'guess'
  | 'end'

export type WordCategory = 'مکان' | 'تفریح' | 'غذا' | 'ورزش' | 'اشیا'

export interface GameConfig {
  /** Total number of players (citizens + spies). */
  playerCount: number
  /** Number of spies among the players. */
  spyCount: number
  /** Round duration in minutes. */
  minutes: number
  /** Whether spies see the category as a hint. */
  spyGuide: boolean
  category: WordCategory | 'all'
  /** Optional names by seat; blank entries fall back to «بازیکن N». */
  names: string[]
  /** Synthesized sound effects. */
  sound: boolean
  /** Haptic feedback on supported devices. */
  vibration: boolean
}

export interface SecretWord {
  word: string
  category: WordCategory
}

export interface RoundState {
  word: SecretWord
  /** Sorted player indices (0-based) that received the spy role. */
  spyIndices: number[]
  startingPlayerIndex: number
  wordHistory: string[]
}

export type OutcomeReason =
  /** Every spy was accused, then the spy's last-chance guess missed. */
  | 'caught'
  /** The group accused at least one citizen. */
  | 'wrong-accusation'
  /** Every spy was accused, but the last-chance guess was right. */
  | 'last-guess'
  /** A spy stopped the discussion and guessed the word correctly. */
  | 'early-guess'
  /** A spy stopped the discussion and guessed wrong. */
  | 'early-miss'

export interface RoundOutcome {
  winner: 'citizens' | 'spies'
  reason: OutcomeReason
  /** Accused seats, empty when a spy guessed during the discussion. */
  accused: number[]
  guess?: string
}

export interface SessionScore {
  /** Points by seat, kept while the number of players stays the same. */
  points: number[]
  /** Points earned in the latest scored round, by seat. */
  lastDelta: number[]
  wins: { citizens: number; spies: number }
}
