import { useMemo } from 'react'
import type { CSSProperties } from 'react'

const COLORS = ['#f7a632', '#ffe1ae', '#ffffff', '#c9bdcf', '#ff8f8f', '#9fe3c0']

/** Decorative CSS confetti burst; positions are fixed per mount. */
export function Confetti({ count = 36 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    color: COLORS[i % COLORS.length],
    delay: `${Math.random() * 0.5}s`,
    duration: `${2.2 + Math.random() * 1.6}s`,
    drift: `${(Math.random() - 0.5) * 160}px`,
    spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
    size: `${6 + Math.random() * 6}px`,
  })), [count])
  return <div className="confetti" aria-hidden>
    {pieces.map((piece, i) => <span key={i} className="confetti__piece" style={{
      left: piece.left,
      background: piece.color,
      animationDelay: piece.delay,
      animationDuration: piece.duration,
      '--drift': piece.drift,
      '--spin': piece.spin,
      '--size': piece.size,
    } as CSSProperties} />)}
  </div>
}
