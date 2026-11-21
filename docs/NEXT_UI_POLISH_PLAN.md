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
