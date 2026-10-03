import type { PropsWithChildren, ReactNode } from 'react'
import wallSrc from '../assets/wall.svg'

interface ScreenProps {
  /** Optional content rendered in the absolute top-right corner (icons). */
  topActions?: ReactNode
  /** Optional artwork rendered behind the main content (above the wall pattern). */
  background?: ReactNode
}

/**
 * Mobile-style screen frame with a decorative wall background.
 * Centers a 360px-wide artboard on larger screens.
 */
export function Screen({ topActions, background, children }: PropsWithChildren<ScreenProps>) {
  return (
    <div className="screen" style={{ backgroundImage: `url(${wallSrc})` }}>
      {background ? <div className="screen__bg">{background}</div> : null}
      {topActions ? <div className="top-actions">{topActions}</div> : null}
      <div className="content">{children}</div>
    </div>
  )
}
