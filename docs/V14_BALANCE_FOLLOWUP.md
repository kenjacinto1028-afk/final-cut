# FinalCut v14 — Normal-start balance check (2026-11-21)

v14a–h are already merged and deployed. The accepted funded career check (GitHub Actions #44862463065) granted studios $40 million, tier 3 and high fame. Across its three sample strategies 96–100% of finished films were profitable. Those synthetic results validate stability, not normal-start economic balance.

## Additional coverage

The new test tests/v14_balance_followup.js runs the existing strategy simulator without injected capital or fame. It covers prestige, blockbuster, cheap genre and careful approaches in North America and Europe, two fixed regional seeds each, across entire careers. It reports studio survival, net cash, score, film flops, awards, rival quality and solvency, save size and save/reload integrity.

The workflow v14-balance.yml prints machine-readable V14_BALANCE_CASE and V14_BALANCE_SUMMARY entries. Warnings are leads for examination, not automatic acceptance failures. None of these tests modify gameplay mechanics or save formats.

## Conditions for gameplay tuning

Confirm a weakness over multiple real standard starts and regions. Preserve affordable indie strategies, meaningful commercial risk, award rarity, independent rival solvency and intact historical saves. After any financial or reward change rerun v14 integrated tests and legacy v13.1–v13.9 financial, awards, save and browser suites.

Status: automated diagnostic authored, awaiting CI figures.

## Initial eight-career baseline (Actions #44864111660)

Normal-start full-career runs passed simulations. Net cash: prestige $404–456m, blockbuster $1.96–2.07bn, cheap $36.8–49.2m, careful $262.8–295.9m. Careful had 0–1 feature flops, rival quality lagged the prestige/major studios by roughly 20–26 points, and raw save JSON was 7.9–8.6 MB. All eight returned false from the simulated 5MiB active-save roundtrip. The new exact packed-size instrumentation will determine whether this is a quota limit or another test defect. These are synthetic bot outcomes, not predictions for human players.
