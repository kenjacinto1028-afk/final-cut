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
