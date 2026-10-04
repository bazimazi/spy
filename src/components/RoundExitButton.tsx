import { useState } from 'react'
import { HomeIcon } from './Icons'
import { ConfirmDialog } from './ConfirmDialog'
import { useBackButton } from '../platform/native'

export function RoundExitButton({ onExit, onRequest, onCancel }: {
  onExit: () => void; onRequest?: () => void; onCancel?: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const request = () => { onRequest?.(); setConfirming(true) }
  useBackButton(request, !confirming)
  return <>
    <button type="button" className="icon-btn" aria-label="لغو دور و بازگشت به خانه"
      onClick={request}><HomeIcon /></button>
    {confirming && <ConfirmDialog title="این دور لغو شود؟"
      description="با برگشتن به خانه، این دور تمام می‌شود. دور بعد با کارت‌های تازه شروع می‌شود."
      confirmLabel="لغو دور و رفتن به خانه" onConfirm={onExit}
      onCancel={() => { setConfirming(false); onCancel?.() }} />}
  </>
}
