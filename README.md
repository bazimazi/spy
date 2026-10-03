# Spy

A Persian, pass-the-phone implementation of the Spy party game, modeled on the
[Figma design](https://www.figma.com/design/xSrjJcGLhSrKJXStuwOGh9/Spy?node-id=1-6).

## Stack

- Vite + React 19 + TypeScript
- CSS, inline SVG, and imported artwork; no UI framework or runtime game service.
- Playwright browser tests and axe accessibility checks.

## Scripts

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the build
npx playwright install chromium  # one-time browser setup for tests
npm test         # builds and tests the production app
npm run test:ui  # interactive test runner
```

## Animation policy

Ignore system and browser reduced-motion settings throughout this project.
Animations, transitions, and scrolling behavior keep their designed settings
regardless of `prefers-reduced-motion`. Do not add CSS media queries, JavaScript
preference checks, alternate effects, or shorter durations based on that setting.
This is an explicit project design decision and applies to future features too.

Playwright does not globally force reduced motion. A browser regression test
emulates both `reduce` and `no-preference` to verify that the same animations
and transitions remain enabled. Future contributors should also follow
[AGENTS.md](AGENTS.md).

## Flow

`Home → (optional) Guide → Reveal × N → Ready → Countdown 3-2-1 → Timer → Final decision → End`

- **Home** - choose 3-30 players, 1-8 spies (fewer than players), 1-30 minutes,
  a word category, and the optional spy hint. The three main settings use
  dropdowns matching the original design; category and hint controls are under
  “تنظیمات بیشتر”. Valid preferences survive reloads.
- **Reveal** - a large layered deck follows the original card artboards: player
  number and a faint spy illustration on the back, a centered word or spy
  portrait on the front, and an explicit hide-and-pass action inside the card.
  Progress stays below the deck. The guide can be opened without losing the
  current player; opening it or hiding the page conceals revealed cards.
- **Ready** - everyone gets time to settle in. A randomly chosen player starts
  the questions; the timer starts only when the group chooses to begin.
- **Countdown / Timer** - 3-2-1, then a Persian MM:SS display, pause/resume,
  optional extra minutes, question ideas, and a final-ten-seconds warning.
- **Final decision** - both time expiry and early completion leave secrets
  hidden while the group votes and hears the spy's final guess.
- **End** - explicitly reveal the word and spies, inspect every role, and
  start another round with the same settings and a fresh word.

## Player experience review (2026-10-03)

The review combined a full source/state-machine audit, baseline browser
screenshots, scenario testing, primary design/accessibility guidance, and
comparison with related social deduction games. This is an expert review,
not an observed study of real players: improvements to enjoyment and balance
are hypotheses until tested with groups.

The strongest part of the original game was its quick setup, Persian identity,
and card artwork. The implementation keeps those and addresses friction around
them. Findings were prioritized by their ability to spoil a round or interrupt
the group, followed by replay variety and reading comfort.

| Priority | Observed issue | Implemented response |
| --- | --- | --- |
| High | The timer immediately exposed the word and spies, removing the chance for a final vote or guess. | A separate decision phase before an explicit reveal. The [publisher's Spyfall rules](https://cdn.shopify.com/s/files/1/0464/6961/1676/files/Spyfall1_Rules_compressed.pdf?v=1721920618) also distinguish time expiry from voting; this game's word-based, multiple-spy rules remain its own variant. |
| High | The same card interaction revealed and passed a role, and secrets remained on screen during the outgoing animation. | Separate reveal/hide actions, immediate secret removal, player progress, and concealment on page hiding. This applies [Nielsen's error-prevention and system-status guidance](https://www.nngroup.com/articles/ten-usability-heuristics/) to the costliest mistakes. |
| High | The last card automatically started the countdown; players had no pause control. | An untimed ready screen, explicit start, pause/resume, optional extensions, and safe early completion. [Xbox's guidance on UI time limits](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/116) supports time to read setup instructions; its exemption for core gameplay timers is respected. |
| Medium | Only 19 words were drawn with replacement. | 100 familiar Persian words in five categories; no repeats within the selected pool during a session, and no immediate repeat when the pool resets. With the original uniform draw, the calculated chance of at least one repeat in five rounds was about 44%. |
| Medium | The guide explained goals but left the first question and transition to discussion vague. | A random starting player, practical question examples, and a concise guide matching the actual screens. [Undercover's own rules](https://www.yanstarstudio.com/undercover-how-to-play) offer a useful comparison for private cards and a designated first speaker; its different roles and elimination system were not adopted. |
| Medium | Small steppers, identical accessible names, weak amber-button contrast, and a visually busy background made interaction harder. | 44px controls, contextual labels, valid selection ranges, visible keyboard focus, subdued backgrounds during play, and dark primary-button text. Contrast improved from 2.01:1 to 8.21:1. See [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and the [44px enhanced target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). This is a design target, not a claim of full WCAG conformance. |
| Medium | Settings reset on reload; countdown updates ran every animation frame and were continuously announced. | Validated preference storage, a deadline-based clock, updates at most four times per second, and announcements for meaningful status changes instead of every tick. |

Browser timing decisions are grounded in [MDN's Page Visibility documentation](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API):
background tabs can suspend animation frames and throttle timers. The clock
recalculates from a deadline and catches up when visible; it continues while
the page is hidden unless explicitly paused. It uses `Date.now()` because
[MDN documents cross-platform sleep differences in `performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now).
An optional [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
keeps the display awake during active discussion when the browser allows it.
Unsupported browsers, insecure contexts, and power-saving rejection fall back
without blocking play.

### Verification and limits

`npm test` builds the production app and starts an isolated preview on
`127.0.0.1:5191`. The 20 tests cover supported role counts, two complete word-pool
cycles, category switching, corrupt/denied storage, rapid taps, private
handoffs, keyboard navigation, dialog cancellation/focus, pause/resume,
extensions, delayed timer callbacks, timeout and early-end privacy, rematches,
guide access during a private handoff, citizen and spy cards, denied wake locks,
and unchanged animation behavior under both system motion preferences. Axe
checks the major screens and a confirmation dialog after card entrances finish.
Screenshots are generated for 320×568, 360×740, 363×692 (the supplied reference
size), 390×844, 740×360, and 1280×800; layout checks include horizontal overflow,
reachable start and handoff controls, artwork placement, and card-text clipping.

Secrets and word history stay in memory. Reloading resets a live round and
its word history; only preferences persist. Voting and victory decisions are
handled by the group. Real iOS/Android screen-lock behavior, screen readers,
and social balance still need device and group playtesting. Browsers may deny
wake locks. Gameplay needs no server once loaded, but offline reload/install
support is not implemented.

The next useful research is three Persian-speaking groups (new and experienced
players, 3-8 people), playing several rounds each. Record setup time, requests
for explanation, accidental reveals, pauses, unclear questions, perceived
fairness/enjoyment, and voluntary rematches. Use that evidence to prioritize
optional player names, difficulty-tuned word sets, offline installation, or
audio/haptic feedback. Large groups are technically supported; their pacing
has not been validated with players.

## Project layout

```
src/
  App.tsx            // top-level state machine
  components/        // shared UI (Screen frame + icons)
  game/              // pure game logic and Persian helpers
  screens/           // one component per screen
```
