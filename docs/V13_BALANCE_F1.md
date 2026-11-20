# Final Cut v13 — Multi-seed balance test (Batch F1)

Version: source after v13 A–E implementation and F tuning; 20 full seeded automated campaigns, each starting in 1970; lock at 2031 when solvent.

## Scope / methods
- **20 different seeds**: five home regions × four bot strategies (prestige, blockbuster, cheap, careful); saved as `tests/balance/v13_<region>_<strategy>_<seed>.json`.
- Each completed bot used the normal film pipeline, cast/talent recruitment, finances, awards and rival competition. The optional initiative/reissue interactions were covered in `tests/v13_legacy.js` and the browser workflow, not automatically purchased in every long bot run.
- Headless runs tested compressed saves with a simulated **5 MiB per-origin quota** and immediate restore.
- `tests/v13_snapshots.py` covers 1990, 2010, and 2025; `tests/v13_browser.py` and `tests/v13_lategame_browser.py` cover browser navigation, storage import/export UI, mobile, and legacy controls. Real deployed-browser multi-device file persistence remains a manual follow-up.

## Results
- **19/20** reached 2031; the only bankruptcy was blockbuster in asiapacific in 2019 (gameplay result, no runtime crash).
- **20/20** save/reload passes; largest packed save **4,077,129 characters** under 5 MiB test quota, despite raw JSON up to **5,727,293 bytes**.
- Current Prestige **24–65**, mean 52.1; Current Buzz **82–98**, mean 93.2. Lifetime fame and historic prestige still reach 100, by design; *current* measures are now distinct.
- Won ceremony categories **98–377** across a campaign (mean 265.9); awards remain numerous over 61 years, but stricter flagship, critics and audience thresholds improve scarcity. In one same-seed prestige tuning check (1301), wins fell from 463 (initial v13) to 351; do not treat this as an equivalent 20-seed v12 comparison.
- Active rivals **8–15**, with **2,176–2,788** rival films archived; cap remains 15.

## Final scores by strategy (includes the single early bankruptcy)

| Strategy | Score range | Reached 2031 (of 5) |
|---|---:|---:|
| Blockbuster | 415–888 | 4/5 |
| Careful | 944–972 | 5/5 |
| Cheap | 712–754 | 5/5 |
| Prestige | 851–933 | 5/5 |

## Gameplay tuning implemented
1. Positive buzz gains soften as public attention rises; weekly buzz fades sooner if the studio stops releasing films. Lifetime fame stays durable.
2. Current Prestige uses a five-year weighted history with a larger saturation reference; achievements remain in uncapped Lifetime Legacy.
3. Golden Reel and critics awards require stronger winners; indie prizes retain more accessible merit thresholds; campaigns yield smaller point advantages.
4. Rivals improve film quality from their own named creative talent, and industry leaders gain a small genre-specific specialty edge, not a universal AI stat bonus.
5. Final score screen now has a historic legacy recap featuring defining films, creative partners (directors/writers) and recent rival comparisons.

## Checks and caveats
- 6 source JavaScript syntax checks.
- **53 passed previous gameplay checks** (10 smoke + 10 regression + 12 v10 + 9 v11 + 12 Batch F) and three dedicated v13 engine regression suites.
- Both Chromium browser UI suites passed without observed JavaScript page errors, including mobile and custom-poster simulated save/backup flow.
- One bankruptcy shows cashflow remains a real risk; all four strategies are viable in this sample but no claim of statistical guarantee.
- Buzz stays elevated (**82–98**) for studios releasing films consistently; only inactivity and flops drive it down markedly. Award totals remain sizable over decades, which may merit further live-play review.
- Real cross-device poster persistence and live GitHub Pages caching are not proven by these local browser tests.
