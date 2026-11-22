# FinalCut v14.11 — Clearer film screens and critic review variety
Date: 2026-11-22

## Critic voices
- Future release reviews use expanded one- and two-sentence language chosen by **genre**, **story topic** and **rating band** (positive, mixed, or negative). Different reviewer slots vary subjects, sentence frames and occasional short closing observations.
- Numeric critic scores, publication tiers, review reach, publicity and award formulas are unchanged. Existing saved reviews are not retroactively rewritten.
- Test: `tests/v14_11_critic_voices.js` checks different genres and topics, output length, tier and rating invariants, and saved review persistence.

## Project monitor
- Stage-first condensed cards: film title, format, current stage (Development / Pre-production / Filming / Post-production / Screenings etc.), stage progress, quality, hype and this-week result.
- Graphs, audience estimates, direct film P/L, total receipts, follower/festival information and available special actions are retained behind **More details & actions**.
- Finished projects remain in Filmography/Film Hub rather than staying in active monitoring.
- The monitor is still user-collapsible, respecting existing preferences and screen width.

## Production Center and film details
- Production Center: **Overview / Manage / Performance / Timeline / Story** film-level tabs.
- Film Management includes a horizontally scrollable action row for Promotions, Budget, Distribution, Cast & Crew, Release and Festivals.
- Budget action uses recorded spending and budget allocation details where available; older projects show a simpler budget status without fake allocations.
- Unreleased Project Details: **Overview / Manage / Performance / Timeline / Story / Full Details** tabs.
- Released Film Hub retains its established tabs, adds **Manage**, and moves long timeline, financial postmortem and production materials out of Overview into their respective pages.
- Action destinations use existing authoritative game flows; stage eligibility remains governed by existing quotes and budget rules.

## Site-wide readability audit
- Inspected the Dashboard, Project Monitor, Production Center, Film Hub, Finance, Market, Roster, Talent, Rankings and Rivals.
- On Market, Rivals, Roster, Talent and Rankings, routine explanation paragraphs are collapsed into labeled help disclosures.
- Production Center KPI microcopy remains accessible through titles and screen-reader-only text rather than filling each KPI card with permanent footnotes.
- Responsive styles apply to smaller phones; tabs and film action controls scroll horizontally within their own panel.
- No save-schema changes or production-economy rebalance.

## Regression coverage
- `tests/v14_11_readability_browser.py`: active monitor, stage, tab navigation, budget fallback, disclosures, finished-film removal and mobile overflow.
- `tests/v13_5_production_center.js` updated to navigate the new tabs.
- `.github/workflows/v14_11.yml` runs Node syntax, critic, legacy film center, and Playwright layout checks.
