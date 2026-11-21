# Final Cut — Current Handoff (v14.2)

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

## v13.4 — Year-End Honors
- Engine `annualReview()` now sets `state.stopFlag=true` on Wk 52 and saves `yearEndPresented` UI dismissals. Legacy v13 saves initialize viewed years from their historical annual reviews; no version bump.
- UI displays `#year-end-awards` separately from `#modal`, only when there is no gameplay decision/gameover/tutorial. Recap uses `state.awards.history` for the ceremony's current calendar-year actual nominees/winners and project `festResults`, with no rewards applied. It supports replay via Awards, close and Escape, and responsive styling.
- `Media.uiSound` reuses opt-in synthesized sound effects (default off); the audio volume slider applies to music and sound. New screen transition and cue CSS respects reduced motion.
- New browser test `tests/year_end_browser.py`, screenshots and reports `docs/CHANGELOG_V13_4.md`, `docs/TEST_REPORT_V13_4.md`.
- GitHub Pages live-origin storage validation is still outstanding; no economic formulas changed.


## v13.5 — Film Production Center
Work belongs to `kenjacinto1028-afk/final-cut`. The previous unrelated Studio Syndicate/Entertainment Tycoon repository is not a source for this application. `ui.js` adds the Projects-page center and retained detailed archive; `style.css` adds scoped cinematic styling; `engine.js` extends both player and AI theatrical hold and records optional `lastWeekGross`. Save v13, poster storage, tutorial, year-end honors and sound stay compatible. Run `node tests/v13_5_production_center.js` and the suites in `docs/CHANGELOG_V13_5.md`.

## v13.6 — Sitewide cinematic A+B presentation
- `theme-ab.css` adds the restrained charcoal/teal/brass theme, loaded **after** `style.css` from `index.html`. Change it instead of mixing new inline styles into engine code.
- `ui.js`: dashboard management masthead/shortcuts, screen preludes, numbered sidebar groups and keyboard-friendly slate rows. Awards information is available in expandable reference panels; ongoing campaigns and trophies are shown first.
- The original `style.css`, `engine.js`, `media.js`, poster store, save data (v13), tutorial and sounds are preserved. Do not change game rules to adjust a visual theme.
- Browser checks/screenshots: `python tests/v13_6_sitewide_browser.py`, GitHub Actions `ab-sitewide-ui.yml`; see `docs/CHANGELOG_V13_6.md`.

## v13.7 — Multi-save architecture
- `save-slots.js`: IndexedDB `finalcut-save-library/snapshots` archives inactive campaigns, while the active campaign stays in the legacy `localStorage['backlot_save']`. `finalcut-save-index-v1` is the lightweight slot registry.
- `engine.js`: new read-only save summary / encoder and session-close functions; original save schema remains version 13.
- `poster-store.js`: campaign-copy and cleanup, so duplicated campaigns never share uploaded posters. CampaignIDs differ for copies/imports.
- `ui.js`/ `theme-ab.css`: Save Library screen and actions, safe New Game, load/save/rename/delete/copy, and new-slot full-backup imports.
- `tests/v13_7_multi_save_browser.py` uses a real localhost Chromium origin and IndexedDB, and `.github/workflows/multi-saves.yml` verifies the old v13 regression suites too.
- Clearing site/browser storage still deletes local slots; full backups are the transfer/recovery path. See `docs/CHANGELOG_V13_7.md`.

## v13.8 — Project Monitor and film-level weekly metrics
- `engine.js` adds simulated-ticket-price conversion, `filmAdmissions` and bounded (32 entries) project weekly ledger. It never adjusts historic accounting or fabricates old weekly records. A one-time film publicity push costs real studio cash, changes direct project spending and modestly boosts future demand.
- `ui.js` clearly separates **theatrical box office**, **studio receipts**, **direct project P/L**, and **estimated admissions**; shares compact weekly receipt/box-office charts between Filmography, Production Center, project/film drawers, and the pinned side Project Monitor.
- `index.html` mounts `#film-monitor`, and `theme-ab.css` styles a collapsible charcoal/sage/brass right-side dock above main navigation and below drawers/modals. Default open on wide desktop, manual toggle on narrow screens.
- `tests/v13_8_film_finance.js` checks engine-side reconciliation and old saves; `tests/v13_8_film_monitor_browser.py` checks actual UI, browser reload, responsive dock, screenshots; workflow `.github/workflows/film-performance-v13_8.yml` also reruns existing regression suites.
- Existing save schema **v13** and IndexedDB multi-save library are unchanged. Model-estimated ticket admissions are never presented as measured actual viewers; for shorts/pilots no attendance count is invented.

