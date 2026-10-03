import { useEffect, useRef } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import wallSrc from '../assets/wall.svg'

interface ScreenProps {
  /** Optional content rendered in the absolute top-right corner (icons). */
  topActions?: ReactNode
  /** Optional artwork rendered behind the main content (above the wall pattern). */
  background?: ReactNode
  className?: string
}

/**
 * Mobile-style screen frame with a decorative wall background.
 * Centers a 360px-wide artboard on larger screens.
 */
export function Screen({ topActions, background, className = '', children }: PropsWithChildren<ScreenProps>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-screen-title]')?.focus({ preventScroll: true })
  }, [])
  return (
    <div ref={ref} className={`screen ${className}`} style={{ backgroundImage: `url(${wallSrc})` }}>
      {background ? <div className="screen__bg">{background}</div> : null}
      {topActions ? <div className="top-actions">{topActions}</div> : null}
      <main className="content">{children}</main>
    </div>
  )
}
