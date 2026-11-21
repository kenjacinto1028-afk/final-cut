# FinalCut v13.8 — Filmography financials and live project performance

## Why Filmography showed $0
The previous **Gross** column displayed **theatrical box-office gross** for all formats. Shorts and pilots do not sell feature-film tickets in FinalCut, so a short could earn screening receipts while showing `$0` gross. This update separates the sources transparently rather than changing past accounting.

## Filmography
- Box office: only feature films. Non-theatrical shorts/pilots display **—** rather than misleading $0 ticket sales.
- Studio receipts: all recognized income credited to the project, including film revenue share, festivals/screenings, pilot/network deals, post-theatrical windows and reissues.
- Direct profit / loss: **studio receipts minus the project's direct recorded spending** (fees, production, marketing and distribution). Studio-wide shared overhead is not assigned to projects.
- Estimated admissions: simulated feature-film ticket gross divided by an **assumed** 1970 ticket price of $1.50 and 3.1% annual growth. It is clearly labeled a model estimate, **not measured viewers**.
- All-release summary totals for box office, studio income, net P/L and release count, plus search/ranking controls.

## Persistent monitor
The Software Inc reference informed the compact **right-side Project Monitor** without copying its gray workstation aesthetic. It remains consistent with FinalCut's cinematic A+B charcoal/sage/brass design.
- Available from any playing screen; opens by default on wide desktops and can be collapsed via the top bar.
- Stage, stage progress, release week, current week's genuine gross/receipts, lifetime studio income, estimated admissions when meaningful, and direct P/L.
- Last seven recorded weekly gross or revenue bars on each displayed title, with click-through to the project detail drawer.
- Shows production, theatrical, outstanding rights windows and recent completed films without overwhelming the screen.
- Responsive mobile overlay with a close button; desktop reserves space for the dock, so it does not cover central content.

## Postproduction engagement
- Full Production Center and original project drawer now expose real weekly revenue bars, box-office trends, budget, total receipts and P/L.
- Feature films can pay for **one** optional post-opening publicity push after their first theatrical week and before the seventh. Actual studio cash and direct film costs increase by the disclosed quote; future ticket demand may rise modestly and temporarily. It does not promise profit.
- Festival shorts and TV pilots show real receipts and no invented headcounts.

## Engine and backwards compatibility
- Actual project income/gross/spending differences are recorded at the end of each simulated week. History is **bounded to the latest 32 meaningful weeks per project** to keep lengthy game saves manageable.
- Old v13 saves load unchanged. Historic box office and finance totals are preserved. **Past weekly data is not fabricated**; graphs begin when the upgraded build records new weeks.
- Ticket estimates for existing features are reconstructed only from their actual gross and the explicitly modeled ticket price, never presented as measured admissions.
- Film audience ratings (e.g. 65/100) are **not** attendance counts and should not be confused with admissions.
- Simulation finances, awards, other screen logic and independent save slots are preserved.

## Tests
`tests/v13_8_film_finance.js` tests income reconciliation for shorts/pilots/features, one-time promotion costs, ticket conversion, weekly history bound, rights revenue and legacy save loading. `tests/v13_8_film_monitor_browser.py` checks Filmography, live side monitor, project detail, production screen, publicity action, browser reload and mobile accessibility with screenshots. The existing v13.4/13.5/13.6/13.7 regression tests are also included in `.github/workflows/film-performance-v13_8.yml`.
