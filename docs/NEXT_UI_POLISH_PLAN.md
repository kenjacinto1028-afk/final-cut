# FinalCut — Next UI polish backlog

## Planned: In-game confirmation dialogs (not implemented)

- [ ] Replace browser-native `confirm()`, `alert()`, and `prompt()` interactions used for game decisions with consistent, themed in-game dialogs.
- [ ] Cover all confirmations, including purchases, spending, sponsorships, festival kits, production decisions, destructive actions, save-slot deletion/overwrite, imports, and quitting or switching sessions when relevant.
- [ ] Each dialog clearly states the action and consequences, with descriptive Confirm and Cancel buttons; default focus on the safer option for destructive or costly actions.
- [ ] Support keyboard navigation, Escape to cancel, appropriate focus trapping/restoration, mobile touch targets, and accessibility.
- [ ] Prevent double-confirmation, duplicate spending, and accidental repeat actions; preserve existing game outcomes and save compatibility.
- [ ] Audit remaining native dialogs across the complete UI and verify with desktop/mobile browser tests.

Scope: UI/UX consistency only; no gameplay rebalance. This is a plan, **not a completed implementation**.
