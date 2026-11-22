# FinalCut v14.12 — Contextual Film Action Recommendations
Date: 2026-11-22

## What changed
- Greenlighting a film from **New Project** now presents one optional, dismissible **Recommended Next Actions** popup. It displays up to three grounded suggestions and the same action links available in Production Center. Guided tutorial flows stay uninterrupted.
- A compact recommendation panel appears in the **Production Center Overview**, **Manage** tab, unreleased **Project Details**, and released **Film Hub Overview/Manage**. It adapts automatically to the film's stage; it doesn't generate weekly forced popups.
- **Early lifecycle:** suggestions consider eligible promotion campaigns, sponsorship offers, optional budget allocation review, home-only distribution, strained cast/crew relationships, and post-production release preparation. Early quality *ranges* are clearly labeled estimates.
- **Screening & release:** the suggestions use actual stage, recorded hype, critics/audience when available, studio receipts, short festival timing, and real promotion quote eligibility. They route to existing publicity, festival, or Performance pages rather than generating new unpriced spending actions.
- **Completed projects:** proven stories can receive sequel/adaptation suggestions; eligible short films can be directed to existing encore/festival actions; completed features may be directed to eligible license, retrospective, or cult-release options. Rejections and expired offers do not appear as actionable.
- Each suggestion describes **why it matters**, cost or financial implications, uncertainty, and an immediate **Review** shortcut. **Later** snoozes the individual recommendation for four in-game weeks; **Dismiss** hides it for that film and production stage.
- **Next Action** and the **Action Inbox** use the highest-priority unreviewed suggestion after urgent matters. Reviewing a suggestion marks its task as reviewed, without purchasing anything or blocking production.
- Preferences are stored per film in the existing save structure. Existing campaigns remain compatible, without schema/version migration.
- The panel shows only currently affordable, relevant options, and gracefully disappears when no action is eligible.

## Guardrails
- Recommendations are optional: no automatic greenlight, marketing purchases, sponsorship signature, distribution contract or spending.
- All financial and availability gates continue to use the existing engine quote functions and player confirmation.
- Estimated audience reach/quality are labeled, and promotional effects or sequel success are never guaranteed.
- The recommendation feed is not an additional event-roll system; it reuses established film controls and is distinct from the v14.11 lifecycle decisions.

## Testing
- `tests/v14_12_recommendations_browser.py` tests the actual New Project greenlight popup, maximum three cards, direct routing, phone-width layout, stored dismissal and snooze, stage changes, catalog eligibility and no-action fallback.
- `.github/workflows/v14_12.yml` also checks JavaScript syntax, original production behaviors, and the v14.11 readability regression.
- Added an accounting consistency fix: post-release lifecycle hype changes update the recorded hype breakdown rather than leaving its total stale.
