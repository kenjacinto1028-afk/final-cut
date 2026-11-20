# Final Cut — v9 development handoff

Updated: 2026-11-20. This file supersedes the original handoff (preserved in `FinalCut_handoff.zip`).

## Game
Plain HTML/CSS/JavaScript, no build step. One turn is one week from 1970. The score locks after 2030; the game can continue. Bankruptcy ends the run.

## Run
Open `index.html` in a browser with all game files alongside it; JavaScript loads in this order: **content.js → engine.js → media.js → ui.js**. Optional Google Fonts use system fallbacks. Node 18+ can run `node sim.js <prestige|blockbuster|cheap|careful> <runs> [seedBase]` for seeded simulations, or `node tests/regression.js` for current functional checks.

## Separate files
- `index.html` — browser shell and accessible mobile navigation toggle.
- `style.css` — warm ivory/charcoal cinema-inspired UI, contrasting blue main buttons, orange contextual CTAs, responsive layout.
- `content.js` — genres, **25 topics**, events, six-tier festival definitions, all other game data.
- `engine.js` — game rules, economic simulation, quarterly topic demand, festival selection, fame/critics/prestige recruitment, cooldowns, save migration.
- `ui.js` — views, project planning, market trends, Studio Wire, recruitment information and mobile navigation.
- `media.js` — procedural music/art and visual effects; no game-rule changes in v9.
- `sim.js` — four seeded strategies, alternative-artist offers when elites decline.
- `docs/ARCHITECTURE.md` — architecture and historical rules with a v9 superseding note.
- `docs/CHANGELOG_V9.md` — implemented changes and areas not yet fully verified.
- `docs/TEST_REPORT.md` — smoke and long-run simulation results.
- `docs/NEXT_UPDATE_PLAN.md` — approved scope and implementation status.
- `tests/regression.js` — runnable functional tests. `tests/balance/*.jsonl` — v9 sample sims.

## Status and compatibility
Batches **A–F implemented**, batch **G tested and packaged**. Game saves are version **9**; legacy **v8 saves are migrated** with missing topic/recruitment/event fields backfilled. Browser storage keys remain `backlot_save`, `finalcut_leaderboard` and `finalcut_media`. Original v8 files are available unchanged from the source handoff ZIP and Library `/FinalCut/`; v9 stored separately in Library `/FinalCut/v9/`.

## Working conventions
Keep data in `content.js`, rules/state in `engine.js`, UI logic in `ui.js`, styling in `style.css`, and media in `media.js`. Most source sections are marked `// ===== SECTION: NAME =====`. Edit only affected files. After changes, run `node --check` on scripts, `node tests/regression.js`, then seeded bots and a browser smoke test. Consult `/mnt/data/TASK_STATE.md` when available. Do not fabricate test coverage.

## Known limits / follow-ups
- Human hands-on play and full audio/motion effects are not validated yet; headless browser smoke has no JS exceptions but cannot prove subjective usability.
- Long-run bots simulate player productions (mostly film) but do not broadly exercise human TV, individual staff negotiations, or multi-season exclusive contracts; separate pilot and exclusive contract smoke checks pass.
- In the latest two-seed-per-strategy full-run sample, all bots eventually reached the top studio tier and retained large positive cash balances. Fame still saturates late game. Continued balance work should use larger seeded batches and real user feedback.
