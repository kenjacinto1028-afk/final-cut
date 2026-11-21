# Final Cut — Studio Tycoon

**Current release: FinalCut v14.5.** PR #16 delivered five-section navigation, premiere reports and market-aware Film Hub and rankings. All ten PR regression workflows passed, including 12×61-year career balance; the v14.5 code was merged as `3a72576` and GitHub Pages deployed successfully (#44901669778).


## v14.5 — Clearer navigation, premieres and rankings

Explore five compact sections with contextual subtabs and a unified six-tab Film Hub. New premieres report poster, numeric ratings, individual critic quotes, release reach and expected distribution; reports queue, save and replay. Local/Regional/National/International critic names replace numeric tiers. Industry rankings now filter by format, market, release reach and time, using actual recorded broad-region receipts. Paid scripts receive a small +1/+2 craft-readiness advantage; originals stay free. **City/country theatrical charts are not simulated** and have not been invented. [Full release details](docs/CHANGELOG_V14_5.md).

## v14.4 — Flexible production and living franchises

Choose an exact film/TV/web spending cap, cast talent first, then allocate funds across pre-production, filming, post, marketing, distribution and contingency. Production feasibility considers scope and paid resources. Successful stories may have cross-format continuations with new outcomes; TV/web series track episodes, sponsor contracts, fame-based wage inflation and renewal choices. The original v13 save format and legacy projects remain compatible. [Full release details](docs/CHANGELOG_V14_4.md).

## v14.4a — Targeted balance follow-up

The follow-up review fixes cash rewards based on unspent pilot caps, sponsorship rewards inflated by idle reserves, and optional marketing quotes incorrectly tied to unused cap. It also places a cap on flexible TV episode audience bonuses and adds a bounded, ratings-earned network fee increase on renewal while preserving star salary pressure. See [balance notes](docs/CHANGELOG_V14_4A.md) and [PR #15](https://github.com/kenjacinto1028-afk/final-cut/pull/15).

## Guided First Film — v14.3
Open **? Tutorial** or **How to play**. The state-aware 23-step guide now requires real script choice, actual greenlighting, clicking **Next week** and **Advance to next decision**, responding to genuine events, reaching a premiere, opening the real earnings ledger, and visiting Filmography and World Film Archive. It never simulates those actions for you, and may be minimized or skipped. Returning players can **Browse feature reference** without mandatory spending or follow an existing film. Browser acceptance: `python tests/v14_2_tutorial_browser.py`.

## v14.2 — Responsive saves and phone-friendly polish
Save Now, Return to Title and large campaign archive/copy/import operations now compress large histories in a background Worker instead of freezing the page. Save status is announced to screen readers, and 320px/390px mobile layouts have bigger tap targets and safe-area spacing. On a browser without Workers, the game falls back to the same synchronous lossless save format. The original **v13** save schema, FCP1/FCP2 decoding, studio results and v14.1 balance are unchanged. See [v14.2 release notes](docs/CHANGELOG_V14_2.md).

## v14.1 — Balance and responsive long-career saving
The studio economy now applies bounded premium-budget and repeat-slate audience pressure, improves rival filmmaking through genuinely earned studio craft, and slightly raises elite award winner thresholds. Large weekly browser autosaves use a background worker so long campaigns do not block normal navigation; manual/save-slot operations remain synchronous, with original v13, FCP1 and FCP2 saves supported. Twelve 61-year standard-start careers across three regions and mobile Chromium plus legacy tests passed. See [v14.1 changelog](docs/CHANGELOG_V14_1.md).

## v14 — Filmmaking stories, competition and earned studio identity

Film projects now develop as persistent, connected stories: discover three quarterly screenplay opportunities or write your own, choose a creative vision, resolve meaningful production tradeoffs, compete with rival release dates, and follow theatrical or catalog opportunities after release. Routine work still advances automatically.

**Studio Profile** shows a classification earned from your films, genre/story focus, awards, collaborators and financial track record, plus optional ambitions and delegation preferences. Rivals are evaluated by the same evidence and can contest scripts or release dates. All new financial costs and earnings use the original accounting engine.

Long-career campaigns now use lossless FCP2 save compression only when needed, retaining plain JSON, FCP1, v13 saves and existing save slots; 8 full-career simulated 5MiB roundtrips passed. See docs/V14_BALANCE_FOLLOWUP.md for details and remaining balance questions.

Original v13 saves and independent saved-game slots remain compatible. See `docs/CHANGELOG_V14.md`. Cinematic A+B colors, custom posters, talent records, awards, and the existing festival and release systems remain intact.

## v13.9 — A longer life for short films
The **Project Monitor** and Production Center now show film quality, opening hype, real weekly receipts, and transparently estimated reach: feature ticket admissions, short-film screening visits, or TV household impressions (not unique people). Shorts earn screening receipts each week across a **3–12 week** quality-sensitive circuit rather than a one-off lump sum, while the original overall screening-revenue target is preserved. Even after screenings finish, you can follow the festival calendar and optionally fund one festival press kit or one four-week encore screening run. These limited choices have real expenses; awards and profits are not guaranteed. Old v13 save slots stay compatible. See `docs/CHANGELOG_V13_9.md`.

## v13.8 — Film performance, admissions and profitability
**My Filmography** now shows studio receipts and direct project profit/loss alongside feature-film theatrical gross. Shorts and pilots no longer misleadingly show `$0` as their only financial number. Feature admissions are **modeled estimates** from ticket gross, not measured viewers. A collapsible **Project Monitor** docks to the right on wide screens and tracks active stages, earnings, audience and weekly performance, with mobile access via the top bar. Production Center and project details include charts, and features may invest in one optional post-opening publicity push. Campaign autosaves and original save format v13 remain compatible. See `docs/CHANGELOG_V13_8.md`.

## v13.7 — Multiple saved studios
FinalCut now supports multiple browser-local save slots. Use **Saved Games** in the sidebar or **Manage saved games** on the title screen. Create independent campaigns, autosave the active one, switch, rename, delete, or **Make a copy** (including custom poster artwork). Imported backups create new slots without overwriting existing campaigns. The original `backlot_save` format and save version 13 remain compatible. For protection across devices or browser resets, export a full backup. See `docs/CHANGELOG_V13_7.md`.

## v13.6 — Sitewide Cinematic A+B interface
The entire game now uses the same restrained charcoal, muted teal and brass visual language as the Production Center. The dashboard has a clearer executive layout; all management pages, tables, controls, film/talent drawers, decision dialogs, tutorial and Year-End Honors share the design. Awards reference lists are collapsed by default. Existing game logic and save version 13 are unchanged. See `docs/CHANGELOG_V13_6.md` and `tests/v13_6_sitewide_browser.py`.

## v13.5 — Production Center (correct FinalCut project)
The Projects page now opens a cinematic Production Center with an automatically updating film slate, stages, budget/spend, tentative quality range and theater receipts. The existing detailed project table remains in an expandable archive. Features now have longer, bounded theatrical runs, applied equally to the player and rival studios. v13.4 interactive tutorial, year-end awards and sound remain intact. Saved-game format remains v13. See `docs/CHANGELOG_V13_5.md`.


A browser-based movie studio management simulation starting in 1970. Make shorts, features and TV, hire talent and staff, build reputation, distribute films, compete with rival studios and win awards through 2030.

## Play
Open **`index.html`** in a modern browser, or publish the repository root using GitHub Pages. No build step required.

## v13.3 — Interactive tutorial (retained feature)
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
