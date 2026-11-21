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
