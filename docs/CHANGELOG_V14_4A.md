# FinalCut v14.4a — Funding integrity and TV renewal balance

Status: **released** on 2026-11-21. PR #15 merged into `main` as `d0e8cb7`; all nine PR checks succeeded and GitHub Pages deployment #44887771506 was successful.

## Changes for new flexible-budget projects

- Pilot pickup and passed-development fees are calculated from **actually financed** development, shoot, post, screenplay and talent—not unused spending caps. Existing legacy pilots use their original budget formulas.
- Film sponsor offers for flexible projects scale with **production already funded and recorded marketing/distribution spend**, not a large unspent reserve. Sponsors remain optional, fame/current attention-gated, and one-time per film. Signing early may pay less than waiting for production progress.
- Optional film promotion quotes scale with the actively planned non-contingency project budget. Promotions still require real cash and enough marketing allocation; no free hype was added.
- For newly commissioned flexible TV/web series only, bonus episode income is capped at 22% of that episode's cost. Pre-v14.4 contracts keep existing rating bonuses.
- Proven ratings can command up to an extra 16% negotiated *next-season network/platform fee raise* above the ordinary 13% annual raise. Popularity-based cast salary jumps, sponsorship uncertainty, renewal cancellations and lean/recast tradeoffs remain.
- Old series, past releases and v13 save files are not retroactively repriced.

## Balance evidence

The earlier v14.4 merged main passed 8 complete normal-start 61-year simulator careers across North America and Europe, including save roundtrips. Those bots still use **legacy** project greenlighting, so they are compatibility/overall economy checks, not evidence of flexible budget equality. They showed mean final cash: prestige $276.3m; blockbuster $887.2m; cheap $32.8m; careful $209.8m. The careful strategy had just 7 mean feature flops over 61 years and player/rival quality disparities remain. These are flagged for further targeted balancing rather than overcorrecting previously accepted v14.1 parameters.

New `tests/v14_4a_balance.js` exercises a $300k flexible cap with only about $6.3k of funded stages, a high-fame actor renegotiation, bounded bonuses, an untouched legacy-renewal control, and independent normal-start allocations across lean/craft/audience/balanced presets. Each scenario logs production funds, sponsor offer, licensing payment, contract economics, survival, spend and receipts. The four eight-year normal-start samples are exploratory, not causal strategy rankings; random markets and decisions influence results.

## Release requirements and known boundaries

Gate: `node tests/v14_4_budget.js`, `node tests/v14_4a_balance.js`, the full v14 integrated and v13 legacy suites, Chromium UI tests, PR merge and successful GitHub Pages deployment. Long-horizon TV fanbase/renewal distribution still deserves wider seeded tuning; Android/iPhone physical performance is not established. Rival project budgets remain simplified compared with the player.
