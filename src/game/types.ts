export type Screen =
  | 'home'
  | 'guide'
  | 'countdown'
  | 'reveal'
  | 'timer'
  | 'end'

export interface GameConfig {
  /** Total number of players (citizens + spies). */
  playerCount: number
  /** Number of spies among the players. */
  spyCount: number
  /** Round duration in minutes. */
  minutes: number
  /** Whether spies see the category as a hint. */
  spyGuide: boolean
}

export interface SecretWord {
  word: string
  category: string
}

export interface RoundState {
  word: SecretWord
  /** Sorted player indices (0-based) that received the spy role. */
  spyIndices: number[]
}
