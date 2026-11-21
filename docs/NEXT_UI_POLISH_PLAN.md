# FinalCut — Next UI polish backlog

## Planned: In-game confirmation dialogs (not implemented)

- [ ] Replace browser-native `confirm()`, `alert()`, and `prompt()` interactions used for game decisions with consistent, themed in-game dialogs.
- [ ] Cover all confirmations, including purchases, spending, sponsorships, festival kits, production decisions, destructive actions, save-slot deletion/overwrite, imports, and quitting or switching sessions when relevant.
- [ ] Each dialog clearly states the action and consequences, with descriptive Confirm and Cancel buttons; default focus on the safer option for destructive or costly actions.
- [ ] Support keyboard navigation, Escape to cancel, appropriate focus trapping/restoration, mobile touch targets, and accessibility.
- [ ] Prevent double-confirmation, duplicate spending, and accidental repeat actions; preserve existing game outcomes and save compatibility.
- [ ] Audit remaining native dialogs across the complete UI and verify with desktop/mobile browser tests.

Scope: UI/UX consistency only; no gameplay rebalance. This is a plan, **not a completed implementation**.

## Planned: Project Details access from Project Monitor (not implemented)

- [ ] Add a prominent **Project Details** button/tab inside each film's Project Monitor, including the persistent monitor for the active film.
- [ ] Open the correct film's existing Project Details/Film Hub without making the player hunt through Projects or Filmography.
- [ ] Keep project monitoring context easy to return to after viewing details; maintain the existing Film Hub tabs and preserve mobile-friendly navigation.
- [ ] Update tutorial instructions and highlighted targets to point to **Project Monitor → Project Details**, replacing confusing or inaccessible directions.
- [ ] Test active and completed films, switching between films, mobile widths, existing saves, and full first-film tutorial navigation.

Goal: make the details referenced repeatedly by the tutorial available directly from the film being monitored. Scope is navigation/discoverability; no gameplay changes.

## Priority: Repair missing completed films in My Filmography (reported defect; not yet fixed)

- [ ] Reproduce a film that reaches completion/release but does not appear in **My Filmography** under the current v14.5 navigation.
- [ ] Audit the film lifecycle and record creation from project completion through `Engine.filmHistory()` to My Filmography; check the `projectId != null` owner filter, all formats, film tabs, regional/reach filters and any archived/legacy state.
- [ ] Ensure every genuinely released/completed player film appears under **All My Films** irrespective of theatrical gross, media format, critical score or current run status. Avoid creating duplicate catalog entries or rewriting legitimately unreleased/cancelled projects.
- [ ] Confirm the correct title opens its Film Hub, preserves release history/receipts/reviews, and remains visible after save/reload, old-save migration and save-slot changes.
- [ ] Add deterministic engine and real-browser regression coverage for feature films, shorts, TV pilots/web episodes, including zero-box-office releases and simultaneous premieres.

Priority: **High** — player film history must be reliable before navigation improvements are considered complete.

## Priority: Full tutorial audit against current v14.5 UI (not yet implemented)

- [ ] Review **every** tutorial step, screen name, breadcrumb, button label, highlighted target and "Open section" action against the current five-section sidebar and nested subtabs.
- [ ] Remove outdated paths such as **Studio → My Filmography**; point to the actual current navigation path, and ensure automatic navigation reaches the correct view and subtab.
- [ ] Align the Project Details walkthrough with the planned **Project Monitor → Project Details** shortcut.
- [ ] Run the entire first-film tutorial end to end, from creating the script through production, premiere, My Filmography and Film Hub; validate each highlighted target is visible and clickable.
- [ ] Test desktop/mobile navigation, collapsed menus, production decision dialogs, completed-film examples, older saves and tutorial reopening.
- [ ] Keep tutorial wording and navigation targets centrally aligned so future UI reorganizations are less likely to break instructions.

Priority: **High** — complete this together with the Filmography fix to ensure the guided tour leads to a film that is actually visible.

## Planned gameplay: Film cult following, lasting fans and sequel demand (not implemented)

