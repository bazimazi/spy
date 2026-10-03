import { useMemo, useState } from 'react'
import { createRound, validateConfig } from './game/logic'
import type { GameConfig, RoundState, Screen as ScreenName } from './game/types'
import { HomeScreen } from './screens/HomeScreen'
import { GuideScreen } from './screens/GuideScreen'
import { CountdownScreen } from './screens/CountdownScreen'
import { RevealScreen } from './screens/RevealScreen'
import { TimerScreen } from './screens/TimerScreen'
import { EndScreen } from './screens/EndScreen'

const defaultConfig: GameConfig = {
  playerCount: 5,
  spyCount: 1,
  minutes: 5,
  spyGuide: false,
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home')
  const [config, setConfig] = useState<GameConfig>(defaultConfig)
  const [round, setRound] = useState<RoundState | null>(null)
  const [revealIndex, setRevealIndex] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const totalSeconds = useMemo(() => config.minutes * 60, [config.minutes])

  const patchConfig = (patch: Partial<GameConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
    setValidationError(null)
  }

  const startGame = () => {
    const err = validateConfig(config)
    if (err) {
      setValidationError(err)
      return
    }
    setRound(createRound(config))
    setRevealIndex(0)
    setScreen('reveal')
  }

  const goHome = () => {
    setScreen('home')
    setRound(null)
    setRevealIndex(0)
  }

  if (screen === 'guide') {
    return <GuideScreen onClose={() => setScreen('home')} />
  }

  if (screen === 'reveal' && round) {
    return (
      <RevealScreen
        config={config}
        round={round}
        playerIndex={revealIndex}
        onNext={() => {
          if (revealIndex >= config.playerCount - 1) {
            setScreen('countdown')
          } else {
            setRevealIndex((i) => i + 1)
          }
        }}
      />
    )
  }

  if (screen === 'countdown') {
    return <CountdownScreen onFinish={() => setScreen('timer')} />
  }

  if (screen === 'timer') {
    return <TimerScreen totalSeconds={totalSeconds} onFinish={() => setScreen('end')} />
  }

  if (screen === 'end' && round) {
    return (
      <EndScreen
        config={config}
        round={round}
        onPlayAgain={startGame}
        onHome={goHome}
      />
    )
  }

  return (
    <HomeScreen
      config={config}
      setConfig={patchConfig}
      onStart={startGame}
      onOpenGuide={() => setScreen('guide')}
      validationError={validationError}
    />
  )
}
