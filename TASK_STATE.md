# Final Cut v13.4 — Year-end awards reveal, transitions and audio
Baseline: v13.3 published on GitHub `main` (`5e7e4371128290c3cd7cf09816df14a80166f3a5`). Isolated working copy; previous release preserved.

- [x] Inspected `FinalCut/engine.js` annualReview/ceremonies, `ui.js` modal/tutorial and `media.js` WebAudio/FX; wrote `FinalCut/docs/DESIGN_V13_4.md` with recap-only, save, reduced-motion and audio requirements.
- [x] Added week-52 stop, persisted per-year dismissal, ceremony/festival recap and two-stage year-end popup in `FinalCut/engine.js`, `ui.js`, `index.html`; no extra award grants.
- [x] Added short screen/decision transitions, ceremony reveal treatment and responsive, reduced-motion-aware styling in `FinalCut/style.css` and `ui.js`.
- [x] Expanded `FinalCut/media.js` original WebAudio interface cues for navigation/reveal, production/box-office cues, and shared volume; existing SFX toggle stays opt-in.
- [x] Added `FinalCut/tests/year_end_browser.py`: tested intro/reveal, real recorded rival/player wins and festival honors, no double grants, pending/tour deferral, save/reload, old-save migration, replay, keyboard, responsive and reduced motion/audio. Passed 9 Node gameplay, 8 browser suites, 6 syntax checks; screenshots saved under tests/.
- [x] Wrote v13.4 changelog/design/test report, updated README/HANDOFF, packaged and integrity-checked `/mnt/data/FinalCut_v13_4_2026-11-20.zip`; published 12 source/test/doc files to GitHub `main` commit `c672427e33cf2d0b293371a690c883581732a967`; final Library/ZIP checkpoint refreshed.

