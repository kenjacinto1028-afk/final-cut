# Final Cut v13.2 — Tutorial Test Report

## Scope
New optional five-step tutorial added to UI; no game rules, economy, distribution, awards, save format, or media-generation code changed.

## Checks performed
- **6/6 syntax checks:** `content.js`, `engine.js`, `poster-store.js`, `media.js`, `ui.js`, `sim.js` via `node --check`.
- **8/8 Node test suites passed:** `v13_smoke.js` (10), `v13_compat_regression.js` (10), `v13_compat_v10_regression.js` (12), `v13_compat_v11_regression.js` (9), `v13_reputation.js`, `v13_world.js`, `v13_legacy.js`, `v13_1_balance.js`.
- **7/7 browser suites passed:** `tutorial_browser.py`, `v10_browser.py`, `v11_browser.py`, `v12_browser.py`, `v13_browser.py`, `v13_lategame_browser.py`, `browser_smoke.py` using headless Chromium and in-page mock local storage where needed.
- Tutorial-specific verification: start-page preview without creating a save; automatic first-game launch; all five steps, Back/Next/Done; skip, Escape, replay; Plan My First Film navigation; no time/cash change; current saves load without tutorial reopening; mobile dialog stays within viewport; zero JS page errors.
- Browser screenshots: `tests/tutorial_desktop.png` and `tests/tutorial_mobile.png`.

## Limitations
Local browser tests use a sandbox page with injected scripts, not a live GitHub Pages origin. Real-site poster IndexedDB persistence remains an existing unverified item. No new multi-decade economy balance simulations were run because this release changes only guided UI and no gameplay formulas.
