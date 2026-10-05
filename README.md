# Spy

A Persian, pass-the-phone implementation of the Spy party game, modeled on the
[Figma design](https://www.figma.com/design/xSrjJcGLhSrKJXStuwOGh9/Spy?node-id=1-6).

## Stack

- Vite + React 19 + TypeScript
- CSS, inline SVG, and imported artwork; no UI framework or runtime game service.
- Playwright browser tests and axe accessibility checks.
- Installable offline PWA (`vite-plugin-pwa`) with a self-hosted Vazirmatn font.
- Capacitor 8 shells for Android and iOS built from the same web bundle.

## Scripts

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the build
npx playwright install chromium  # one-time browser setup for tests
npm test         # builds and tests the production app
npm run test:ui  # interactive test runner
npm run cap:sync # build and copy the web bundle into android/ and ios/
npm run android  # sync, then open Android Studio
npm run ios      # sync, then open Xcode (macOS only)
npm run native:assets  # regenerate native icons and splash screens from assets/
```

## Platforms

The same `dist/` build runs on every platform. `Capacitor.isNativePlatform()`
(exposed as `isNative` in `src/platform/native.ts`) selects the few behaviors
that differ.

| | Web / installed PWA | Android and iOS apps (Capacitor) |
|---|---|---|
| Offline | Service worker precaches the app, artwork, and fonts | Files are bundled in the app |
| Keep screen on during the timer | Screen Wake Lock API | `@capacitor-community/keep-awake` |
| Back | Browser or system back, through a same-page history entry kept while a screen handles back | Android back button and gesture |
| Status bar | `theme-color`, `black-translucent` on iOS | Light icons on the dark background |

Back behaves the same everywhere: it closes the open dialog, the timer's tools
panel, the guide, or the player names; during a round it asks before cancelling;
on the result screen it returns home; and from home it leaves the app. Screens
register their back action with `useBackButton` in `src/platform/native.ts`.

- **PWA updates** use a waiting service worker that never reloads a running
  round. A new version takes over the next time the app is opened after
  every window has been closed.
- **Logo and icons.** `src/assets/logo.svg` is the spy badge: the
  `spy-hero.svg` head cropped into the orange circle. `public/favicon.svg` is
  the same badge on a square canvas and the source for the favicon and PWA
  icons (`pwa-assets.config.ts`, generated at build time). The native sources
  in `assets/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png`,
  `splash.png`, `splash-dark.png`) are renders of the badge on the app
  background; after replacing them, run `npm run native:assets` and commit
  the generated files.
- **Native projects.** `android/` and `ios/` are committed. Change native
  settings there (app label `جاسوس`, portrait orientation), and keep app-wide
  options in `capacitor.config.ts`. Run `npm run cap:sync` after every web
  change and after adding a Capacitor plugin.
- **Android** builds need Android Studio (JDK 21 and the Android SDK).
  **iOS** builds need macOS with Xcode; plugins are resolved with Swift Package
  Manager, so CocoaPods is not required.
- The app id `games.bazimazi.spy` becomes permanent once published to a store.

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

`Home → (optional) Guide / Names → Reveal × N → Ready → Countdown 3-2-1 → Timer → Vote → Verdict → (Spy's guess) → End`

A spy can also stop the timer to guess early: `Timer → Spy's guess → End`.
The vote can be skipped with “نمایش کلمه و نقش‌ها”, which goes straight to
the reveal and leaves the result to the group, as in earlier versions.

- **Home** - choose 3-30 players, 1-8 spies (fewer than players), 1-30 minutes,
  a word category, and the optional spy hint. The three main settings use
  dropdowns matching the original design; category, hint, player names, and
  vibration are under “تنظیمات بیشتر”, and sound is a top-corner toggle.
  Valid preferences survive reloads.
- **Names** - optional names by seat (16 characters). Blank seats stay
  «بازیکن N». Names appear on cards, the vote, the verdict, and the scoreboard.
- **Reveal** - a large layered deck follows the original card artboards: player
  number and a faint spy illustration on the back, a centered word or spy
  portrait on the front, and an explicit hide-and-pass action inside the card.
  A tap turns the card over in 3D; hiding removes the secret at once and deals
  the concealed card off the deck toward the next player. The deck shows one
  evenly spaced card per player still waiting (exact up to 9 players, capped at
  9 cards above that) and thins from the back as cards go out. Progress dots (or a bar above 12 players) stay below
  the deck. Spy and citizen faces share every animation, sound, and vibration
  so nothing but the card's content can reveal a role across the table. The guide can be opened without losing the
  current player; opening it or hiding the page conceals revealed cards.
- **Ready** - everyone gets time to settle in. A slot-machine strip spins
  through the names and lands on the randomly chosen first questioner.
  The timer starts only when the group chooses to begin.
- **Countdown / Timer** - the original stopwatch layout leads with 3-2-1 and
  then a Persian MM:SS display. A small pause/resume control sits by the clock;
  the finish action stays at the bottom beside the spy artwork. Extra minutes
  and question ideas are folded under “زمان و راهنما”, along with the spy's
  early-guess action; opening them compacts
  the clock area and keeps the main action reachable. Red stopwatch artwork
  and a status message mark the final ten seconds, with a ticking sound, a red
  pulsing vignette, and a fuse bar that burns down under the time. Home
  confirmations pause time; cancelling restores the previous running or paused
  state.
- **Vote** - both time expiry and early completion leave secrets hidden. The
  group agrees on as many suspects as there are spies; with a full ballot a new
  pick replaces the oldest.
- **Verdict** - a drumroll, then each suspect's card turns over and the result
  is stamped. Accusing any citizen ends the round for the spies. Catching every
  spy gives them a last chance to guess the word.
- **Spy's guess** - the word among seven decoys from its own category.
- **End** - a winner banner with confetti, the reason, the portrait, spies,
  word, and the spy's guess. The team tally and a scrollable,
  keyboard-accessible list of roles and points are available on demand. One
  bottom action starts another round with the same settings and a fresh word.

## Scoring

| Result | Points |
| --- | --- |
| Every spy caught, last guess wrong | each citizen +1 |
| A spy guessed early and missed | each citizen +1 |
| A citizen was accused | each spy +2 |
| Every spy caught, last guess right | each spy +2 |
| A spy stopped the discussion and guessed right | each spy +3 |

Points follow seats and accumulate for the session until the number of
players changes. Rounds settled without the in-app vote are not scored.

## Sound and haptics

`src/game/feedback.ts` synthesizes every sound with Web Audio, so there are no
audio files and nothing to download. Buttons get a tap cue automatically;
`data-cue` on an element picks another cue and `data-cue="none"` leaves the cue
to the screen. Vibration uses `@capacitor/haptics` in the native apps and
`navigator.vibrate` where browsers support it; the setting is hidden where
neither exists. Audio starts on the first touch, as browsers require.

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
| Medium | Small steppers, identical accessible names, weak amber-button contrast, and a visually busy background made interaction harder. | 44px controls, contextual labels, valid selection ranges, visible keyboard focus, solid card and option surfaces, and dark primary-button text. Contrast improved from 2.01:1 to 8.21:1. See [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and the [44px enhanced target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). This is a design target, not a claim of full WCAG conformance. |
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
`127.0.0.1:5191`. The tests also cover the vote, verdict, last-chance and
early guesses, scoring, player names, and sound/vibration settings. The
original 22 tests cover supported role counts, two complete word-pool
cycles, category switching, corrupt/denied storage, rapid taps, private
handoffs, keyboard navigation, dialog cancellation/focus, pause/resume,
extensions, delayed timer callbacks, timeout and early-end privacy, rematches,
guide access during a private handoff, citizen and spy cards, home-confirmation
timing, denied wake locks, and unchanged animation behavior under both system
motion preferences. Axe checks the major screens, expanded tools, role lists,
and a confirmation dialog after all finite animations finish.
Screenshots are generated for 320×568, 360×740, 363×692 (the supplied reference
size), 390×844, 740×360, and 1280×800; layout checks include horizontal overflow,
reachable start, handoff, and gameplay actions, artwork placement, and card-text
clipping. Gameplay captures include all three countdown digits, the initial
timer, 03:20, the last-ten-seconds warning, final decision, result, and expanded
tools. Shared gameplay framing lives in `src/components/GameplayScreen.tsx`.

Secrets and word history stay in memory. Reloading resets a live round and
its word history; only preferences (including names and sound settings)
persist, and the session scoreboard stays in memory. The app records the
group's agreed vote; how the group reaches it is up to them. Real iOS/Android screen-lock behavior, screen readers,
and social balance still need device and group playtesting. Browsers may deny
wake locks. Gameplay needs no server once loaded, but offline reload/install
support is not implemented.

The next useful research is three Persian-speaking groups (new and experienced
players, 3-8 people), playing several rounds each. Record setup time, requests
for explanation, accidental reveals, pauses, unclear questions, perceived
fairness/enjoyment, and voluntary rematches. Also check whether the scoring
values feel fair, whether groups use the early spy guess, and whether sound
helps or distracts. Use that evidence to prioritize difficulty-tuned word sets
and scoring changes. Large groups are technically supported; their pacing
has not been validated with players.

## Project layout

```
src/
  App.tsx            // top-level state machine
  components/        // shared UI (Screen frame + icons)
  game/              // pure game logic, scoring, feedback, and Persian helpers
  platform/          // native shell setup and back handling
  screens/           // one component per screen
assets/              // source images for native icons and splash screens
android/, ios/       // Capacitor native projects
```
