import { useEffect, useRef } from 'react'
import { useBackButton } from '../platform/native'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef(document.activeElement as HTMLElement | null)
  useBackButton(onCancel)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => {
      dialog.close()
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description"
      onCancel={(event) => { event.preventDefault(); onCancel() }}>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      <div className="stack">
        <button type="button" className="btn" autoFocus onClick={onCancel}>ادامه‌ی بازی</button>
        <button type="button" className="btn btn--ghost" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  )
}
