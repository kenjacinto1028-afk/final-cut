# Final Cut v11 — Test report

Date: 2026-11-20.

## Static and gameplay checks
- All six JavaScript modules parse under `node --check` (`content`, `engine`, `poster-store`, `media`, `ui`, `sim`).
- `node tests/regression.js` — **10/10** legacy tests passed after updating the intentional v11 save-version assertion.
- `node tests/v10_regression.js` — **12/12** v10 compatibility tests passed against v11.
- `node tests/v11_regression.js` — **9/9** targeted tests passed (short distribution and no theatrical gross, film reception, 8 poster variants, poster references, sequel lineage and numbering, annual reviews, old-save migration, derived AI reviews).
- `python tests/v11_browser.py` — passed startup/region chooser, navigation, short distribution drawer, poster alternatives, custom poster crop, backup export/import, generated-art replacement, responsive mobile menu; **zero page JavaScript errors**.

### Browser test constraint
The sandbox blocked navigation to localhost, file:// and external test URLs, so browser UI was loaded using `page.set_content`. IndexedDB and localStorage were simulated **for this browser UI test**; asynchronous blob retrieval and backup flow were exercised against those mocks. **Real IndexedDB persistence across browser restarts and deployment on GitHub Pages still need a live-site check.** No claim of passing that check is made.

## 1970–2031 seeded simulations
`node sim.js <strategy> 1 <seed>`, four strategies × two seeds (119 and 215):

| Strategy | Seed 119 | Seed 215 |
|---|---|---|
| Cheap | Reached 2031 | Reached 2031 |
| Careful | Reached 2031 | Reached 2031 |
| Prestige | Bankrupt 2030 | Reached 2031 |
| Blockbuster | Bankrupt 1998 | Reached 2031 |

**6/8** reached the game scoring lock; **2/8** ended from bankruptcy. Saves for completed runs were approximately 3.6–3.9 MB with 2,200–2,600 archived AI releases. All eight simulations completed programmatically without JavaScript crashes; bankruptcy is an in-game loss rather than an exception.

Comparison against the unmodified v10 release using seeds 119/215 for blockbuster and prestige showed **3/4** bankruptcy outcomes, indicating variance in high-risk strategies is not unique to v11. No blanket protection against insolvency was introduced.

## Follow-up checks
1. Verify IndexedDB custom poster persistence across a full reload on the published HTTPS origin, plus backup transfer to another device.
2. Hands-on full campaign playtest, especially regional short screening income, franchise balance, release review variety and modal frequency.
3. More seeds before tuning the prestige/blockbuster strategy bankruptcy risk and late-game cash/award saturation.
