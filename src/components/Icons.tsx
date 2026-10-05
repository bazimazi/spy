/** Inline SVG icon set. Keeps the build asset-free and themable via currentColor. */
import type { HTMLAttributes, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>
type EmojiIconProps = HTMLAttributes<HTMLSpanElement>

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

/** Solid glyph used by the home-screen settings rows. Vector redraw of the
 *  Figma artwork so it stays sharp at any size and pixel density. */
function SettingIcon({ className, children, ...rest }: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={`setting-icon${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="M8 5v14M16 5v14" strokeWidth={3} /></svg>
}

export function PlayIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" /></svg>
}

export function PlayersIcon(props: IconProps) {
  return (
    <SettingIcon {...props}>
      <path
        fillRule="evenodd"
        d="M1.5 8.8v-1a4.5 4.5 0 0 1 9 0v1h-.75v-1a3.75 3.75 0 0 0-7.5 0v1zM2.7 8a3.3 3.3 0 1 0 6.6 0 3.3 3.3 0 1 0-6.6 0zm1.45-.4a.65.65 0 1 0 1.3 0 .65.65 0 1 0-1.3 0zm2.4 0a.65.65 0 1 0 1.3 0 .65.65 0 1 0-1.3 0zM4.6 9.1q1.4 1.5 2.8 0-1.4.7-2.8 0zM1 22.4v-3.6c0-3.3 2.2-6 5-6s5 2.7 5 6v3.6H9.4v-3.8h-.8v3.8H3.4v-3.8h-.8v3.8zM13.5 11.4V7.8a4.5 4.5 0 0 1 9 0v3.6h-.75V7.8a3.75 3.75 0 0 0-7.5 0v3.6zM14.7 8a3.3 3.3 0 1 0 6.6 0 3.3 3.3 0 1 0-6.6 0zm1.45-.4a.65.65 0 1 0 1.3 0 .65.65 0 1 0-1.3 0zm2.4 0a.65.65 0 1 0 1.3 0 .65.65 0 1 0-1.3 0zm-1.95 1.5q1.4 1.5 2.8 0-1.4.7-2.8 0zM13 22.4v-3.6c0-3.3 2.2-6 5-6s5 2.7 5 6v3.6h-1.6v-3.8h-.8v3.8h-5.2v-3.8h-.8v3.8z"
      />
    </SettingIcon>
  )
}

export function SpyIcon(props: IconProps) {
  return (
    <SettingIcon {...props}>
      <path d="M6.2 11.2 7.5 4.2c.25-1.2 1.4-1.85 2.5-1.4l2 .8 2-.8c1.1-.45 2.25.2 2.5 1.4l1.3 7zm-5-.8c1.6 1.5 5.6 2.2 10.8 2.2s9.2-.7 10.8-2.2c-.6 2.9-4.9 3.9-10.8 3.9S1.8 13.3 1.2 10.4z" />
      <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <circle cx="7.5" cy="18.6" r="3" />
        <circle cx="16.5" cy="18.6" r="3" />
        <path d="M10.5 18.3c1-.8 2-.8 3 0" />
      </g>
    </SettingIcon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <SettingIcon {...props}>
      <path d="M4.56 8.68A3.7 3.7 0 1 1 8.6 5.1a8.6 8.6 0 0 0-4.04 3.58zm14.88 0A3.7 3.7 0 1 0 15.4 5.1a8.6 8.6 0 0 1 4.04 3.58zM11 2.9h2v1.5h-2zm-.6-1.6h3.2a1 1 0 0 1 0 2h-3.2a1 1 0 0 1 0-2z" />
      <path
        fillRule="evenodd"
        d="M4.6 13a7.4 7.4 0 1 0 14.8 0 7.4 7.4 0 1 0-14.8 0zm6.5-3.8a.9.9 0 0 1 1.8 0v3.4h2.4a.9.9 0 0 1 0 1.8H12a.9.9 0 0 1-.9-.9z"
      />
      <path d="M7.2 19.4 5.3 21.9m11.5-2.5 1.9 2.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </SettingIcon>
  )
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

export function SoundOnIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  )
}

export function SoundOffIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </svg>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 13.6A5.5 5.5 0 0 1 20.5 19" />
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
