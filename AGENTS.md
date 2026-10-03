# Project guidance

## Motion preferences

The project intentionally ignores system and browser reduced-motion settings.
Keep animations, transitions, and scrolling behavior at their designed settings
for every motion preference. Do not introduce `prefers-reduced-motion` media
queries, JavaScript preference detection, reduced-motion variants, or
preference-dependent durations in current or future features.

Do not globally force reduced motion in browser tests. Tests may emulate both
`reduce` and `no-preference` to verify that the application ignores the setting.

Keep this policy consistent with the animation policy in [README.md](README.md)
and the animation comments in `src/index.css`.
