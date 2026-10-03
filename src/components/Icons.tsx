/** Inline SVG icon set. Keeps the build asset-free and themable via currentColor. */
import type { HTMLAttributes, ImgHTMLAttributes, SVGProps } from 'react'

import playersSrc from '../assets/players.png'
import spiesSrc from '../assets/spies.png'
import timeSrc from '../assets/time.png'

type IconProps = SVGProps<SVGSVGElement>
type EmojiIconProps = HTMLAttributes<HTMLSpanElement>
type ImageIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>

const baseProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** Emoji icons rendered through the OS color emoji font so they keep their
 *  original multi-color glyph (used as a fallback for unstyled rows). */
function EmojiIcon({ children, className, ...rest }: EmojiIconProps) {
  return (
    <span
      role="img"
      aria-hidden
      className={`emoji-icon${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </span>
  )
}

/** Raster icon used by the home-screen settings rows — pulled straight from
 *  the Figma frame so the pixel artwork stays identical. */
function ImageIcon({ src, className, ...rest }: ImageIconProps & { src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`img-icon${className ? ` ${className}` : ''}`}
      {...rest}
    />
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function PlayersIcon(props: ImageIconProps) {
  return <ImageIcon src={playersSrc} {...props} />
}

export function SpyIcon(props: ImageIconProps) {
  return <ImageIcon src={spiesSrc} {...props} />
}

export function ClockIcon(props: ImageIconProps) {
  return <ImageIcon src={timeSrc} {...props} />
}

/** Kept for callers that still want the emoji version. */
export { EmojiIcon }

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m4.5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
