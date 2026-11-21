# FinalCut v14 — Normal-start balance check (2026-11-21)

v14a–h are already merged and deployed. The accepted funded career check (GitHub Actions #44862463065) granted studios $40 million, tier 3 and high fame. Across its three sample strategies 96–100% of finished films were profitable. Those synthetic results validate stability, not normal-start economic balance.

## Additional coverage

The new test tests/v14_balance_followup.js runs the existing strategy simulator without injected capital or fame. It covers prestige, blockbuster, cheap genre and careful approaches in North America and Europe, two fixed regional seeds each, across entire careers. It reports studio survival, net cash, score, film flops, awards, rival quality and solvency, save size and save/reload integrity.

The workflow v14-balance.yml prints machine-readable V14_BALANCE_CASE and V14_BALANCE_SUMMARY entries. Warnings are leads for examination, not automatic acceptance failures. None of these tests modify gameplay mechanics or save formats.

## Conditions for gameplay tuning

Confirm a weakness over multiple real standard starts and regions. Preserve affordable indie strategies, meaningful commercial risk, award rarity, independent rival solvency and intact historical saves. After any financial or reward change rerun v14 integrated tests and legacy v13.1–v13.9 financial, awards, save and browser suites.

Status: automated diagnostic authored, awaiting CI figures.
