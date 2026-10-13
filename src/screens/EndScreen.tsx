import { Fragment, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { GameplayScreen } from '../components/GameplayScreen'
import { Confetti } from '../components/Confetti'
import { Disclosure } from '../components/Disclosure'
import { playerName, toFa } from '../game/logic'
import { cue } from '../game/feedback'
import type { GameConfig, OutcomeReason, RoundOutcome, RoundState, SessionScore } from '../game/types'
import spyHeroSrc from '../assets/logo.svg'

interface EndScreenProps {
  config: GameConfig
  round: RoundState
  /** Null when the group skipped the in-app vote and settled the round itself. */
  outcome: RoundOutcome | null
  score: SessionScore
  onPlayAgain: () => void
  onHome: () => void
  roundNumber: number
}

interface ReasonContext {
  severalSpies: boolean
  /** Citizens among the accused. */
  innocents: number
}

/** Each reason agrees with how many spies were caught or citizens accused. */
const REASONS: Record<OutcomeReason, (context: ReasonContext) => string> = {
  caught: ({ severalSpies }) => severalSpies
    ? 'جاسوس‌ها گیر افتادند و کلمه رو اشتباه حدس زدند.' : 'جاسوس گیر افتاد و کلمه رو اشتباه حدس زد.',
  'wrong-accusation': ({ innocents }) => innocents > 1
    ? `جمع ${toFa(innocents)} شهروند بی‌گناه رو متهم کرد.` : 'جمع یک شهروند بی‌گناه رو متهم کرد.',
  'last-guess': ({ severalSpies }) => severalSpies
    ? 'جاسوس‌ها گیر افتادند، ولی کلمه رو درست حدس زدند!' : 'جاسوس گیر افتاد، ولی کلمه رو درست حدس زد!',
  'early-guess': () => 'جاسوس وسط گفت‌وگو کلمه رو درست حدس زد!',
  'early-miss': () => 'جاسوس وسط گفت‌وگو حدس زد و اشتباه کرد.',
}

export function EndScreen({ config, round, outcome, score, roundNumber, onPlayAgain, onHome }: EndScreenProps) {
  const spyNames = round.spyIndices.map((idx) => playerName(config.names, idx))
  const spyLabel = spyNames.length > 1 ? 'جاسوس‌ها' : 'جاسوس'
  const scored = score.wins.citizens + score.wins.spies > 0

  useEffect(() => {
    cue(!outcome ? 'ding' : outcome.winner === 'citizens' ? 'win' : 'lose')
  }, [outcome])

  return (
    <GameplayScreen className={`end-screen${outcome ? ` has-outcome is-${outcome.winner}` : ''}`} onHome={onHome} roundComplete>
      {outcome && <Confetti />}
      <h1 className="visually-hidden" tabIndex={-1} data-screen-title>پایان دور {toFa(roundNumber)}</h1>
      <div className="play-focus">
        {outcome && <div className="end-banner" role="status">
          <p className="end-banner__title">{outcome.winner === 'citizens' ? 'شهروندها بردند!' : 'جاسوس‌ها بردند!'}</p>
          <p className="end-banner__reason">{REASONS[outcome.reason]({
            severalSpies: spyNames.length > 1,
            innocents: outcome.accused.filter((seat) => !round.spyIndices.includes(seat)).length,
          })}</p>
        </div>}
        <div className="end-hero-wrap">
          <span className="end-hero-glow" aria-hidden />
          <img src={spyHeroSrc} alt="" className="end-hero" aria-hidden="true" />
        </div>

        <div className="end-results">
          <p className="end-reveal" style={{ '--i': 0 } as CSSProperties}>
            {spyLabel}:{' '}
            <strong className="end-reveal__value">{spyNames.map((name, index) => <Fragment key={index}>
              {index > 0 && '، '}<bdi className="name">{name}</bdi>
            </Fragment>)}</strong>
          </p>
          <p className="end-reveal" style={{ '--i': 1 } as CSSProperties}>
            کلمه: <strong className="end-reveal__value">{round.word.word}</strong>
          </p>
          {outcome?.guess && <p className="end-reveal end-reveal--guess" style={{ '--i': 2 } as CSSProperties}>
            حدس جاسوس: <strong className={outcome.guess === round.word.word ? 'is-right' : 'is-wrong'}>{outcome.guess}</strong>
          </p>}
        </div>
        {scored && <p className="end-tally">
          <span>شهروندها <b>{toFa(score.wins.citizens)}</b></span>
          <span className="end-tally__sep" aria-hidden>–</span>
          <span><b>{toFa(score.wins.spies)}</b> جاسوس‌ها</span>
        </p>}
        <Disclosure className="all-roles" summary={`نقش همه‌ی بازیکن‌ها${scored ? ' و امتیازها' : ''}`}>
          <p className="play-meta">موضوع: {round.word.category}</p>
          <ul className="role-list" tabIndex={0} aria-label="نقش همه‌ی بازیکن‌ها">
            {Array.from({ length: config.playerCount }, (_, index) => {
              const isSpy = round.spyIndices.includes(index)
              const delta = outcome ? score.lastDelta[index] ?? 0 : 0
              return <li key={index} className={`role-row ${isSpy ? 'is-spy' : ''}`}>
                <span className="role-row__name" dir="auto">{playerName(config.names, index)}</span>
                <span className="role-row__meta">
                  {delta > 0 && <span className="role-row__delta" dir="ltr">+{toFa(delta)}</span>}
                  {scored && <span className="role-row__points">{toFa(score.points[index] ?? 0)} امتیاز</span>}
                  <span className="role-row__tag">{isSpy ? 'جاسوس' : 'شهروند'}</span>
                </span>
              </li>
            })}
          </ul>
        </Disclosure>
      </div>

      <div className="footer-actions">
        <button type="button" className="btn btn--glow" data-cue="none" onClick={(event) => {
          // The previous screen's action sat here; the second tap of a double tap must not
          // deal a new round before anyone has seen the result (the CSS also hides it briefly).
          if (event.detail > 1) return
          cue('deal')
          onPlayAgain()
        }}>
          دوباره بزن بریم!
        </button>
      </div>
    </GameplayScreen>
  )
}
