# Spy — v2

A React + TypeScript implementation of the Spy party game, modeled on the
[Figma design](https://www.figma.com/design/xSrjJcGLhSrKJXStuwOGh9/Spy?node-id=1-6).

## Stack

- Vite + React 19 + TypeScript
- No CSS framework, no asset pipeline — visuals are pure CSS plus inline SVG.

## Scripts

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the build
```

## Flow

`Home → (optional) Guide → Reveal × N → Countdown 3-2-1 → Timer → End`

- **Home** — pick the player count, spy count, round duration, and toggle the
  optional “راهنما برای جاسوس” hint.
- **Reveal** — pass the phone player by player. Each player taps the card to
  flip it; spies optionally see the word category.
- **Countdown / Timer** — short 3-2-1 then a live MM:SS timer that turns red in
  the last 10 seconds.
- **End** — reveals the secret word and lists each player’s role.

## Project layout

```
src/
  App.tsx            // top-level state machine
  components/        // shared UI (Screen frame + icons)
  game/              // pure game logic and Persian helpers
  screens/           // one component per screen
```
