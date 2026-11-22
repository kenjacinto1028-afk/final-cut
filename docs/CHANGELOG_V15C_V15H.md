# Final Cut v15c–h — Living Industry & World Simulation

**Date:** 2026-11-22  
**Scope:** User-approved v15c through v15h, built sequentially on `main`.  
**Compatibility:** Existing save version **13** retained; new fields are optional and initialized for existing worlds.

## v15c — Rival studios with lasting ambitions
- Added deterministic, persistent rival personalities: **Competitive Challenger, Methodical Producer, Prestige Visionary, Industry Connector, High-Stakes Opportunist**.
- Rivals develop a named annual ambition based on their economic condition, studio strategy and personality. Ambitions and encounters persist in bounded histories.
- Risk tolerance affects actual rival financing; personality and relationships influence specialty films and direct release-date competition.
- Rival encounters change a relationship score; Industry → Rivals shows personality, current ambition, relationship to the player, and significant history.
- **Rival outreach (v15h integration):** player may initiate a paid meeting (maximum three studio meetings per year, one per rival per year). Success improves relations; failure slightly strains them. Good relations can unlock genuine co-development offers.

## v15d — Career ambitions, pay and real consequences
- Every working artist has a stable, derived age, career stage and creative ambition: critical acclaim, commercial breakthrough, secure employment or creative freedom.
- Fee expectations and elite recruiting fit respond modestly to ambitions. Recognition and current salary generate pay pressure.
- Highly underpaid or newly famous roster artists can make **one major salary request** per year, with options to raise their pay, promise a meaningful part, or refuse. Promises are fulfilled only if the artist actually joins a production within the year.
- Salaries and bonuses are booked to studio cash; strained morale and trust increase risk of losing an artist.
- Veterans can decline gradually; eligible artists may retire and cannot be rehired for new productions, although existing recorded credits remain.
- People → Talent Market / talent profile shows age, career phase, goals, peaks and pay expectations.

## v15e — Fan communities grounded in actual reach
- Existing film follower/loyalty model is retained. Bounded **community momentum** adds modest enduring interest based on actual modeled admissions, screenings or TV household impressions—not invented purchases.
- Occasional grassroots recommendations and backlash respond to genuine release quality and audience reception.
- Optional paid fan screenings/discussions have a cooldown (one per 52 weeks; at most three organized events per film), availability thresholds, and actual financial consequences.
- Film Hub shows community status, follower estimates, fan activities and available action.
- Community activity does not fabricate box-office gross or unique viewers.

## v15f — Real industry opportunities
- Conditional offers from specialty distributors, festival curators, replay/broadcast programmers and eligible rival creative collaborators.
- Each depends on real film activity, past reception, revenues, format and/or earned studio relationships.
- Offers expire, cap at two simultaneous and three per year, and must be reviewed in **Industry → News**; they appear in **Next Action** and the **Action Inbox**.
- Choices: **Accept**, **Counteroffer** (risk of losing the deal) or **Decline**. A film cannot sign the same offer type repeatedly.
- Payments/production costs, bounded creative effects and partner relationship changes are recorded to film and studio history, with cash and quarterly accounting updated.
- The system does not secretly replace existing licensing/royalty windows with fictional ones.

## v15g — The changing media world
- **1970–1989:** print, radio, TV and fan clubs.
- **1990–2004:** fan boards/websites join mainstream publicity.
- **2005–2009:** blogs, online reviewers and trailer websites.
- **2010–2019:** social networks, influencer and fan campaigns.
- **2020 onward:** short-form viral media and creator discussion.
- Quarterly attention comes from actual films and eligible pre-release publicity. Positive/negative conversations produce modest hype or fan-community effects; public statements do not guarantee profits.
- Players may fund a response or let a conversation pass; costs use cash and, while still in production, remaining approved marketing allocation.
- Industry → News displays the current media era, recent reports and actionable response windows. New Project also identifies the appropriate publicity environment.

## v15h — Integration, presentation and QA
- Added responsive management surfaces and clear buttons for offers, media response, fan community and rival outreach.
- `tests/v15_living_industry.js` covers persistent identities, paid outreach, earned salary requests, retirement, bounded fan momentum, transaction ledger, publicity periods, save compatibility and **two funded 15-year careers**.
- `tests/v15_living_browser.py` checks actual Rival/Talent/Film Hub/Industry interactions and 390px/320px viewports.
- `.github/workflows/v15_living.yml` runs v15c–h checks, preexisting v15a/b, v14.4 budget and v14.11 production lifecycle suites, and careful/prestige **standard-start simulations through 1982**.
- Fixed an outdated v14 browser test step to dismiss the optional v14.12 New Film recommendations modal, which otherwise blocks underlying buttons during the test.
- All phases preserve v15a greenlight marketing, v15b fully offline poster generation, and original saved history.

## Balancing and honest limits
- **Structural tests:** two funded 15-year careers completed without bankruptcy, producing 27 short-film releases each, with bounded living-world histories, valid studio books and successful save/reload.
- **Standard-start indicators:** one careful 1982 career remained alive but cash-negative (~$109k in debt-adjusted net cash), while a prestige career had a much larger surplus (~$3.88m). **These are not proof all playstyles are equally balanced.** Further multi-seed standard-start tuning is recommended.
- Industry opportunities are deliberately limited. The player remains free to ignore them without a forced modal.
- Tests simulate desktop/mobile Chromium; physical Android/iPhone testing remains outstanding.
- Social media is an in-game fictional simulation, not a real network connection or AI service.

## Where to find the features
| Feature | Menu |
|---|---|
| Rival personalities, outreach and ambitions | Industry → Rival Studios → select studio |
| Artist ambitions, contract requests, pay | People → Talent Market → select artist / Roster |
| Fan communities and screenings | Productions / History → Film Hub → Overview or Awards & Legacy |
| Industry deals, media culture and responses | Industry → News |
| Smart recommended follow-up | Dashboard → Next Action / Action Inbox |
| Original greenlight marketing strategy | Productions → New Project |
| Offline genre/topic/era poster design | Film Hub → Production / Project Details → Details |

**Next optional polish:** broader multi-seed standard-start playstyle balancing and physical-phone acceptance. Neither blocks the implemented v15c–h gameplay systems.