- [ ] Track a **film-specific fanbase** for released films: estimated active followers plus a smaller loyal/core following. Label both as simulated estimates, separate from ticket sales, households or cumulative audience reach.
- [ ] Seed follower growth from **quality, audience reception, real recorded release reach, genre/story appeal, word of mouth and later exposure**. A high-quality film with little initial reach can grow into a sleeper cult classic; a broadly seen poor film should not automatically develop a strong loyal following.
- [ ] After release, let most **active followers decay over time** at varied rates. Strong reception, enduring genre identity, awards, fan campaigns, repeat exposure and exceptional word of mouth can preserve a loyal core for years or create occasional resurgences. Not all successful films become cult classics; avoid automatic immortality.
- [ ] Define clear, earned film fanbase classifications (e.g. Emerging Following, Dedicated Fans, Cult Classic, Enduring Favorite) using quality and **retention**, not raw follower count alone. Allow commercial blockbusters with broad but shallow followings.
- [ ] Display active followers, loyal/core followers and trend in **Film Hub → Reach & Rankings / Awards & Legacy**, with a compact count/trend in **Project Monitor** and the film's sequel planning view. Show changes after new exposure or campaigns, rather than requiring weekly micromanagement.
- [ ] When pitching a sequel/spinoff/continuation, show the predecessor's active and loyal following and an **estimated audience-demand/hype boost**. Retaining key actors and the original director/writer, continuity of genre/story, and sufficient sequel quality can preserve or amplify that advantage; recasting, long gaps, poor fit and franchise fatigue can erode it.
- [ ] Keep followings scoped to film/franchise: sequels should inherit **some** earned audience interest but not copy the entire audience count, automatically sell tickets, or guarantee profitability. A weak sequel can lose fans and harm later franchise entries; a strong installment can revive dormant fans.
- [ ] Add optional low-micromanagement fan-engagement decisions (e.g. anniversary re-release, fan event, restored edition) using existing afterlife mechanics when eligible, with bounded costs/benefits, cooldowns and diminishing returns.
- [ ] Balance and QA across short films, features and other eligible media as appropriate, multiple regions and early/late careers; test long-term follower decay, exceptional sustained cult followings, sequel continuity, save/load and old-save initialization. Avoid runaway hype/revenue and inflated fabricated audience precision.

**Recommended rollout:** first repair My Filmography completeness (so all qualifying films can be viewed), then add film-following persistence/decay, display the metrics in Film Hub/monitor, and finally integrate a bounded sequel advantage. Gameplay is **planned only**, with parameters to tune through career simulations.

## High priority: Premiere must happen at release, not after screening ends (confirmed code risk; planned fix)

**Code audit (2026-11-21):** `engine.js` assigns `p.releaseWeek = state.week` when setting `p.stage = 'release'`, so premiere is an opening event. However, `ui.js` `currentPremiereReport()` returns `null` whenever `tutorialStep >= 0`; any unacknowledged premiere can be delayed until the tutorial closes. This is a presentation/timing problem, not a designed end-of-run premiere.

- [ ] Make premiere reports appear on the release transition even while the guided tutorial is active, pausing or minimizing the guide only as needed; preserve tutorial progression and navigation on dismissal.
- [ ] Distinguish **opening estimates** from actual subsequent weekly receipts, admissions/impressions and final earnings.
- [ ] Add a separate **End-of-Run / Release Wrap-Up** report at the end of a feature/short screening circuit, with actual reach, total receipts, gross and direct profit/loss, final reception and any initial fan following. Do not duplicate release rewards or mislabel it as a premiere.
- [ ] Correct the first-film tutorial's release step, particularly simultaneous premieres, completed historical releases, save/load, and optional replay handling. A queued report should not be silently delayed until a film finishes.
- [ ] Test the release-week transition with and without guided tutorial, multiple simultaneous releases, shorts/features/pilots, manual game progress, mobile UI and legacy saves.

## Clarify festival kit eligibility and information (code audit; existing behavior intentionally preserved)

