# FinalCut v14.10 — Active Work, Annual Strategy & Follow-ups
Date: 2026-11-22

## Gameplay and UI
- Next Action uses one real task priority queue: pending creative decision, premiere/end-of-run/year-end report, financial warning, expiring contract, accepted annual plan, theatrical performance, and active production. It no longer opens a random film repeatedly. When there are no tasks, it is disabled as **All caught up**. The hover title describes the target.
- Persistent Project Monitor tracks only in-production and currently releasing works. Once the simulation marks a film **done**, its card is removed, including finished shorts with residual income. Filmography, Film Hub, and Archive keep the film and its full records.
- The existing Year-End Honors popup adds **Plan Next Year** following the award reveal. The plan shows recorded release count, awards, closing cash, and direct film profit/loss (explicitly excluding studio overhead).
- Recommends at most five applicable opportunities from: sequels, cross-media adaptations, acclaim, talent renewals, catalog revivals, international release strategy, long-term partnerships, rival-release analysis, real market trends, sustainable budgets, and studio identity.
- Players can **Accept**, **Postpone** or **Dismiss** suggestions. Accepted actions appear in the Action Inbox and Next Action priority queue; selecting one opens the appropriate existing project or management screen. Opening marks it reviewed, not automatically completed economically.
- Choose **up to two annual priorities** from Profitability, Prestige, Franchises and Emerging talent. Previously chosen priorities raise the relevance of matching recommendations in subsequent annual reviews.
- Annual plans remain accessible in Studio Profile and the year-end replay. Legacy saves load with an empty `yearPlans` array and preserve v13 save version.
- Annual planning is advisory, not an automatic expenditure, sequel greenlight, contract renewal, performance guarantee, or additional simulation cost.

## Implementation
- `ui.js`, `engine.js`, `design-v14_7.css`
- `tests/v14_10_browser.py`, `.github/workflows/v14_10.yml`
- Updated legacy dashboard and finished-short monitor expectations to match the new intended lifecycle.
