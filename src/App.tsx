import { useCallback, useEffect, useRef, useState } from 'react'
import { addRoundScore, createRound, emptyScore, judgeAccusation, resolveRound, scoreRound, validateConfig } from './game/logic'
import { readPreferences, savePreferences } from './game/preferences'
import { cue, setFeedbackPreferences, unlockAudio } from './game/feedback'
import type { Cue } from './game/feedback'
import type { GameConfig, RoundOutcome, RoundState, Screen as ScreenName, SessionScore } from './game/types'
import { HomeScreen } from './screens/HomeScreen'
import { GuideScreen } from './screens/GuideScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { CountdownScreen } from './screens/CountdownScreen'
import { RevealScreen } from './screens/RevealScreen'
import { ReadyScreen } from './screens/ReadyScreen'
import { TimerScreen } from './screens/TimerScreen'
import { ResolutionScreen } from './screens/ResolutionScreen'
import { VerdictScreen } from './screens/VerdictScreen'
import { GuessScreen } from './screens/GuessScreen'
import { EndScreen } from './screens/EndScreen'

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home')
  const [config, setConfig] = useState<GameConfig>(readPreferences)
  const [round, setRound] = useState<RoundState | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [revealIndex, setRevealIndex] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [accused, setAccused] = useState<number[]>([])
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [score, setScore] = useState<SessionScore>(() => emptyScore(config.playerCount))
  const [homeOptionsOpen, setHomeOptionsOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const wordHistory = useRef<string[]>([])
  const roundScored = useRef(false)

  useEffect(() => savePreferences(config), [config])
  useEffect(() => setFeedbackPreferences(config), [config])

  // Every button gets a tap sound and haptic; `data-cue` picks a different cue
  // and `data-cue="none"` leaves feedback to the screen.
  useEffect(() => {
    const onPointerDown = () => unlockAudio()
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.('button, summary, [data-cue]')
      if (!target || (target as HTMLButtonElement).disabled) return
      const name = target.getAttribute('data-cue') ?? 'tap'
      if (name !== 'none') cue(name as Cue)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  const patchConfig = (patch: Partial<GameConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
    setValidationError(null)
  }

  const startGame = useCallback(() => {
    const err = validateConfig(config)
    if (err) {
      setValidationError(err)
      cue('error')
      return
    }
    const nextRound = createRound(config, wordHistory.current)
    wordHistory.current = nextRound.wordHistory
    setRound(nextRound)
    setRoundNumber((n) => n + 1)
    setRevealIndex(0)
    setTimedOut(false)
    setAccused([])
    setOutcome(null)
    roundScored.current = false
    // Points follow seats, so a different table size starts a fresh scoreboard.
    setScore((s) => s.points.length === config.playerCount ? s : emptyScore(config.playerCount))
    setScreen('reveal')
  }, [config])

  const goHome = useCallback(() => {
    setScreen('home')
    setRound(null)
    setRevealIndex(0)
  }, [])

  const startTimer = useCallback(() => setScreen('timer'), [])
  const finishDiscussion = useCallback((expired: boolean) => {
    setTimedOut(expired)
    setScreen('resolution')
  }, [])

  const finishRound = (result: RoundOutcome) => {
    if (!round || roundScored.current) return
    roundScored.current = true
    const delta = scoreRound(round, result, config.playerCount)
    setOutcome(result)
    setScore((s) => addRoundScore(s, delta, result.winner))
    setScreen('end')
  }

  if (screen === 'guide') return <GuideScreen onClose={() => setScreen('home')} />

  if (screen === 'players') return <PlayersScreen config={config} setConfig={patchConfig}
    onClose={() => setScreen('home')} />

  if (screen === 'reveal' && round) return <RevealScreen key={revealIndex}
    config={config} round={round} playerIndex={revealIndex} onHome={goHome}
    onNext={() => {
      if (revealIndex >= config.playerCount - 1) setScreen('ready')
      else setRevealIndex((i) => i + 1)
    }} />

  if (screen === 'ready' && round) return <ReadyScreen config={config} round={round}
    roundNumber={roundNumber} onStart={() => setScreen('countdown')} onHome={goHome} />

  if (screen === 'countdown') return <CountdownScreen onFinish={startTimer} onHome={goHome} />

  if (screen === 'timer') return <TimerScreen totalSeconds={config.minutes * 60} onFinish={finishDiscussion}
    onSpyGuess={() => { setAccused([]); setScreen('guess') }} onHome={goHome} />

  if (screen === 'resolution') return <ResolutionScreen config={config} timedOut={timedOut}
    onAccuse={(seats) => { setAccused(seats); setScreen('verdict') }}
    onReveal={() => { setOutcome(null); setScreen('end') }} onHome={goHome} />

  if (screen === 'verdict' && round) return <VerdictScreen config={config} round={round} accused={accused}
    onContinue={() => {
      if (judgeAccusation(round, accused) === 'caught') setScreen('guess')
      else finishRound(resolveRound(round, accused))
    }} onHome={goHome} />

  if (screen === 'guess' && round) return <GuessScreen config={config} round={round} accused={accused}
    onGuess={(word) => finishRound(resolveRound(round, accused, word))} onHome={goHome} />

  if (screen === 'end' && round) return <EndScreen config={config} round={round} outcome={outcome}
    score={score} roundNumber={roundNumber} onPlayAgain={startGame} onHome={goHome} />

  return <HomeScreen config={config} setConfig={patchConfig} onStart={startGame}
    onOpenGuide={() => setScreen('guide')} onOpenPlayers={() => setScreen('players')}
    optionsOpen={homeOptionsOpen} onOptionsToggle={setHomeOptionsOpen} validationError={validationError} />
}