**Current rule:** `shortPostReleaseQuote(id,'press')` accepts a **released short** within the first festival window when at least one scheduled festival remains unjudged, and the film has not bought its one kit. It does **not** require that its original screening run is still active. Preparing after screenings finish is therefore legitimate **if future juries remain**. The kit contributes +4 to future merit only, not past results or a guaranteed award. Encore screenings, separately, require the original run to finish.

- [ ] Make the Film Hub/Project Monitor explicitly state: `Screening complete; festival campaign still active` when relevant.
- [ ] Show the **next eligible festival**, its anticipated judging date, first-year eligibility deadline, price and exact future-only +4 merit effect in the in-game confirmation.
- [ ] Clearly disable/label the kit when no future judging remains, when already purchased, or after the festival window expires. Do not confuse "end of screenings" with "end of festival life".
- [ ] Consider a future optional pre-release festival-kit preparation window, but do not silently expand current eligibility without balancing/testing.
- [ ] Test kit timing during screenings, after screenings with future judging, after last jury date, save/reload and duplicate-payment avoidance.

## Planned gameplay: Studio-wide fans and followers (not implemented)

- [ ] Track a **studio fanbase** separately from film-specific followers: estimated active studio followers, loyal studio fans, growth/decline and an earned studio-fandom descriptor.
- [ ] Grow studio followers from consistently strong film quality, positive reviews, cumulative **distinct estimated** audience reach, repeat viewers, successful genres/franchises, awards, meaningful marketing and creator/studio identity. A single blockbuster can create awareness but not necessarily deep studio loyalty.
- [ ] Preserve a more stable core following while casual studio followers naturally decay during long gaps, declining quality, scandals/controversies or repeated failures. Exceptional studios can retain a durable following, but no endlessly growing fanbase.
- [ ] Let **film fans convert partially into studio followers** through repeat releases and creative consistency, without simply summing every film's followers. Existing studio fans can provide a **small bounded opening awareness/reach boost** to new films, weighted by genre fit; sequel-specific loyal fans remain the stronger source of franchise demand.
- [ ] Show studio followers and trend in **Overview / Studio profile**, optionally with film-by-film contributions, and show a concise new-film opening awareness estimate during greenlight/marketing. Clarify that follower numbers are modeled people, not box-office tickets or households.
- [ ] Make studio brand/fandom distinct from existing **Fame, Buzz and Prestige**: fame = recognition, buzz = short-term attention, prestige = artistic standing, followers = people who regularly seek out studio releases. Keep the systems coupled but nonidentical.
- [ ] Provide rare, optional, bounded loyalty/community actions within current promotions or film afterlife; no new weekly chores. Avoid marketing loops, unlimited sequel boosts or trivial late-game dominance.
- [ ] Validate small versus established studios, different genres, 15/61-year careers, film/studio crossover, cooldowns, decay, resurgence and save migration. Use model estimates with restrained precision, not invented exact ticket sales.

**Implementation order:** fix missing films in My Filmography, correct premiere and tutorial timing, clarify festival-window UI, then integrate film fanbases followed by separate studio fanbase and bounded sequel/new-release advantages. All above are proposals, **not implemented**.

## Planned: More varied and less repetitive generated film titles (not implemented)

- [ ] Expand procedural title ingredients (phrasing, imagery, setting, character, conflict, emotional tone, genre and era); generate multiple title styles rather than recycling a few fixed templates.
- [ ] Match titles to a film's **genre, themes, story premise, format and tone**; avoid nonsensical combinations. Shorts, documentaries and major features should feel appropriately different.
- [ ] Track normalized titles across the current player's released films, planned projects and generated rival catalog; strongly prefer unused names, retry near duplicates, and reserve exact repeats for intentionally linked franchises, remakes or user-authored titles.
- [ ] Allow player-entered titles without automatic rewriting; intentional sequels retain recognizable franchise naming. Preserve existing saved titles and prevent retroactive renaming.
- [ ] Give rerolling a name genuinely different options rather than the same few titles with one swapped word.
- [ ] Validate generated names in early and 15/61-year careers for duplication rate, variety, genre fit, offensive/unintended combinations, save/load stability and runtime performance.

Goal: make the film industry feel varied without generating obviously repetitive, unrelated, or duplicate movie names. This is planned only.
