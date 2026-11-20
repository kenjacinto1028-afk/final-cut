# Final Cut v13.5 — Film Production Center

This release corrects the implementation target to `kenjacinto1028-afk/final-cut`. The unrelated Studio Syndicate code is **not** imported into Final Cut.

## What changed

- Reworked the Projects screen into a cinematic, restrained Production Center with the existing searchable archive retained below an expandable section.
- Focusable film slate, original poster art, current production phase, milestones, quality *range*, budget versus spending, estimated timing and actual box-office totals.
- Decisions remain handled by the existing weekly simulation; no new daily tasks, charges, invented outcomes or hidden alternate accounting.
- Releases show their recorded most recent week's gross in the theater overview.
- Stronger theatrical hold: max 20 weeks (previously 16), gently higher capped word-of-mouth decay and 2.5% low-gross exit threshold (previously 5%). The same criteria apply to player and AI-rival films.
- Year-end Honors, audio, existing interactive tutorial, content, posters, saved games and awards remain unchanged from v13.4.

## Data integrity

`lastWeekGross` is an optional recorded field written by the real film-release simulation. Old saves without this field continue loading. Save format remains v13.

Box office is calculated by the established Final Cut simulation, not the Studio Syndicate engine. This update lengthens late weeks, so a broad 20-seed economy rebalance should be revisited if theatrical receipts prove too generous.

## Automated tests

- `node tests/v13_5_production_center.js`
- `node tests/v13_smoke.js`
- `node tests/v13_4_honors.js`
- `node tests/v13_compat_regression.js`
- `node tests/v13_1_balance.js`

Verified through GitHub Actions `FinalCut v13.5 verification`, run 44839564122 (success). Runtime smoke created and completed an actual short, released a feature, recorded its weekly gross, and reloaded a save v13.
