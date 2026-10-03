export type Screen =
  | 'home'
  | 'guide'
  | 'countdown'
  | 'reveal'
  | 'ready'
  | 'timer'
  | 'resolution'
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
