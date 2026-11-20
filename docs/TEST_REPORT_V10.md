# Final Cut v10 — Verification (2026-11-20)

## Executed checks
- `node tests/regression.js`: 10/10 v9 regression checks passed.
- `node tests/v10_regression.js`: 12/12 focused v10 checks passed, including regions, six starting rivals, festival growth by decade, ceremonies, archive preservation, world/studio rankings, distribution gross accounting and save migration.
- `python tests/browser_smoke.py`: original 10 game screens, mobile menu, no JS page errors.
- `python tests/v10_browser.py`: home-region selector, six updated navigation screens, actual completed film detail window, player/world rankings, mobile navigation, no JS page errors.
- `node --check` run on content.js, engine.js, media.js, ui.js and sim.js.

## Full-horizon automated simulations
Eight 1970–2031 runs: two deterministic seeds (123 and 124) for each of four strategies. All reached the scoring milestone without bankruptcy.

| Strategy | Score range | AI archive titles (range) | Active rivals at end | JSON save size (MB) |
|---|---:|---:|---:|---:|
| Prestige | 768–770 | 2,136–2,501 | 11 | 3.24–3.55 |
| Blockbuster | 756–777 | 2,565–2,622 | 13–14 | 3.56–3.63 |
| Cheap | 713–721 | 2,398–2,494 | 9–12 | 3.39–3.44 |
| Careful | 831–839 | 2,310–2,441 | 12–15 | 3.39–3.50 |

The above are synthetic strategy bots, not human playtests. Large late-game finance totals, 100-point fame caps and frequent annual trophies remain balance follow-ups. Browser storage limits vary and require additional real-device testing.

## Known limitations
- 1970–2031 historical records of early older v9 saves may be incomplete when only the latest few rival releases were retained. Records are never fabricated.
- Mobile visual smoke passes navigation but long tables should be tested on real phones.
- No deployment or GitHub Pages status is implied by the checks.
