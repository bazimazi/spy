import type { AnimationEvent, PropsWithChildren } from 'react'

interface CardProps {
  /** When true the card uses the lighter front outline (`#C1BBC5`). */
  variant?: 'front' | 'back'
  onClick?: () => void
  /** Extra class names for the foreground card (used to drive animations). */
  className?: string
  label?: string
  /** Deck layers still waiting behind the foreground card (0-3). */
  layers?: number
  /** Sound and haptic cue for a tap on an interactive card. */
  cue?: string
  /** Fires when a CSS animation on the foreground card ends. */
  onAnimationEnd?: (event: AnimationEvent<HTMLElement>) => void
}

/**
 * Visual card container matching the "deck of three" look from Figma:
 * three offset rectangles painted behind a foreground card. The deck thins
 * out as the last cards are dealt.
 *
 * Coordinates come straight from the Figma frames (`Group 7` group):
 *   Rectangle 5 → (46, 30)   ← deepest card
 *   Rectangle 6 → (28, 20)
 *   Rectangle 4 → (10, 10)
 *   Foreground  → (0, 0)
 */
export function Card({
  variant = 'front',
  onClick,
  className,
  label,
  layers = 3,
  cue,
  onAnimationEnd,
  children,
}: PropsWithChildren<CardProps>) {
  const isInteractive = typeof onClick === 'function'
  const Element = isInteractive ? 'button' : 'div'

  return (
    <div className="card-stack">
      {[3, 2, 1].filter((layer) => layer <= layers).map((layer) => (
        <span key={layer} className={`card-stack__layer card-stack__layer--${layer}`} aria-hidden />
      ))}
      <Element
        type={isInteractive ? 'button' : undefined}
        onClick={onClick}
        aria-label={label}
        data-cue={isInteractive ? cue : undefined}
        onAnimationEnd={onAnimationEnd}
        className={`card card--${variant}${isInteractive ? ' is-interactive' : ''}${
          className ? ` ${className}` : ''
        }`}
      >
        {children}
      </Element>
    </div>
  )
}
