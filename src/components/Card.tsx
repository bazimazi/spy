import type { AnimationEvent, PropsWithChildren } from 'react'

interface CardProps {
  /** When true the card uses the lighter front outline (`#C1BBC5`). */
  variant?: 'front' | 'back'
  onClick?: () => void
  /** Extra class names for the foreground card (used to drive animations). */
  className?: string
  /** Fires when a CSS animation on the foreground card ends. */
  onAnimationEnd?: (event: AnimationEvent<HTMLElement>) => void
}

/**
 * Visual card container matching the "deck of three" look from Figma:
 * three offset rectangles painted behind a foreground card.
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
  onAnimationEnd,
  children,
}: PropsWithChildren<CardProps>) {
  const isInteractive = typeof onClick === 'function'
  const Element = isInteractive ? 'button' : 'div'

  return (
    <div className="card-stack" aria-hidden={false}>
      <span className="card-stack__layer card-stack__layer--3" aria-hidden />
      <span className="card-stack__layer card-stack__layer--2" aria-hidden />
      <span className="card-stack__layer card-stack__layer--1" aria-hidden />
      <Element
        type={isInteractive ? 'button' : undefined}
        onClick={onClick}
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
