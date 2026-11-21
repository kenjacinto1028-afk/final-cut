# Final Cut — Studio Tycoon

## v13.7 — Multiple saved studios
FinalCut now supports multiple browser-local save slots. Use **Saved Games** in the sidebar or **Manage saved games** on the title screen. Create independent campaigns, autosave the active one, switch, rename, delete, or **Make a copy** (including custom poster artwork). Imported backups create new slots without overwriting existing campaigns. The original `backlot_save` format and save version 13 remain compatible. For protection across devices or browser resets, export a full backup. See `docs/CHANGELOG_V13_7.md`.

## v13.6 — Sitewide Cinematic A+B interface
The entire game now uses the same restrained charcoal, muted teal and brass visual language as the Production Center. The dashboard has a clearer executive layout; all management pages, tables, controls, film/talent drawers, decision dialogs, tutorial and Year-End Honors share the design. Awards reference lists are collapsed by default. Existing game logic and save version 13 are unchanged. See `docs/CHANGELOG_V13_6.md` and `tests/v13_6_sitewide_browser.py`.

## v13.5 — Production Center (correct FinalCut project)
The Projects page now opens a cinematic Production Center with an automatically updating film slate, stages, budget/spend, tentative quality range and theater receipts. The existing detailed project table remains in an expandable archive. Features now have longer, bounded theatrical runs, applied equally to the player and rival studios. v13.4 interactive tutorial, year-end awards and sound remain intact. Saved-game format remains v13. See `docs/CHANGELOG_V13_5.md`.


A browser-based movie studio management simulation starting in 1970. Make shorts, features and TV, hire talent and staff, build reputation, distribute films, compete with rival studios and win awards through 2030.

## Play
Open **`index.html`** in a modern browser, or publish the repository root using GitHub Pages. No build step required.

## v13.3 — Interactive tutorial (current release)
Start a new studio to see an **interactive 13-step guided tour**. The compact nonmodal guide lets you **click the actual Dashboard, New Project, Projects, Filmography, Finance, Rivals and Awards buttons**, and advances automatically as you navigate. It highlights relevant controls and explains cash, film budgets, talent, casting, production, regional distribution, reviews, history and competition. Minimize/resume, Next/Back, Skip, and replay via **? Tutorial** are supported. The guide works on mobile and does not spend cash or advance time. See `docs/CHANGELOG_V13_3.md` and `docs/TEST_REPORT_V13_3.md`.

## v13.2 — Short tutorial
Start a new studio to see a **five-step, skippable walkthrough** about your first film, talent, cash, production decisions and release. Use **How to play** on the start screen or **? Tutorial** in the sidebar to replay it any time. The tutorial does not advance game time or change the save. Full details: `docs/CHANGELOG_V13_2.md` and `docs/TEST_REPORT_V13_2.md`.

## v13 — Current release
Final Cut v13 focuses on rewarding late-game play without new micromanagement. **Lifetime fame**, **Current Buzz**, **rolling Current Prestige** and **Lifetime Legacy** now mean different things. Elite awards are harder to win, active rivals develop recognizable leadership cycles, and studios compete in rolling three-/five-year standings and decade championships. Optional passion/franchise/global/talent initiatives, capped classic-film reissues, industry shifts, and a final historic legacy recap give major studios new reasons to play.

All v12 talent, casting, production, director/writer career, personal award, film ranking, mobile and custom-poster systems remain. Existing saves migrate to **save version 13**. See `docs/CHANGELOG_V13.md`, `docs/IMPACT_REPORT_V13.md` and `docs/TEST_REPORT_V13.md`.

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
`node tests/v13_smoke.js`, `node tests/v13_compat_regression.js`, `node tests/v13_compat_v10_regression.js`, `node tests/v13_compat_v11_regression.js`, `node tests/v13_reputation.js`, `node tests/v13_world.js`, `node tests/v13_legacy.js`, and `python tests/v13_browser.py`. Twenty long seeded scenarios: `python tests/v13_multiseed.py`. Full results: `docs/TEST_REPORT_V13.md`.


## v13.1 balance & QA patch

See `docs/CHANGELOG_V13_1.md`, `docs/TEST_REPORT_V13_1.md` and `docs/IMPACT_REPORT_V13_1.md`. Engine save version remains 13 for backwards compatibility.

## v13.4 — Year-End Honors and sounds
At Week 52 the game pauses for a two-stage **Year-End Honors** recap of the award ceremonies, nominations, festival prizes, and your studio's films. Click **Reveal the winners**, then **Close** or **View Awards**. Your recap can be replayed from the Awards page. This is a presentation of existing results, not a second awards draw.

Pages, decision cards and award reveals now have brief cinematic transitions. Enable **Sound effects** in the sidebar or the year-end popup to hear generated navigation, awards and production cues; sound is off by default and the volume slider controls all audio. **Reduce motion** suppresses animations. Existing v13 saves load normally; game balance is unchanged.

Technical notes: `docs/CHANGELOG_V13_4.md`, `docs/TEST_REPORT_V13_4.md`.
