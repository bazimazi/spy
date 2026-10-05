import type { CSSProperties } from 'react'
import { Screen } from '../components/Screen'
import { ChevronRightIcon } from '../components/Icons'
import { MAX_NAME_LENGTH, toFa } from '../game/logic'
import type { GameConfig } from '../game/types'
import { useBackButton } from '../platform/native'

interface PlayersScreenProps {
  config: GameConfig
  setConfig: (patch: Partial<GameConfig>) => void
  onClose: () => void
}

/** Optional seat names; cards, the vote, and the scoreboard use them. */
export function PlayersScreen({ config, setConfig, onClose }: PlayersScreenProps) {
  useBackButton(onClose)
  const rename = (seat: number, name: string) => {
    const names = Array.from({ length: Math.max(config.names.length, seat + 1) }, (_, i) => config.names[i] ?? '')
    names[seat] = name.slice(0, MAX_NAME_LENGTH)
    // Trailing blanks carry no information; keep the stored list short.
    while (names.length && !names.at(-1)!.trim()) names.pop()
    setConfig({ names })
  }

  return (
    <Screen className="players-screen" topActions={
      <button type="button" className="icon-btn" aria-label="بازگشت" onClick={onClose}>
        <ChevronRightIcon />
      </button>
    }>
      <h1 className="title" tabIndex={-1} data-screen-title style={{ textAlign: 'center', marginBottom: 8 }}>
        نام بازیکن‌ها
      </h1>
      <p className="subtitle players-intro">به ترتیبی که گوشی دست‌به‌دست می‌شه. خالی بمونه، «بازیکن N» نوشته می‌شه.</p>
      <div className="scroll-area">
        <ol className="name-list">
          {Array.from({ length: config.playerCount }, (_, seat) => (
            <li key={seat} className="name-row" style={{ '--i': seat } as CSSProperties}>
              <span className="name-row__seat" aria-hidden>{toFa(seat + 1)}</span>
              <input type="text" value={config.names[seat] ?? ''} maxLength={MAX_NAME_LENGTH}
                placeholder={`بازیکن ${toFa(seat + 1)}`} aria-label={`نام بازیکن ${toFa(seat + 1)}`}
                autoComplete="off" enterKeyHint={seat === config.playerCount - 1 ? 'done' : 'next'}
                onChange={(event) => rename(seat, event.target.value)} />
            </li>
          ))}
        </ol>
      </div>
      <div className="footer-actions stack">
        <button type="button" className="btn" onClick={onClose}>ذخیره</button>
        {config.names.some((name) => name.trim()) && (
          <button type="button" className="text-btn" onClick={() => setConfig({ names: [] })}>پاک کردن همه‌ی نام‌ها</button>
        )}
      </div>
    </Screen>
  )
}