## v13.9 — Short-film screening circuit, festival life and reach indicators
- `engine.js`: per-short **3–12 weeks** of screening income reconciled to the old baseline lump-sum formula; `shortRunTarget`/`shortRunCollected` keep full auditability. No extra automatic money for longer screens. Optional festival press kit adds a small jury-merit bonus without guaranteed award; once-only four-week encore has real direct costs and capped additional revenue. Completed films still enter existing calendar festivals; save version remains 13.
- `projectPulse` now also carries modeled `screenings` and `households` weekly counts. Estimated short screening admissions use $0.75 studio receipts per visit in 1970 and 3.1% annual growth; TV household impressions use simulated episode ratings (35k households per point in 1970, 2.5% growth). These are estimates, **never real unique viewers**. Pre-v13.9 complete shorts keep exact receipts but get only a labeled reconstructed lifetime estimate, without invented weekly history.
- `ui.js`/`theme-ab.css`: quality/hype scores and pre-release ranges, per-format audience units, 2 line/bar views, release status and festival exposure in the right Project Monitor, Production Center, Filmography and drawers. The two short-film afterlife actions appear only when affordable and eligible.
- QA: `tests/v13_9_short_engagement.js`, `tests/v13_9_short_ten_year_balance.js` (two independent ten-year leagues), and `tests/v13_9_short_browser.py` (real Chromium, desktop/mobile, screenshot review). Workflow `.github/workflows/v13_9_shorts.yml` also checks v13.8 finance/UI, v13.7 multiple saves, v13.6 layout, legacy v13 compatibility and v13.1 balance.
- Read `docs/CHANGELOG_V13_9.md` for expected behavior, assumptions, eligibility and migration rules.

## v14 — Integrated script-to-legacy overhaul
- `engine.js`: additive `state.v14`, Film DNA per new production, a bounded 14-entry causal film story, quarterly scripted pitches, one contextual shoot dilemma with optional delegation, capped director/writer partnership memory, positioned releases, one post-opening response, rival script bidding, evidence-based player/AI classification (with candidate hysteresis), optional 1–3 year ambitions, and limited afterlife film decisions.
- `ui.js`: script-market greenlighting and customizable creative vision; Studio Profile for earned classification/evidence/ambition/delegation; narrative in Project Center/drawers, position and response options, real upcoming competitor release calendar, industry rival classification. In-game tutorial expanded and still nonblocking.
- `theme-ab.css`: understated A+B film-script, narrative, studio and market sections, responsive mobile.
- No save format upgrade; **v13** saves with no `v14` field or historical Film DNA are loaded without historical fabrication. SaveSlots and custom posters unchanged.
- Verification: `tests/v14_gameplay.js` two 15-year integrated campaign tests, `tests/v14_browser.py` desktop/mobile screenshot and controls, all v13.1–v13.9 previous regressions via `.github/workflows/v14.yml`. Full 1970–2031 balance sweep is separate.
- Full feature description, thresholds, caveats and decision cadence in `docs/CHANGELOG_V14.md`. Further tuning should prioritize cash strategy parity, endgame challenges and awards density.

## v14.1 — Tuned economy and mobile large-save autosaves
Merged PR #7 after 12×61-year normal-start scenarios, full v14 plus v13.5–v13.9 regression gates and Chromium at 390px. `engine.js` tunes premium-budget audience scaling, genre/slate fatigue, bounded late risk, experience-backed rival craft and major-award winning floors; `save-worker.js` runs exact lossless `Engine.encodeSavePayload` off the UI thread for very large weekly saves while synchronous manual/save-slot writes invalidate stale Worker generations. Original save version 13 is unchanged. `tests/v14_1_balance_matrix.js`, `tests/v14_1_mobile_browser.py`, and `.github/workflows/v14_1.yml` cover balance and browser responsiveness. Physical phone performance remains unmeasured. Full behavior and sampled results: `docs/CHANGELOG_V14_1.md`.

## v14.2 — Explicit-save latency and small-screen usability
PR #8 updates `engine.js` with `Engine.saveAsync()` and `Engine.encodeSavePayloadAsync()`, both using the canonical v14.1 `save-worker.js` serialization for history-heavy campaigns; it terminates an old worker before an explicit save and checks a per-game save generation so older workers never overwrite newer state. Small saves, no-Worker browsers and the public `Engine.save()` retain their synchronous contracts. `save-slots.js` uses the async path for manual Save Now, active archiving and copy/import, and fixes transaction rollback pointers. `ui.js` awaits save before Return to Title, announces success/failure, and `theme-ab.css` adds narrow-screen touch/safe-area polish. Same-tab large FCP2 summary caching avoids decoding the entire archive each time the title screen opens; a fresh reload may still do a one-time index reconciliation. See `docs/CHANGELOG_V14_2.md` and `tests/v14_2_mobile_browser.py` for the 320/390px, storage-quota, independent-branch, stale Worker and reduced-motion gates. **No economy formulas or v13 save schema are changed.** Physically testing Android/iPhone is still open.
