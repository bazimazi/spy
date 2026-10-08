import { useEffect, useRef } from 'react'
import { useBackButton } from '../platform/native'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, description, confirmLabel, cancelLabel = 'ادامه‌ی بازی', onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef(document.activeElement as HTMLElement | null)
  const unmounting = useRef(false)
  useBackButton(onCancel)
  useEffect(() => {
    const dialog = ref.current!
    unmounting.current = false
    dialog.showModal()
    return () => {
      unmounting.current = true
      dialog.close()
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      // Browsers may close a modal without a cancelable `cancel` event (e.g. a repeated
      // Escape); treat that as cancelling so the parent state never keeps a closed dialog.
      onClose={() => { if (!unmounting.current && !ref.current?.open) onCancel() }}>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      <div className="stack">
        <button type="button" className="btn" autoFocus onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="btn btn--ghost" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  )
}
