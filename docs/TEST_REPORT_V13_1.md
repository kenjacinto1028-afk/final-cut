# Final Cut v13.1 — Balance and QA Results

## Scope and method
Compared 20 reproducible seeds (five starting regions × prestige, blockbuster, inexpensive, careful strategies) against the original v13 runs using the same seed and strategy pairs. Simulated player bots are simplified strategies, not comprehensive human play; distributions were corrected to use appropriate local/wide/worldwide choices, so this is a **scenario comparison** rather than proof that game mechanics alone caused all score changes. Save/load tested with a simulated browser quota.

| Metric | Released v13 baseline | Tuned v13.1 |
|---|---:|---:|
| Reached 2031 | 19/20 | 20/20 |
| Save/reloads | 20/20 | 20/20 |
| Average personal ceremony wins | 265.9 | 85.0 |
| Average personal festival prizes | 188.7 | 88.5 |
| Final Current Buzz (average) | 93.2 | 60.7 |
| Final Current Buzz (range) | 82–98 | 38–71 |
| Final Current Prestige (average) | 52.1 | 35.1 |

**Average campaign score by strategy:**

| Strategy | Baseline | Tuned |
|---|---:|---:|
| Prestige | 896.6 | 903.6 |
| Blockbuster | 777.0 | 905.6 |
| Low-budget | 730.0 | 773.0 |
| Careful/balanced | 956.0 | 909.8 |

No bankruptcies occurred in the 20 final tuned seeded runs, but bankruptcy remains a possible outcome. Big-budget projects can still generate significantly greater profits than modest films, while low-budget studios receive a finite bonus for successful independent films. These outcomes are not expected to be mathematically equal.

## Automated checks
- Six source JS syntax checks pass.
- `tests/v13_smoke.js`: 10 checks.
- `tests/v13_compat_regression.js`: 10 checks.
- `tests/v13_compat_v10_regression.js`: 12 checks.
- `tests/v13_compat_v11_regression.js`: 9 checks.
- `tests/v12_batch_f_regression.js`: 12 checks.
- `tests/v13_reputation.js`, `tests/v13_world.js`, `tests/v13_legacy.js`, `tests/v13_1_balance.js`: all pass.
- Fixed randomized rival-world ranking test: 50/50 repeated runs passed.
- `tests/v13_browser.py` and `tests/v13_lategame_browser.py`: pass simulated-storage Chromium navigation, crop, poster backup flow, awards, dashboards, late game and mobile checks; no page JS errors observed.

## Real-browser poster persistence: incomplete
`tests/v13_1_poster_real_storage.py` attempts real IndexedDB upload, reload, fresh browser context export/import and reload over a real HTTP origin, with no storage mocks. This test **could not execute here**: Chromium navigation to `http://127.0.0.1` returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`, and the container could not resolve the GitHub Pages host. The connected user browser cannot be controlled in the current chat. This is an environmental restriction, not evidence of a poster-storage bug or proof of success.

For final live verification on GitHub Pages: upload a poster, confirm its display, refresh the same tab, close/reopen the site in the same browser profile, export a backup, import it into another browser profile/device, and confirm the poster still appears. Check private/incognito storage limitations. Only then mark live poster persistence verified.

## Remaining tuning considerations
- The low-budget strategy still trails the three other strategies in end-score averages (773 versus ~904–910), though all survived the sample and the gap narrowed. This may reflect real differences in profitable hits and recognition rather than an engine error.
- Award counts remain substantial across 61 simulated years; the patch reduces, but does not eliminate, trophy frequency.
- These simulations do not prove that all edge cases, save sizes or player decisions are safe.
