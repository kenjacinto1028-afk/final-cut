# FinalCut v14 — Normal-start balance check (2026-11-21)

v14a–h are already merged and deployed. The accepted funded career check (GitHub Actions #44862463065) granted studios $40 million, tier 3 and high fame. Across its three sample strategies 96–100% of finished films were profitable. Those synthetic results validate stability, not normal-start economic balance.

## Additional coverage

The new test tests/v14_balance_followup.js runs the existing strategy simulator without injected capital or fame. It covers prestige, blockbuster, cheap genre and careful approaches in North America and Europe, two fixed regional seeds each, across entire careers. It reports studio survival, net cash, score, film flops, awards, rival quality and solvency, save size and save/reload integrity.

The workflow v14-balance.yml prints machine-readable V14_BALANCE_CASE and V14_BALANCE_SUMMARY entries. Warnings are leads for examination, not automatic acceptance failures. None of these tests modify gameplay mechanics or save formats.

## Conditions for gameplay tuning

Confirm a weakness over multiple real standard starts and regions. Preserve affordable indie strategies, meaningful commercial risk, award rarity, independent rival solvency and intact historical saves. After any financial or reward change rerun v14 integrated tests and legacy v13.1–v13.9 financial, awards, save and browser suites.

Status: normal-start balance and large-save repair verified in GitHub Actions; remaining economic tuning and real-device long-save performance are outstanding.

## Initial eight-career baseline (Actions #44864111660)

Normal-start full-career runs passed simulations. Net cash: prestige $404–456m, blockbuster $1.96–2.07bn, cheap $36.8–49.2m, careful $262.8–295.9m. Careful had 0–1 feature flops, rival quality lagged the prestige/major studios by roughly 20–26 points, and raw save JSON was 7.9–8.6 MB. All eight returned false from the simulated 5MiB active-save roundtrip. The new exact packed-size instrumentation will determine whether this is a quota limit or another test defect. These are synthetic bot outcomes, not predictions for human players.

## Confirmed active-save capacity bug and remediation

Measured compact FCP1 payloads in #44864296282: 5.45m–6.02m characters across all eight long careers, exceeding the explicit simulated 5MiB browser budget. The game previously swallowed a quota failure by returning false from Engine.save(). FCP2 is a new backwards-compatible, lossless LZW layer for lifetime-size active saves only; no currency, award, or campaign data is removed. Plain JSON and FCP1 continue loading. Dedicated tests verify Unicode, synthetic giant history, real engine save/reload under the quota and older versions. CI must prove 8/8 standard-start long career saves now roundtrip before marking fixed.

## Verified release outcome (2026-11-21)

GitHub Actions normal-start #44864678832, integrated v14 + legacy/browser #44864678975, Pages deployment #44864678165: all successful.

Eight 61-year strategy/region histories that previously failed 5MiB active-save writes now **all 8/8** complete save/reload with the additive FCP2 codec. Measured older packed length 5.45–6.02m characters; improved new packed length 1.84–2.05m. FCP2 simply wraps the exact older FCP1 or JSON payload with additional lossless compression. Plain JSON, FCP1 and v13 save slots remain loadable. Large synthetic Unicode/film-history regression: 17.72m raw characters, 2.52m packed, 3.4s encoding on GitHub's Linux Node runner (not a mobile performance benchmark).

Remaining observations, not fixed by save repair: across two regions blockbuster bots ended near $2.0bn net cash, cheap studios around $40m; careful studios recorded 0–1 feature flops over 61 simulated years; prestige/careful/blockbuster films averaged 20–26 quality points above rivals. These bots produce hundreds of films and are not a human-playtest proxy. The raw save JSON may still exceed 8MB, but this is **not** an active-storage failure now that the actual compact payload fits. Future tuning requires many more starts and regression testing, with special attention to late-game mobile save latency.

## v14.1 experimental balance pass (not accepted yet)

Candidate knobs: high-budget box-office scaling 0.89 → 0.86; bounded additional high-budget reach penalty only above reference budget ($350k); 26-week same-genre audience saturation (up to 16%); per-film box-office luck lower bound 0.70 → 0.64; rival paid-talent craft contribution increased and strictly tied to actual hired crew. These affect future releases only and retain the save format. Running comparative simulation/regressions before release; exact results TBD.
