# Final Cut v13 — Release Verification

**Build:** separate browser sources with save version 13 and compatibility for prior v12/v11 campaigns.

## Automated gameplay checks
- `node tests/v13_smoke.js` — 10 basic game/casting/film/save tests.
- `node tests/v13_compat_regression.js` — 10 general regression checks.
- `node tests/v13_compat_v10_regression.js` — 12 historical archive/regional checks.
- `node tests/v13_compat_v11_regression.js` — 9 poster/reception/sequel checks.
- `node tests/v12_batch_f_regression.js` — 12 prior career/sequel/ensemble/compact-save checks.
- `node tests/v13_reputation.js` — non-saturating attention/prestige decay/legacy and save migration.
- `node tests/v13_world.js` — annual results, rotating leadership and rival standings.
- `node tests/v13_legacy.js` — optional initiative costs/cooldown, classic reissue caps and era shifts.
- `node --check` for all six JavaScript source files.

**53 previous gameplay checks plus 3 v13 focused engine suites passed.**

## Browser tests
- `python tests/v13_browser.py` — onboarding, navigation, short distribution, generated/custom posters, simulated poster storage and backup, mobile, zero JavaScript page errors observed.
- `python tests/v13_lategame_browser.py` — late-game dashboard, optional studio initiatives, limited reissues, rival standings, score view and final legacy recap, mobile, zero JS errors observed.

## Long-running balance
- `python tests/v13_multiseed.py 0 10` and `python tests/v13_multiseed.py 10 10` — 20 seed combinations, five home regions × prestige/blockbuster/cheap/careful strategies. `tests/balance/v13_final_summary.json` is the aggregate and 20 individual JSON files hold results.
- **19/20** reached the scoring year 2031; one Asia-Pacific blockbuster studio went bankrupt in 2019 (expected possible gameplay outcome).
- **20/20** saves passed compressed save/load using simulated 5 MiB storage. Largest packed save 4,077,129 characters; uncompressed save JSON grew to 5,727,293 bytes.
- Current Prestige **24–65** (mean 52.1), Current Buzz **82–98** (mean 93.2); 8–15 active rivals; approximately 2,176–2,788 rival films archived.
- Individual studio ceremony wins over the campaign **98–377** (mean 265.9), versus 463 wins for a representative *untuned v13* run of the same prestige seed and 351 after tuning. Not a controlled 20-seed v12-to-v13 estimate.
- `python tests/v13_snapshots.py` — 1990/2010/2025 snapshots with save/load checks.

## Remaining limitations
Long-term bots do not opt into every optional initiative/reissue; those mechanics are tested directly and through browser interactions. Published-site poster persistence under real browser origin policies and cross-device transfer need manual confirmation. Saturation of lifetime fame is intentional; active studios may maintain Current Buzz in the 90s. Award totals remain large over six decades. This test matrix demonstrates representative playability, not statistical impossibility of crashes or undesired outcomes.

For methods and individual interpretation see `docs/V13_BALANCE_F1.md`.
