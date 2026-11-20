# Final Cut v9 — Test Report (2026-11-20)

## Functional tests
Run `node tests/regression.js` from the project directory. **10/10 checks passed:** unique 25-topic catalog, six festival levels, new-game topic market, bounded topic-demand multiplier, elite artist interest vs reputation, staff hiring quality vs reputation, v8→v9 save migration with studio data preserved, short-film festival completion, TV pilot completion, and exclusive signing. All five JavaScript files passed `node --check`.

## Browser smoke tests
Chromium loaded the separated game scripts and stylesheet in a headless page (without network access), created a new game, visited **10 sections** (New project, Projects, Talent, Staff & HR, Market, Awards, Finance, News, Score, Dashboard), advanced five weeks, and generated desktop/mobile screenshots. **0 JavaScript page errors**, no 390px mobile horizontal overflow. Mobile menu open, navigation, automatic collapse and ARIA expanded state passed. See `tests/browser_dashboard.png`, `browser_market.png`, `browser_project.png` and `browser_mobile.png`. This is a scripted browser smoke test **not** a full human playthrough or deployed-site check.

## Full-horizon seeded simulations
`node sim.js <strategy> 2 401` for each strategy; 8 runs total from 1970 to **2031 score lock** (seeds 401–402). Raw JSON lines in `tests/balance/`.

| Strategy | Final scores | 2031 endings | Bankruptcies | Last studio tier | Final cash less debt |
|---|---|---|---|---|---|
| Prestige | 752, 772 | 2 / 2 | 0 | 4, 4 | $30.9m, $44.1m |
| Blockbuster | 736, 737 | 2 / 2 | 0 | 4, 4 | $22.2m, $36.6m |
| Cheap | 688, 692 | 2 / 2 | 0 | 4, 4 | $15.9m, $15.1m |
| Careful | 807, 818 | 2 / 2 | 0 | 4, 4 | $80.6m, $84.2m |

An earlier 16-run **1990** smoke (4 seeds per strategy) found one prestige-strategy bankruptcy. The 8-run 2031 test uses different seeds, so it does **not** disprove possible early-game financial risk. Two runs per strategy are not statistically conclusive.

## Observations and remaining checks
- All four bot strategies can reach the score lock and top studio tier, with high late-game wealth. Fame can still cap out in long simulations. Future balancing should evaluate larger seed sets and whether mid/late choices feel difficult enough.
- The bots mostly pursue film projects. Pilot and exclusive contract **individual** smoke tests pass, but sustained multi-season TV and complex contract negotiation paths need dedicated tests.
- Festival merit and studio size rules are covered by data and short-film completion tests, but winning top-tier awards as a tiny studio should get a probabilistic test over a large seeded sample.
- Test end-to-end audio, animations, modals, critical production choices, saves on real devices, and user comfort/readability in an actual interactive play session.
