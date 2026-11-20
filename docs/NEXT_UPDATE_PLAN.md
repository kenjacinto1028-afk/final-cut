# Final Cut — Approved Update Plan (Implemented v9)

Status: **user approved implementation; batches A–F implemented on 2026-11-20, batch G regression-tested.** See `CHANGELOG_V9.md` and `TEST_REPORT.md`. Keep files separated; this document preserves the original agreed scope.

## Approved scope

1. **Topics and market:** Expand from 16 to 25 topics with nine additions: Organized Crime, Political Conspiracy, Sports Underdog, Medical Crisis, Espionage, Coming of Age, Supernatural Mystery, Time Travel, Celebrity Scandal. Existing and new topics should influence genre fit and fluctuating market demand, visible during project planning. Avoid stacking modifiers to the point genre and topic are mandatory for success.
2. **Festivals:** Six tiers — Local, Regional, National, Continental, International, World. Automatic selection/submission to suitable festivals, with exceptional small-studio films eligible for elite recognition. Selection and rewards should balance quality, critical merit, relevance, fame, and chance; summarize routine outcomes without repeated modal popups.
3. **Improve existing systems:** Strengthen interactions among production choices, talent, TV, rivals, critics, fame, prestige and project outcomes without creating new management screens or new resource meters.
   - **Reputation influencing recruitment (added):** Current studio fame, critics' reputation and prestige should help attract stronger artists and improve attainable employee quality, without creating a new reputation stat. Higher-reputation studios gain an advantage in negotiations/availability; strong scripts, suitable roles, creative fit, fair pay, or prestige can still enable small studios to recruit top talent. Preserve affordability and availability constraints. For existing department-based employees (not individually named), represent recruitment quality through existing skill, hiring costs and morale mechanics. Avoid hard tier locks, forced individual employee micromanagement or guaranteed elite hires. Rival poaching and talent retention should respond modestly to fame/prestige, work success, compensation and morale.
4. **Balance:** Tune early-game survival, local hires, fame saturation, studio growth, late-game profit snowball, awards, TV, contract behavior and strategy variety; measure across all growth stages and playstyles.
5. **Popups:** Reserve blocking decisions for meaningful events; route routine updates to Studio Wire/log; add contextual event variety and recent-event cooldowns; avoid repetitive interruptions.
6. **UI redesign:** Use user-provided screenshot as reference: charcoal sidebar, warm ivory main area, cinema-inspired details, stronger readable text, distinctly contrasting primary/secondary/danger/disabled buttons, clear card hierarchy, better spacing, news feed, tables and project status.

## Implemented sequence (v9)

| Batch | Changes | Primary files | Suggested effort |
|---|---|---|---|
| A | Topic catalog, genre fit, topic market signals | `content.js`, `engine.js`, `ui.js`, `sim.js` | GPT-6 Medium |
| B | Festival tiers and auto-submissions | `content.js`, `engine.js`, `ui.js`, `sim.js` | GPT-6 High |
| C | Deepen existing systems, **reputation-driven artist and employee recruitment** | `engine.js`, `ui.js`, `sim.js`, selectively `content.js` | GPT-6 High |
| D | Event variety, popup cooldowns, feed routing | `content.js`, `engine.js`, `ui.js` | GPT-6 Medium |
| E | Multi-strategy balancing and regression testing | `engine.js`, `sim.js`, selectively `content.js` | GPT-6 High |
| F | Visual refresh and button contrast | `style.css`, `ui.js`, optionally `media.js` | GPT-6 Medium |
| G | Full regressions, browser walkthrough, long-run sims | `sim.js` and test outputs | GPT-6 High |

## Recruitment acceptance criteria

- Studio reputation visibly helps recruiting but does not guarantee top artists or employees.
- A low-fame studio can occasionally secure exceptional talent through creative fit, good material and suitable pay.
- Department hires can improve average staff skill without requiring new named-employee management.
- Hiring and retention costs have safeguards so small studios remain viable and big studios do not automatically monopolize everyone.
- Rival recruitment and exclusive contracts remain playable; unchanged saves remain stable, or save version is updated if necessary.
- Simulations include recruiting outcomes across low, medium and high studio reputation.

Original v8 ZIP is preserved. The v9 build is in separated project source files and its own Library version folder. Remaining balance and human-playtest gaps are in `TEST_REPORT.md`.
