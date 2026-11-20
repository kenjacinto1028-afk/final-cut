# Final Cut — Studio Tycoon

A browser-based movie studio management simulation starting in 1970. Make shorts, features and TV, hire talent and staff, build reputation, distribute films, compete with rival studios and win awards through 2030.

## Play
Open **`index.html`** in a modern browser, or publish the repository root using GitHub Pages. No build step required.

## v12 — Current release
The complete v12 update (A–F) includes independent fame/skill, recognition tiers, growing talent careers, richer productions and rivals, improved TV and financial forecasts, sequel cast continuity, optional expanded ensembles, and **full career filmographies for directors and writers only**. Personal honors belong to credited actors, directors and writers; movie trophies remain attached to films. Large save archives are compacted without losing data.

This is the released game build, not the earlier A–E preview. **No special build step required.** See `docs/CHANGELOG_V12.md`, `docs/IMPACT_REPORT_V12.md`, and `docs/TEST_REPORT_V12.md`.

## New in v11
- Regional distribution choices for short films.
- Film reception and annual studio reviews, with AI rivalry narratives.
- Create sequels to successful features; AI studios may develop sequels too.
- Eight procedural poster styles, three quick choices and optional **custom poster uploads** with crop controls.
- Locally stored custom posters and an artwork-inclusive backup export/import option.
- Illustrated fictional talent portraits, atmospheric film stills, and optional interface-only effects.

Your ordinary save uses local browser storage. **Custom images stay in your browser's IndexedDB** and do not automatically sync to other devices; use the full backup feature to transfer them. Original generated posters always work without uploads.

## Files
- `content.js` — definitions and events
- `engine.js` — rules, economy, game state and save migrations
- `poster-store.js` — browser-local custom poster art
- `media.js` — SVG art and visual effects
- `ui.js` — pages and controls
- `style.css` — responsive theme
- `sim.js` — long-run simulator
- `docs/` — architecture, changelogs and tests

## Tests
`node tests/v12_smoke.js`, `node tests/v12_batch_f_regression.js`, `node tests/v12_compat_regression.js`, `node tests/v12_compat_v10_regression.js`, `node tests/v12_compat_v11_regression.js`, and `python tests/v12_browser.py`. Long-term playtest: `node sim.js careful 1 123`. Full results and limitations: `docs/TEST_REPORT_V12.md`.
