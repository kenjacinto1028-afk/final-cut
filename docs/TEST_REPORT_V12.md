# Final Cut v12 — Final Verification Report

**Environment:** Node.js syntax/VM regression and headless Chromium Playwright, 2026-11-20.

## Automated checks
- `node --check` on `content.js`, `engine.js`, `media.js`, `ui.js`, `poster-store.js`, `sim.js`: **6/6 passed**.
- `node tests/v12_smoke.js`: **10/10 passed**.
- `node tests/v12_batch_f_regression.js`: **12/12 passed** (cast costs, duplicates, historical credits, sequel suggestions and recasting, director/writer-only career profiles, personal awards and compact save migration).
- `node tests/v12_compat_regression.js`: **10/10 passed** (v9 rules, topics, open casting, v8 save migration).
- `node tests/v12_compat_v10_regression.js`: **12/12 passed** (regions, festivals, archives, awards, v9 save migration).
- `node tests/v12_compat_v11_regression.js`: **9/9 passed** (poster variants, short distribution, franchise history and v10 save migration).
- **53/53 total current and adapted historical engine checks passed.** Legacy tests are retained unchanged; compatibility copies update only the asserted final save version to 12.
- `python tests/v12_browser.py`: browser walkthrough passed, **0 JavaScript exceptions**, including home region, optional ensemble UI, director/writer full careers only, other navigation, poster selection/cropping, mocked IndexedDB, backup export/import, mobile menu, and short-film distribution.

## Full 1970–2031 simulations
Four studio strategies were tested across North America, Europe, Asia-Pacific, Latin America and Middle East & Africa, using eight seeds (431–438). **8/8 finished at the 2031 score lock**, with 0 bankruptcies and 0 simulation crashes in the final tuned sample. All four strategies viable in this sample. The prior untuned F5 seed-311/312 sample reached 2031 in 7/8 runs; one prestige-focused studio went bankrupt in 2030 (a gameplay outcome, not a technical failure). Results: `tests/balance/v12_*.jsonl`.

Archived AI films per tuned campaign: **2,164–2,845**; uncompressed game state at score lock **4.90–5.72 MB** across these samples. A 5.71 MB example was packed losslessly to **4.07 million characters**, saved, and reloaded within a simulated 5 MiB storage quota. Browser quota limits vary by device/browser, and image blobs remain separate in IndexedDB.

## Outstanding limitations
- High-performing studios may reach fame/prestige 100 over long campaigns, even with reduced marginal gain.
- Real GitHub Pages cross-session browser reload, poster IndexedDB recovery, and device transfer have not been tested at the live site; the local browser harness mocks storage.
- Tournament balance is stochastic and eight runs cannot prove universal strategy fairness or award scarcity.
