import type { PropsWithChildren } from 'react'
import { Screen } from './Screen'
import { HomeIcon } from './Icons'
import { RoundExitButton } from './RoundExitButton'
import { useBackButton } from '../platform/native'

interface GameplayScreenProps {
  className?: string
  onHome: () => void
  onRequestHome?: () => void
  onCancelHome?: () => void
  roundComplete?: boolean
}

/** Shared frame for the original stopwatch and result artboards. */
export function GameplayScreen({ className = '', onHome, onRequestHome, onCancelHome,
  roundComplete = false, children }: PropsWithChildren<GameplayScreenProps>) {
  // Unfinished rounds route back through RoundExitButton's confirmation instead.
  useBackButton(onHome, roundComplete)
  return <Screen className={`play-screen ${className}`} topActions={roundComplete
    ? <button type="button" className="icon-btn" aria-label="خانه" onClick={onHome}><HomeIcon /></button>
    : <RoundExitButton onExit={onHome} onRequest={onRequestHome} onCancel={onCancelHome} />}>
    {children}
  </Screen>
}
