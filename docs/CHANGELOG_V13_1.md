# Final Cut v13.1 — Balance & Quality Patch

**Scope:** v13 game rules, no save schema change. Existing v9–v13 migration paths retained; GitHub Pages remains a static browser app.

## Economy and strategy competition
- Made the high-budget box-office opening reach modestly greater without guaranteeing returns; blockbuster budgets and fees still require financial planning.
- Gave critically well-received low-budget features better theatrical legs, and improved entry-tier quality slightly.
- Reduced mature-studio revenue-linked overhead and tax brackets where distribution and production expenses were already being charged. Fixed staff/size costs still rise with growth.
- Updated automated strategy bots to make regional distribution choices rather than default to home-only, enabling meaningful comparisons of global and domestic film strategies.
- Added bounded *independent-hit legacy recognition* for critically strong, profitable films made for at most $120,000. This is included in the existing Hits score component; it does not increase cash or fabricate awards.

## Awards
- Raised major festival and ceremony win thresholds. Festival winners must meet real merit floors and face rival competition.
- One studio can win at most one category in an individual annual ceremony and at most two festival prizes per festival year; a film can win at most two festival prizes across its career. Nomination and selection histories remain intact.
- These limits apply to player and rival studios alike; independent films are not prohibited from major awards.
- Existing awards categories and individual actor/director/writer honors remain unchanged.

## Current Buzz
- Stronger week-by-week decay, slightly diminishing positive gains at high attention, and more pronounced backlash from failed features.
- Permanent studio fame, current prestige and lifetime legacy remain separate. Recent hits can still generate audience attention.

## Rival ranking reliability
- Corrected randomized test `tests/v13_world.js`: a rival may legitimately win the critics leaderboard. The assertion checks ordered rankings and yearbook consistency with the actual winner. Passed 50 repeated runs.

## Poster persistence
- Existing poster data remains in browser IndexedDB, keyed by campaign, and can be included in exported save backups.
- Simulated browser upload, restore and backup tests pass. A separate real-origin test is included as `tests/v13_1_poster_real_storage.py`; this environment blocks both the deployed GitHub Pages origin and local HTTP navigation. Real-site reload/persistence has **not** been verified. Do not claim it passed.

## Testing
- Six source JavaScript syntax checks; 53 earlier v13/v12 gameplay checks; focused v13 suites and new v13.1 checks; browser and mobile smoke tests.
- 20 seeded, 61-year campaigns across five regions and four strategies; 20/20 reached 2031, 20/20 saved and reloaded.
- Detailed before/after metrics: `docs/TEST_REPORT_V13_1.md` and `tests/balance/v13_1_comparison_summary.json`.
