# Final Cut — Current Handoff (v12)

Release: 2026-11-20; target repository `kenjacinto1028-afk/final-cut`, branch `main`.

## Running the game
Open `index.html` or deploy this directory through GitHub Pages. It loads `content.js`, `engine.js`, `poster-store.js`, `media.js`, `ui.js` in that order. No build/dependency installation is needed. For reliable custom-poster persistence use a stable HTTPS site origin rather than private/ephemeral browsing.

## Modules
- `content.js`: genres, topics, events, market, regions, festival and award definitions.
- `engine.js`: projects, turn/film/rival/TV rules, history, regions, franchise links, save format v12 (compact legacy-compatible browser saves).
- `poster-store.js`: browser-local custom JPG/PNG/WebP poster blobs in campaign-scoped IndexedDB; separate from main save.
- `media.js`: original SVG poster templates/portraits/stills and brief optional UI effects.
- `ui.js`: navigation, projects, filmography and rankings, poster upload/crop and backup import/export.
- `style.css`: charcoal/ivory responsive UI and reduced-motion styles.
- `sim.js`: deterministic 1970–2031 automated strategy runs.

## V12 functionality
Talent skill and fame are independent, with worldwide recognition tiers and realistic career movement. Sequels reward returning actors, directors, and writers through increased hype but allow recasting. Big feature budgets unlock optional supporting cast and extra crew with fees. Full career profiles are **only for directors and writers**; personal awards only for actors, directors and writers; film-only awards remain unchanged. Multi-decade browser autosaves compact repetitive historical keys losslessly.

## V11 functionality
Short films can choose region circuits after post-production. Releases track critic/audience reaction. Player hits can spawn sequels, AI studios occasionally create hit sequels. Movies have eight procedural poster variants and player-owned movies can use local uploaded posters; use a full backup to move poster art to another device. Illustrated people and film stills plus limited UI animations remain cosmetic.

## Tests and limits
Run `node tests/v12_smoke.js`, `node tests/v12_batch_f_regression.js`, `node tests/v12_compat_regression.js`, `node tests/v12_compat_v10_regression.js`, `node tests/v12_compat_v11_regression.js`, `python tests/v12_browser.py`, and `node sim.js careful 1 123`. See `docs/CHANGELOG_V12.md` and `docs/TEST_REPORT_V12.md` for exact coverage. Final tuned multi-region simulations produced 8/8 scoring completions; one previous untuned run went bankrupt. Local browser sandbox does not permit end-to-end live-origin IndexedDB testing; test after GitHub Pages deployment. V10 is preserved in its earlier release archive.
