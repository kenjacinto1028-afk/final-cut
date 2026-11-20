# Final Cut — Current Handoff (v13.3)

Release: 2026-11-20; target repository `kenjacinto1028-afk/final-cut`, branch `main`.

## Running the game
Open `index.html` or deploy this directory through GitHub Pages. It loads `content.js`, `engine.js`, `poster-store.js`, `media.js`, `ui.js` in that order. No build/dependency installation is needed. For reliable custom-poster persistence use a stable HTTPS site origin rather than private/ephemeral browsing.

## Modules
- `content.js`: genres, topics, events, market, regions, festival and award definitions.
- `engine.js`: projects, turn/film/rival/TV rules, history, regions, franchise links, save format v13 (compact legacy-compatible browser saves).
- `poster-store.js`: browser-local custom JPG/PNG/WebP poster blobs in campaign-scoped IndexedDB; separate from main save.
- `media.js`: original SVG poster templates/portraits/stills and brief optional UI effects.
- `ui.js`: navigation, projects, filmography and rankings, poster upload/crop and backup import/export.
- `style.css`: charcoal/ivory responsive UI and reduced-motion styles.
- `sim.js`: deterministic 1970–2031 automated strategy runs.

## V13 functionality
Lifetime fame is permanent; current buzz decays with inactivity and declining hype, rolling prestige records recent five-year performance, and lifetime legacy keeps proven achievements. Equal award eligibility now applies to player/AI; flagship wins and elite festival prizes are more selective, while independent works retain access. Rivals develop performance-driven industry leaders, ranked 3-/5-year rivalry records, and decade championships. Four occasional paid initiatives, bounded old-film reissues, industry shifts, studio milestones, and final legacy recap make late-game choices meaningful. The active rival cap remains 15. Twenty seeded 1970–2031 simulations completed (19 score locks, 1 legitimate bankruptcy), and all saves reloaded under simulated 5 MiB origin quota. See `docs/CHANGELOG_V13.md` and `docs/TEST_REPORT_V13.md`.

## V12 functionality
Talent skill and fame are independent, with worldwide recognition tiers and realistic career movement. Sequels reward returning actors, directors, and writers through increased hype but allow recasting. Big feature budgets unlock optional supporting cast and extra crew with fees. Full career profiles are **only for directors and writers**; personal awards only for actors, directors and writers; film-only awards remain unchanged. Multi-decade browser autosaves compact repetitive historical keys losslessly.

## V11 functionality
Short films can choose region circuits after post-production. Releases track critic/audience reaction. Player hits can spawn sequels, AI studios occasionally create hit sequels. Movies have eight procedural poster variants and player-owned movies can use local uploaded posters; use a full backup to move poster art to another device. Illustrated people and film stills plus limited UI animations remain cosmetic.

## Tests and limits
Run the v13 tests listed in `docs/TEST_REPORT_V13.md`. Previous v12 regression suites are copied under v13-compatible test names, leaving old release tests preserved. Real cross-device IndexedDB behavior requires live-site verification. The v12 and v11 release archives remain preserved separately.


## v13.1 corrective update

See `docs/CHANGELOG_V13_1.md` and `docs/TEST_REPORT_V13_1.md`. Corrected randomized studio rankings regression, reduced high-end overhead/taxes, tuned indie recognition/box-office, capped major awards and increased Current Buzz decay. Real-origin poster persistence test requires an unrestricted browser and remains unverified on GitHub Pages.

## v13.2 tutorial addendum
- `ui.js`: five-step UI-only skippable walkthrough opens after `UI.startGame`, with replay `UI.openTutorial()` in sidebar / start screen. `UI.closeTutorial()` returns focus; last step can navigate to New Project.
- `index.html`: adds `<div id="tutorial" hidden></div>`. `style.css`: responsive dialog styles and keyboard focus handling.
- New test: `tests/tutorial_browser.py`. Existing browser UI tests dismiss tutorial before unrelated navigation and permit newer save versions.
- No engine, save version, balance, media, or poster-storage rules changed; no migration needed. See `docs/CHANGELOG_V13_2.md`, `docs/TEST_REPORT_V13_2.md`.

## v13.3 — interactive tutorial addendum
The fullscreen v13.2 tutorial dialog was replaced by a **nonmodal 13-step guide**. `ui.js` renders the guide on the sidebar/screens while normal navigation remains operable; specific `UI.go()` visits auto-advance matching guided steps, and a small `Open section` CTA provides a mobile-friendly alternative. Highlighted elements have a visible outline in `style.css`; minimize/resume, skip and Escape are non-disruptive. There is no persisted tutorial state and no engine changes. To test: `python tests/tutorial_browser.py` and the current suites in `docs/TEST_REPORT_V13_3.md`. Live GitHub Pages/IndexedDB verification is still a separate manual task.
