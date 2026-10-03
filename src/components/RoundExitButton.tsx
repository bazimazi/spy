import { useState } from 'react'
import { HomeIcon } from './Icons'
import { ConfirmDialog } from './ConfirmDialog'

export function RoundExitButton({ onExit, onRequest }: { onExit: () => void; onRequest?: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return <>
    <button type="button" className="icon-btn" aria-label="لغو دور و بازگشت به خانه"
      onClick={() => { onRequest?.(); setConfirming(true) }}><HomeIcon /></button>
    {confirming && <ConfirmDialog title="این دور لغو شود؟"
      description="با برگشتن به خانه، این دور تمام می‌شود. دور بعد با کارت‌های تازه شروع می‌شود."
      confirmLabel="لغو دور و رفتن به خانه" onConfirm={onExit} onCancel={() => setConfirming(false)} />}
  </>
}
