# Final Cut v13.1 — Balance, Awards, Buzz, Poster Persistence, Rankings
Source: released v13; GitHub main baseline d07c66e17cda16457b4b1314cae076b6e9efda5e.

- [x] Inspected release engine, award and buzz event cadence, economics, save/PosterStore paths, and 20-run v13 baseline (`FinalCut/engine.js`, `poster-store.js`, `tests/`).
- [x] Removed incorrect assumption that player must win randomized critics year; checked sorted standings and yearbook against actual winner (`FinalCut/tests/v13_world.js`); passed 40/40 repeated runs.
- [x] Tuned budget reach/indie legs, reduced excessive studio overhead and tax stacking, bot regional releases; added high-quality indie hit legacy score (`FinalCut/engine.js`, `sim.js`). 20/20 pre-score campaigns reached 2031.
- [x] Tightened festival/ceremony merit floors and capped ceremony studio trophies + annual festival wins; player and rival rules are equal. Pre-score 20-run avg 85 ceremony wins vs 266 v13.
- [x] Increased buzz decay, reduced saturation gain and increased flop backlash. Pre-score 20-run final Buzz 38–71 (v13: 82–98).
- [x] Mocked-storage poster UI tests passed; real IndexedDB test written (`FinalCut/tests/v13_1_poster_real_storage.py`), blocked by `net::ERR_BLOCKED_BY_ADMINISTRATOR` on local HTTP; live site cannot be verified in this environment.
- [x] 53 baseline checks, four focused suites, 50 repeated rival rankings tests, Chromium UI/mobile mocks, 20/20 seeded multi-region sims and 20/20 save reloads passed. Reports and JSON results in `FinalCut/docs/`, `FinalCut/tests/`.
- [x] Release: all fixes, tests, reports and 20 seeded results are packaged; GitHub main published and verified at e95a110827dad5e94052b89f264445cbca6802f1 (`FinalCut/docs/`, `FinalCut/tests/`, `/mnt/data/FinalCut_v13_1_2026-11-20.zip`).
