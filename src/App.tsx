import { useCallback, useEffect, useRef, useState } from 'react'
import { createRound, validateConfig } from './game/logic'
import { readPreferences, savePreferences } from './game/preferences'
import type { GameConfig, RoundState, Screen as ScreenName } from './game/types'
import { HomeScreen } from './screens/HomeScreen'
import { GuideScreen } from './screens/GuideScreen'
import { CountdownScreen } from './screens/CountdownScreen'
import { RevealScreen } from './screens/RevealScreen'
import { ReadyScreen } from './screens/ReadyScreen'
import { TimerScreen } from './screens/TimerScreen'
import { ResolutionScreen } from './screens/ResolutionScreen'
import { EndScreen } from './screens/EndScreen'

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home')
  const [config, setConfig] = useState<GameConfig>(readPreferences)
  const [round, setRound] = useState<RoundState | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [revealIndex, setRevealIndex] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const wordHistory = useRef<string[]>([])

  useEffect(() => savePreferences(config), [config])

  const patchConfig = (patch: Partial<GameConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
    setValidationError(null)
  }

  const startGame = useCallback(() => {
    const err = validateConfig(config)
    if (err) {
      setValidationError(err)
      return
    }
    const nextRound = createRound(config, wordHistory.current)
    wordHistory.current = nextRound.wordHistory
    setRound(nextRound)
    setRoundNumber((n) => n + 1)
    setRevealIndex(0)
    setTimedOut(false)
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

  if (screen === 'guide') return <GuideScreen onClose={() => setScreen('home')} />

  if (screen === 'reveal' && round) return <RevealScreen key={revealIndex}
    config={config} round={round} playerIndex={revealIndex} onHome={goHome}
    onNext={() => {
      if (revealIndex >= config.playerCount - 1) setScreen('ready')
      else setRevealIndex((i) => i + 1)
    }} />

  if (screen === 'ready' && round) return <ReadyScreen config={config} round={round}
    roundNumber={roundNumber} onStart={() => setScreen('countdown')} onHome={goHome} />

  if (screen === 'countdown') return <CountdownScreen onFinish={startTimer} onHome={goHome} />

  if (screen === 'timer') return <TimerScreen totalSeconds={config.minutes * 60} onFinish={finishDiscussion} onHome={goHome} />

  if (screen === 'resolution') return <ResolutionScreen timedOut={timedOut}
    onReveal={() => setScreen('end')} onHome={goHome} />

  if (screen === 'end' && round) return <EndScreen config={config} round={round}
    roundNumber={roundNumber} onPlayAgain={startGame} onHome={goHome} />

  return <HomeScreen config={config} setConfig={patchConfig} onStart={startGame}
    onOpenGuide={() => setScreen('guide')} validationError={validationError} />
}