## v13.5 — Correct repository remediation (2026-11-21)
- [x] Verify repository target `kenjacinto1028-afk/final-cut`, review v13.4 checkpoint and identify missing Production Center/theatrical changes.
- [x] Updated `engine.js` player/AI theatrical legs, max 20-week window, 2.5% closing rule, recorded weekly gross; save v13 unchanged.
- [x] Implemented `ui.js` native Production Center with poster/slate/milestones/uncertain quality estimate, existing decisions and archive.
- [x] Added scoped A+B dark charcoal/teal/gold responsive styles in `style.css`; untouched existing tutorial/awards/audio.
- [x] New `tests/v13_5_production_center.js`, v13/v13.4/save/balance suites passed (GitHub Actions #44839681803); PR #1 merged into `main` commit `aa5ab328`; GitHub Pages run #44839728794 build/deploy succeeded. FinalCut remains save v13.

## v13.6 — Sitewide A+B cinematic design (2026-11-21)
- [x] Confirm FinalCut repository, main baseline v13.5 and existing TASK_STATE.md; work in separate feature branch.
- [x] Audited `style.css`, `ui.js`, desktop/mobile navigation, 16+ screens, drawer, awards and tutorial; checked existing v13.5 stage CSS.
- [x] Added `theme-ab.css`, loaded after existing `style.css` from `index.html`; scoped noir/teal/brass palette, tables and responsive rules.
- [x] Revised `ui.js` navigation numbering, dashboard editorial header/actions, keyboard-friendly production rows and per-screen context prelude; engine unchanged.
- [x] Themed all major screens, reference panels, drawer, modal, nonmodal tutorial and year-end honors; Awards page prioritizes live campaigns/trophies while collapsing reference/historical lists.
- [x] Passed node/game regressions and 18-screen Chromium UI test, desktop/390px/360px, dialog/tutorial/drawer/navigation checks; real screenshots attached to GitHub Actions #44840730135. Documented in `docs/CHANGELOG_V13_6.md`.
- [x] PR #2 merged into `main` (`3e659bea37f5`); sitewide UI and original gameplay CI passed (GitHub Actions #44840917513 and #44840917523); GitHub Pages deployment #44841003956 completed successfully.

## v13.7 — Multiple save slots and campaign library (2026-11-21)
- [x] Inspected existing single autosave `backlot_save`, lossless pack/migration, UI start/quit/backup flows and campaign-scoped IndexedDB posters.
- [x] Added Engine `inspectSave`, `encodeSavePayload`, `closeSession` in `engine.js` with save format v13 and legacy `backlot_save` unchanged.
- [x] Implemented `save-slots.js` IndexedDB archive/index, old-save registration, copy/rename/switch/delete/import and rollback; updated `poster-store.js` for custom-poster copy/cleanup.
- [x] Added `ui.js` title/Save Library/sidebar/topbar controls and safe begin/continue/quit/import handling; `index.html` loads save module before UI.
- [x] Styled save cards and mobile manager in `theme-ab.css`; documented in `docs/CHANGELOG_V13_7.md`, README and HANDOFF.
- [x] Chromium IndexedDB test passed end-to-end: legacy migration, 4 slots, custom poster copies, switch/rename/delete, browser reload, full backup import and 390px screen; old gameplay/save tests passed. Actions #44843102726 and #44843131913 succeeded.
- [x] PR #3 merged into `main` (`d4fa3ac17803f8b218e52e638aff450ca905dbe7`), all UI, original engine and multiple-save tests passed (Actions #44843252775/#44843252730/#44843252640), GitHub Pages deployment #44843365483 succeeded.

## v13.8 — Film performance, Filmography finances, persistent project monitor
- [x] Checked FinalCut main and preserved the v13.7 multiple-save baseline; confirmed user examples of zero-gross Filmography and Software Inc monitoring reference.
- [x] Verified shorts/pilots have revenue without theatrical gross; Filmography listed box office only. Feature admissions will be explicitly labeled modeled estimates from booked gross; shorts/pilots never get invented counts.
- [x] Added bounded 32-week `performanceHistory`, per-project revenue/cost/gross deltas, optional publicity push and modeled admissions in `engine.js`; v13 format preserved.
- [x] Updated `ui.js` Filmography with feature-only box office, real studio receipts, per-film direct P/L, estimated tickets and studio finance summary.
- [x] Added Software Inc-inspired collapsible right dock via `index.html`, `ui.js`, `theme-ab.css`: live stage/earnings/admissions, bars, project click-through, mobile overlay.
- [x] Extended Production Center, film and project drawers with 12-week income/gross charts and modeled admissions; one-time post-opening publicity option with real cost.
- [x] Film finance, real Chromium live monitor, mobile, poster/save v13.7, v13.6 styling, v13.5 cinematic and v13.4 honors regressions passed (GitHub Actions #44848418818); screenshots artifact #14683817710. README, HANDOFF and `docs/CHANGELOG_V13_8.md` updated.
- [x] PR #4 merged to `main` (`26e1b38254246edc4b5bf51c3fa0741da4c49f39`); four pull-request workflows successful (#44848580247/#44848580233/#44848580176/#44848580170); GitHub Pages build and deployment #44848662193 succeeded. Screenshot artifact #14683817710 and changelog retained.

## v13.9 — Short film engagement & film quality/hype/reach (2026-11-21)
- [x] Identify FinalCut main v13.8 and existing completed checkpoints; create dedicated feature branch.
- [x] Found shorts paid once on week 3 via `festivalResult`, despite scheduled independent festival awards; identified existing `quality`, `hype`, modeled feature admissions, TV ratings and the persistent monitor. Target weekly short receipts with capped total, estimated screening reach and TV household impressions as explicitly modeled values.
- [x] `engine.js`: 3–12 week quality/audience-based screening run, baseline short receipts spread weekly and reconciled, modeled screening visits, tracked festival exposure and TV household impressions; original feature economy preserved.
- [x] `engine.js`: one-time festival press kit (+4 jury merit, cost booked) and four-week capped encore (real receipts/costs), continued calendar award eligibility and legacy short compatibility.
- [x] `ui.js`: release quality/hype, preview ranges before release, modeled theatrical/screening visits, TV household impressions, studio receipts, festival selections, actions and earnings charts in live monitor, Production Center, Filmography and drawers.
- [x] Styled compact A+B quality/hype and festival engagement panels responsively in `theme-ab.css`; updated `docs/CHANGELOG_V13_9.md`, README and HANDOFF. Save v13 preserved and old completed shorts are not repaid.
- [x] Passed 2 independent 10-year world simulations (72 shorts, exact screening-revenue reconciliation), engine, festivals, encore, simulated households and legacy v13 tests; full v13.5/13.6/13.7/13.8 regression suites and Chromium/mobile UI checks all green (PR Actions #44853961546/#44853961453/#44853961451/#44853961483/#44853961498). Real screenshots artifact #14686218189.
- [x] PR #5 merged to `main` (`bd4275830c430c640456b7c8a990ee2f5cfcf702`); all five FinalCut regressions succeeded on PR #5 (#44853961546/#44853961453/#44853961451/#44853961483/#44853961498); GitHub Pages #44854123420 built and deployed successfully. Original save format remains v13.

## v14 — Integrated filmmaking overhaul (2026-11-21)
- [x] Read approved `FinalCut_V14_Gameplay_Design_Proposal.md` and existing FinalCut v13.9 checkpoints; branch from correct `final-cut/main`.
- [x] v14a foundation: `engine.js` adds compact Film DNA, creative vision, ordered causal film story, additive `state.v14` hydration; existing save version 13 unchanged (commit 92b60bf). Partnership mechanics follow in v14d.
- [x] v14b engine: three authored quarterly pitches, safe early short, risk/fee, conditional rival interest and acquisition on greenlight; no infinite reroll, separate script cost, retained custom/sequels (`engine.js`, commit 2e0804b). UI selection and real AI bidding continue in v14f/h.
- [x] v14c engine: one Film DNA-specific production dilemma, three distinct choices, persistent consequences and one-at-a-time queue, simple ask/director/commercial delegation; existing cut decision retained.
- [x] v14d engine: bounded (36 pairs) director/writer relationship histories, creative-trust consequences, modest capped craft effect, sequel/return continuity still intact; no actor career profile.
- [x] v14e: `engine.js` provides 12-week rival calendar, four pre-release strategies with opening/legs/critic tradeoffs, one early theatrical response (expand/focus/hold/pull) with actual direct expenses and non-guaranteed returns (commit 442b5a).
- [x] v14f: budget-limited rivals may acquire contested quarterly scripts; causal rivalry memory and real release-date responses feed news, with no scripted guaranteed rival victories.
- [x] v14g engine: bounded film afterlife offers (license/retrospective/fan tour), 1–3-year studio ambitions and earned conditional script access, shared evidence-based player/rival classifications with quarterly hysteresis, two descriptors and standing/trajectory. UI integration follows v14h.
- [x] v14h: Completed A+B UI, navigable tutorial, docs, causal movie UI, rival calendar, 61-year + two 15-year strategy sweeps, real Chromium/mobile checks and v13.5–v13.9 save/economy regression gates (`tests/v14_gameplay.js`, `tests/v14_fullcareer.js`, `tests/v14_browser.py`; Actions #44862463065 and companion suites).
- [x] PR #6 merged tested v14a–h integration to `main` (merge `9b47703b1da0854e1d96015406988cbe24df6134`). All six final PR workflows passed; Pages build/deploy #44862636326 succeeded. The earned-classification scoring flaw was fixed and proven with five player/rival strategy fixtures. Existing v13 save schema and multiple slots preserved. Future stages: merge each completed, tested stage to main before starting the next.

## v14 follow-up — Normal-start balancing (2026-11-21)
- [x] Reviewed accepted v14a–h and funded 61/15/15-year metrics; standard-start strategy parity remains unproven.
- [x] Added eight normal-start careers, cross-region award/solvency/save reporting and separate GitHub workflow; no gameplay changes.
- [x] CI #44864111660 / #44864296282 confirmed two-region, four-strategy full-career economic/award gaps and all eight 5MiB FCP1 save failures.

- [x] Follow-up sizing diagnostic: Report exact legacy FCP1 compact payload characters and UTF-8 bytes for each long career; distinguish a genuine 5MiB quota breach from other persistence failure. Next CI determines remedy.

- [x] Added additive FCP2 second-stage synchronous LZW compression only for over-3.75m-character FCP1/plain saves; old v13 JSON and FCP1 remain fully readable. Added dedicated Unicode/quota/roundtrip regression. CI #44864678832 verified 8/8 standard-start campaigns now save and reload successfully with FCP2; #44864678975 confirmed full v14 + legacy and real-browser regressions, Pages #44864678165 deployed successfully.

- [x] Final FCP2 save-capacity acceptance: FCP1 5.45m–6.02m chars fell to FCP2 1.84m–2.05m chars, all 8 under 5MiB and roundtripped; direct >17MB synthetic Unicode archive test also passed. No save version change.
- [x] v14.1 balance tuning: capped blockbuster returns, experience-backed rival quality, gentler slate saturation, commercial risk and modest elite award scarcity; 12×61-year CI compared with earlier benchmark. Additional tuning remains optional.
- [ ] Future manual validation on physical Android/iPhone hardware: Chromium's 390px mobile browser tests passed, but actual device memory/latency and browser storage limits vary.

## v14.1 — Balance/mobile staged release (2026-11-21)
- [x] Stage 1: Profit-risk tuning: less generous premium-budget theater reach, remembered recent same-genre launches, modest wider downside, and stronger returns from actually hired rival talent. Baseline: 8 normal-start 61-year scenarios in V14_BALANCE_FOLLOWUP.md. Targeted assertions in tests/v14_1_balance.js. Await CI before calling tuned/accepted.
- [x] Stage 2 engine: 350ms coalesced background save after 1,600 rival-archive entries or 340 player films; same lossless codec in isolated Worker; discard stale generations after manual save/load/slot switch. Flush scheduled autosaves on visibility/pagehide. Chromium mobile test next.
- [x] Stage 3: Twelve 61-year standard-start strategy runs in North America, Europe, Asia-Pacific, full v13/v14 regressions, save/mobile Chromium tests accepted via PR #7 (merge 4782808e). The overcorrection was rejected and corrected before merge.

- [x] Stage 3 testing gate: 12 standard-start 61-year region/strategy careers; v13 and v14 economic/award/save regressions; 390px Playwright mobile worker, old save slots and film UI checks. Workflow: .github/workflows/v14_1.yml.

- [x] Mobile queue safety: bound large snapshots to one in-flight Worker job with coalesced dirty state, flush pending or active compression on tab hide; added rapid-turn consistency acceptance on Chromium.

- [x] Stage 1b evidence-led revision after first 12-career run: large-budget cash was lower, but careful studio flops only 0–2 and rivals still averaged ~65 craft vs player ~90. Added funded studio-experience quality uplift (max 12), 26-week mid/high-budget portfolio crowding, and modest elite-award thresholds (+2/+3). Kept indie films exempt from slate pressure. Seed matrix now shares North America/Europe starting seeds with previous v14 baseline for stronger comparison. Pending CI acceptance.

- [x] Rejected stage 1b overcorrection: 12×61y tests showed blockbuster only ~$16m average cash and ~158 flops; rivals became too dominant (~75 quality and 250 awards/year-long totals). Reduced earned rival craft cap 12 → 6 and high-budget six-month slate penalty 20% → 8%; retain modest elite-award floors. Rechecking before merge.

## v14.1 — Released balance and mobile performance (2026-11-21)
- [x] Merged PR #7 to `final-cut/main` (`4782808e`); revised parameters were selected using three tested 12-career runs, rejecting over-corrected rival dominance rather than shipping it.
- [x] Accepted 12×61-year standard-start CI #44866770309 (all save roundtrips); averages: blockbuster $745.3m/99 flops, prestige $222.8m/69, careful $221.9m/5, cheap $29.8m/72; three regions, four strategies.
- [x] Mobile Chrome/390px performance and full archive/worker ordering QA passed; existing v14 and v13.5–v13.9 compatibility/browser tests green on PR #7.
- [x] Final documentation checkpoint `af1b09ff` verified: GitHub Pages deployment #44867237569 and integrated v14 + legacy/Chromium CI #44867238195 both succeeded. Remaining physical-device validation is explicitly tracked above.

## v14.2 — Targeted polish (2026-11-21)
- [x] Scope frozen: remove long-history UI stalls from manual save, save-slot switch, copy and import while retaining sync fallback, legacy archives, poster separation and save version 13.
- [x] Implemented awaitable off-main-thread large manual saves, slot archiving, copy and import; retain unchanged synchronous SaveSlots.manualSave/Engine.save for compatibility. Fixed rollback references to the newest archived active save. All UI exits wait for confirmed storage success before switching/closing.
- [x] Mobile polish: readable accessible live save status, 44px tap targets, safe-area paddings, narrow 320px save cards and reduced motion; title-screen active-save metadata cache avoids decoding 2MB+ archives after an already verified manual save. Browser acceptance pending.
- [x] Acceptance gates: v14.2 Node contract and real Chromium 320/390px mobile, large manual save, title/slot copy/quit, quota failure and stale worker tests all passed in push CI #44868255497; v14.1 mobile, v13.7 slots and v14 browser regressions passed. Additional PR workflows pending.
- [x] Memory polish: explicit saves cancel obsolete active weekly worker to prevent two competing multi-MB encoders; FCP2 title metadata fast path only, older FCP1/plain archives still perform strict index repair.
- [x] Merged tested v14.2 branch through PR #8 into `main` at `9d175561d`; seven v13/v14 regression suites and dedicated v14.2 mobile/Node tests passed on PR. Physical Android/iPhone validation remains explicitly outstanding.
- [x] Verified main release checkpoint `08103ecf`: Pages #44868786379 and integrated v14 gameplay + legacy browser QA #44868787074 both passed. PR #8 dedicated v14.2 tests and the separate 12×61-year v14.1 economic balance gate also passed; the economic rules are unchanged.

## v14.2 tutorial refresh (November 21, 2026)
- [x] Review tutorial against approved v14/v14.1/v14.2 mechanics and preserve nonmodal interaction.
- [x] Expanded to 26 chapter-labeled steps in ui.js covering script acquisition/Film DNA, creative dilemmas, sequels, rival release calendar, audience reach, afterlife, studio identity/ambitions, v14.1 balance and v14.2 save slots/backups. Added an optional shortcut for returning players and reduced-motion-aware targeting.
- [x] Added Playwright acceptance for all 26 steps, real nav highlight/autoadvance, section opens, startup preview, jump-to-features, minimize, keyboard access, no money/time mutation and 320/390px mobile. Wired into existing v14 integrated QA and deprecated the outdated 13-step test entrypoint.
- [x] 26-step tutorial browser test passed within integrated v14 workflow #44869923225 (including 320/390px, no financial mutation, chapter navigation and jump shortcut). v13.5–v13.9, v14.1/v14.2 compatibility suites passed. PR #9 merged at fe76f9a; live main Pages #44870108460 and integrated v14 CI #44870109012 both succeeded.

## v14.3 — Approved implementation (2026-11-21)
- [x] Reviewed live screenshots and existing film decisions, short afterlife, festival kit, poster/still, rival calendar, financial graphs, critic score and archive UI.
- [x] Created `docs/NEXT_UPDATE_V14_3_PLAN.md` covering all 12 requests, proposed gameplay consequences, release dependencies, regression gates and task/model effort.
- [x] Stage A merged to main via PR #10 (`8d6400f`); dedicated film hub, custom-poster and v14 browser tests passed.
- [x] Implemented stage A film hub guide: persistent Story/Release/Short festival/Feature catalog eligibility with quote reasons; live Filmography-to-Project Film Hub CTA and custom-poster-specific removal of unrelated generated still. Browser regression tests/v14_3a_filmhub_browser.py added and wired to v14.yml; PR CI passed.
- [x] Stage B engine: one capped optional pre-release film campaign, fame/buzz/prestige-gated fictional sponsor per film with real revenue and critic risk, and persisted tiered original critic reviews with bounded positive/negative hype. UI now adds Film Promotion, optional sponsor cards and persisted named critic coverage to project/film drawers. Added Node sponsor/review contract and Chromium mobile marketing/sponsor/critic tests, wired to v14 integrated CI. Acceptance passed.
- [x] v14.3c merged PR #12 at d2ea130d, after all stage C Chromium/Node/legacy and 12×61-year balance checks passed. Calendar: show player feature/short/TV launch and forecast dates, bold titles, truthful rival feature format and genre/topic clash flags. Chart latest/peak and per-week click/focus numbers plus data table shipped on feature branch. Added contextual mouse/touch/keyboard help for important film metrics, cash/receipts, fame/buzz/prestige and calendar pressure. Replaced native festival-kit/encore confirmation with in-game dialog showing +4 future jury merit, exact cost/cash and no guaranteed wins; Escape, Cancel and Tab focus handling. World Film Archive now uses nonranking filmography financial columns and em dash for non-theatrical or missing values; updated old short-film Chromium test to click the new in-game campaign confirmation. Added 12-week calendar Node contracts and real Chromium 320/390px festival/chart/archive/tooltips acceptance tests to v14 integrated CI. PR QA passed.
- [x] Stage D guided tutorial code: 23-step live first-film journey, mandatory script/greenlight/week/advance/premiere/history actions, existing-film opt-in, reference-mode bypass, accurate format-specific walkthrough and no tutorial-triggered game mutations. Added actual Chromium first-film walkthrough replacing the old 26-step reference assertions and updated README. Full real-film Playwright journey and v14.3 changelog added. PR #13 merged at 0c24bd5 after full real-film Chromium first-film browser QA #44876187273 succeeded. Latest main live-site and v14 regression verification pending.

- [x] All 12 user feedback requests delivered via stage PRs #10–#13; stage A/B/C regression suites and dedicated real first-film tutorial browser acceptance passed. Release documents and changelog updated in main.


## v14.4 — approved flexible production release work (November 21, 2026)
- [x] Audited published v14.3 engine, legacy save format and current UI; based working branch v14-4-flexible-production on main 6316010.
- [x] Implemented custom media variant/cap and production feasibility, persisted opt-in allocations and cast-first slider UI (engine.js, ui.js).
- [x] Implemented independent prep, shoot, post charges, budget reserve transfer/explicit cap changes, cap-bound promotion/distribution and exclusion of unused cap from craft/receipts.
- [x] Added cross-media franchise continuations with separate results; TV/web episode count, tiered sponsor offers, fame-driven salary raises, re-cast/lean choices, signed-income-only season feasibility.
- [x] New tests in tests/v14_4_budget.js and Chromium/legacy CI workflow v14_4.yml; first full v14.4 engine+browser test passed #44885627778.
- [x] Created draft PR #14 and docs/CHANGELOG_V14_4.md/HANDOFF.md; safety of old v13 saves preserved by opting new projects in only.
- [x] Latest v14.4 PR head 29018fa passed nine regression, balance and Chromium workflows; past intermediate failures fixed.
- [x] PR #14 merged to main as 077d0b3; Pages deployment #44886842728, integrated v14 QA #44886843928 and normal-start balance #44886843844 all succeeded.
- [ ] Physical Android/iPhone device check remains manually outstanding.

## v14.4a — post-merge economy and series balance
- [x] Reviewed prior 8×61-year real-start results, including blockbuster/careful/rival-quality outliers; avoid risky v14.1 overcorrection.
- [x] Corrected flexible pilot fees, bounded TV audience bonus and negotiated ratings-based network renewal fees in engine.js; existing saves/series retain legacy rules.
- [x] Prevented high unused caps from generating sponsor windfalls; film promotion quotes use actual planned spending, not idle reserve.
- [x] Added tests/v14_4a_balance.js plus v14_4.yml coverage; sponsor/pilot/renewal and four eight-year normal-start samples passed engine + Chromium on PR branch #44887308737.
- [x] Created docs/CHANGELOG_V14_4A.md and PR #15; full compatibility gates await final branch head.
- [x] All nine PR #15 workflows on b82a8ff passed; merged to main as d0e8cb7 and GitHub Pages deployment #44887771506 succeeded.
- [ ] Physical iPhone/Android performance and broader multi-seed TV-series strategy balance remain future checks.

## v14.5 implementation — checklist (2026-11-21)
- [x] Created isolated branch feature/v14-5-ui-and-premiere-20261121 from main 6f38d6f; audited current UI, release engine and workflows.
- [x] Consolidate sidebar navigation and local subtabs; preserve route IDs. — ui.js + style.css commits c1d7f10/c750bd2; tutorial selector regression to verify in QA.
- [x] Consolidate Film Hub with clear short-tab detail sections. — ui.js 1d7d8f5 and style.css d75dc99; unified released project/archive six-tab hub, QA pending.
- [x] Premiere report and critic classifications, sequential dismissal and saved replay. — engine.js a7ba9a5; ui.js ebc82be; index.html a418da6; style.css 72b3363; engine/UI QA pending.
- [x] Add grounded broad-market release reach and region/reach/period/media ranking filters. — engine.js d2f220b, ui.js bb878f4; exact city/country charts remain unsupported until real submarket modeling.
- [x] Strengthen marketplace script vs original screenplay differentiation. — engine.js 059a3b0/75e9569, ui.js 95ff6bd; paid scripts gain 1–2 craft readiness, originals retain free rights and flexibility.
- [x] QA gates passed: 10/10 on final feature head f244d37. New tests/v14_5_regression.js and tests/v14_5_browser.py, v14_5.yml, v13/v14 save/tutorial/mobile/long-career regressions (12×61-year) green. Physical phone testing outstanding.
- [x] Merged PR #16 (3a72576) after all ten CI workflows passed; Pages deployment #44901669778 succeeded; README, HANDOFF, changelog and TASK_STATE marked v14.5 released in follow-up main documentation checkpoint.

## v14.5 tutorial placement polish (2026-11-21)
- [x] Reviewed main tutorial state, CSS anchoring, and v14.5 release status.
- [x] Added independent drag/keyboard position controller in tutorial-position.js; default left anchor in theme-ab.css; loaded after ui.js via index.html.
- [x] Preserved nonmodal tutorial operation and guide state; browser-local position persists and clamps on resize, double-click resets.
- [x] Diagnosed v14.4 Chromium failure: guide overlapped the Greenlight button. Added automatic placement away from visible primary actions in tutorial-position.js (commit 7a6ac68).
- [x] Discovered scroll-induced overlap in v14.4 first-film browser test; added capture-phase scroll re-evaluation so guide moves when Greenlight enters viewport (tutorial-position.js).
- [x] v14.4 mobile browser test found Menu control overlap; global highlighted target detection now includes mobile Menu (tutorial-position.js).
- [x] Prioritized highlighted tutorial targets (especially mobile Menu) over unrelated primary actions in automatic placement scoring (tutorial-position.js).
- [ ] Confirm rerun of PR #17 regression results, merge to main, and verify Pages deployment.
