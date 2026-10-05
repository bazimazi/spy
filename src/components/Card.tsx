import type { AnimationEvent, CSSProperties, PropsWithChildren } from 'react'

/** Most deck layers drawn behind the foreground card; deeper decks are capped. */
export const MAX_DECK_LAYERS = 8

interface CardProps {
  /** When true the card uses the lighter front outline (`#C1BBC5`). */
  variant?: 'front' | 'back'
  onClick?: () => void
  /** Extra class names for the foreground card (used to drive animations). */
  className?: string
  label?: string
  /** Deck layers still waiting behind the foreground card (0-`depth`). */
  layers?: number
  /** Layer count the deck is spaced for; stays fixed while the deck thins. */
  depth?: number
  /** Sound and haptic cue for a tap on an interactive card. */
  cue?: string
  /** Fires when a CSS animation on the foreground card ends. */
  onAnimationEnd?: (event: AnimationEvent<HTMLElement>) => void
}

/**
 * Visual card container based on the Figma deck (`Group 7` group): offset
 * rectangles painted behind a foreground card. The deepest possible layer
 * sits at the Figma offset (46, 30) and the others are spaced evenly between
 * it and the foreground at (0, 0). Spacing depends on `depth`, so layers keep
 * their places while the deck thins out from the back as cards are dealt.
 */
export function Card({
  variant = 'front',
  onClick,
  className,
  label,
  layers = 3,
  depth = 3,
  cue,
  onAnimationEnd,
  children,
}: PropsWithChildren<CardProps>) {
  const isInteractive = typeof onClick === 'function'
  const Element = isInteractive ? 'button' : 'div'
  const deckDepth = Math.max(1, Math.min(MAX_DECK_LAYERS, depth))
  const layerCount = Math.max(0, Math.min(deckDepth, layers))

  return (
    <div className="card-stack" style={{ '--deck-depth': deckDepth } as CSSProperties}>
      {/* Deepest layer first so each shallower layer paints over it. */}
      {Array.from({ length: layerCount }, (_, index) => layerCount - index).map((layer) => (
        <span key={layer} className="card-stack__layer" style={{ '--layer': layer } as CSSProperties} aria-hidden />
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
