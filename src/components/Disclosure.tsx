import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const DURATION = 280
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

interface DisclosureProps {
  className: string
  summary: ReactNode
  children: ReactNode
  /** Controlled open state; leave out to let the disclosure manage itself. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * A native <details> whose body slides open and folds shut instead of snapping.
 * The element stays [open] until the fold finishes so the body is visible while it collapses.
 */
export function Disclosure({ className, summary, children, open: controlled, onOpenChange }: DisclosureProps) {
  const [uncontrolled, setUncontrolled] = useState(false)
  const open = controlled ?? uncontrolled
  const [shown, setShown] = useState(open)
  if (open && !shown) setShown(true)
  const rendered = open || shown
  const body = useRef<HTMLDivElement>(null)
  const animation = useRef<Animation>(undefined)
  const mounted = useRef(false)

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }

  // Drops the running or held animation and hands the body back to its stylesheet.
  const release = () => {
    const previous = animation.current
    animation.current = undefined
    previous?.cancel()
    if (body.current) body.current.style.overflow = ''
  }

  useLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const element = body.current
    if (!element) return
    // An interrupted fold continues from wherever it is now.
    const running = animation.current?.playState === 'running'
    const from = running || !open ? element.getBoundingClientRect().height : 0
    const fromOpacity = running ? Number(getComputedStyle(element).opacity) : open ? 0 : 1
    release()
    const to = open ? element.getBoundingClientRect().height : 0
    element.style.overflow = 'hidden'
    const current = element.animate(
      [{ height: `${from}px`, opacity: fromOpacity }, { height: `${to}px`, opacity: open ? 1 : 0 }],
      { duration: DURATION, easing: EASING, fill: 'forwards' },
    )
    animation.current = current
    current.onfinish = () => {
      if (animation.current !== current) return
      // A fold holds its collapsed frame until the element closes, so the body never flashes back.
      if (open) release()
      else setShown(false)
    }
  }, [open])

  // The element is closed by now, so the held fold can go without a visible frame.
  useLayoutEffect(() => { if (!rendered) release() }, [rendered])

  return (
    <details className={className} open={rendered}
      // Find-in-page can open the element on its own; follow it.
      onToggle={(event) => { if (event.currentTarget.open !== rendered) setOpen(event.currentTarget.open) }}>
      <summary onClick={(event) => { event.preventDefault(); setOpen(!open) }}>{summary}</summary>
      <div ref={body} className="disclosure__body">{children}</div>
    </details>
  )
}
