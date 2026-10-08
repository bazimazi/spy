import { useState } from 'react'
import { createQuestionDeck } from '../game/questions'
import { toFa } from '../game/logic'

export function QuestionPrompt() {
  const [state, setState] = useState(() => ({ deck: createQuestionDeck(), index: 0 }))
  const prompt = state.deck[state.index]
  const next = () => setState((current) => current.index + 1 < current.deck.length
    ? { ...current, index: current.index + 1 }
    : { deck: createQuestionDeck(current.deck[current.index]), index: 0 })

  return <section className="question-prompt" aria-label="ایده برای سؤال">
    <div className="question-prompt__header">
      <span>برای سؤال بعدی</span>
      <span className="question-prompt__count">{toFa(state.index + 1)} / {toFa(state.deck.length)}</span>
    </div>
    <p className="question-prompt__text" role="status"><span key={prompt}>«{prompt}»</span></p>
    <button type="button" className="text-btn" data-cue="select" onClick={next}>یک سؤال دیگه</button>
    <p className="play-note">این فقط یک ایده‌ست؛ سؤال خودتون رو بپرسید. خود کلمه، تعداد حرف‌ها و بخش‌هاش رو نگویید.</p>
  </section>
}
