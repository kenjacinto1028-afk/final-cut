# FinalCut v14.4 — Flexible production, continuing stories and series careers

**Status:** Released on `main` by PR #14 at commit `077d0b3` on 2026-11-21. GitHub Pages deployment #44886842728, integrated gameplay QA #44886843928 and normal-start balance #44886843844 succeeded. Follow-up budget/TV tuning is in `docs/CHANGELOG_V14_4A.md`.

## New project workflow
- Select a media variant: micro-short, short, mid-length (all use the established short-film screening/festival engine), feature, TV pilot or web episode. Web episodes unlock in 1995 and use a web-commissioning branch of the TV/pilot engine, not theatrical releases.
- Choose an exact **spending cap**, separate from studio cash, with descriptive media-specific Micro/Low/Mid/High classification rather than a compulsory fixed tier. Select intimate, standard or ambitious production scope and a creative vision.
- Choose the cast/director/writer/crew **before** assigning production funds. Studio-roster contracts and founder roles remain available. Talent fees and optional script rights subtract from remaining funds.
- Use sliders for development/pre-production, filming, post-production, marketing, distribution and contingency; Balanced, Craft-first, Audience-first, Lean presets provide defaults. The engine rejects allocations exceeding the project cap and reveals feasibility, scope-specific funding gaps, estimated quality effect and possible extra weeks.
- Greenlighting charges hired talent and screenplay rights once, not the entire budget. The plan is stored per film. Prior v13 projects and saves without a `budgetPlan` follow the original budget system.

## Production and financials
- Routine production spending occurs every week from the corresponding stage allocation, not the single `budget/weeks` payment. Delays can consume unused reserve; if none remains, production quality can suffer.
- Expenditure for optional film promotion, launch marketing and regional distribution honors available allocations. Existing feature release decisions stay available; other film activities such as extraordinary post-release promotion are still separate expenditures, beyond the original greenlight cap.
- Film Hub displays planned, spent and remaining funds per bucket; limited optional reserve transfers and an explicit cap increase are available during production. An increase does not deduct cash until actual spending occurs.
- Cash flow includes regular studio salaries, office payroll, debt and overhead **outside** the per-film cap. Distinguish in-progress feasibility estimates and modeled audience counts from assured outcomes.
- Theatrical opening and craft bonuses are tied to financed production, not unspent contingency.

## Cross-media properties
- Eligible released player-owned shorts, feature films and TV pilots may continue as direct sequels, spin-offs or cross-format adaptations. Eligibility follows actual reception, not an automatic success guarantee.
- The player can change format and budget while creating a follow-up, then hire a new cast. Source-franchise links and returning-cast continuity are persisted, while all projects get independent quality, criticism, screenings or pickup and finances.
- Existing fee formulas use an artist's current fame; talented people can charge more after successful prior projects. Returning key artists help opening awareness, while recasting can weaken continuity without automatically making a film bad.
- Existing rights and awards are not copied into a continuation.

## TV/web series
- The first pilot remains independently greenlit and may be rejected. If it earns a series order, each season tracks episode count, unit cost, network/platform fees, ratings, histories and production scope.
- New flexible series allow 4–16 episodes. At renewal, audience strength and cast fame affect a bounded new episode-cost quote; players may keep stars, run lean or recast and adjust episode count/scope. Existing seasons are not unexpectedly repriced.
- Sustained episode ratings may earn a fictional local/regional/national sponsor *offer*. Players may accept or decline; signed deals pay only for episodes actually aired, and are recorded once. Sponsor interest does not guarantee positive margins.
- Successful series can raise credited cast fame. Web series are era-gated and report **modeled online view estimates**, not TV household impressions.

## Save compatibility and known limitations
- The persisted save schema remains v13, with optional per-project and series fields. Historical releases are not retroactively rewritten.
- Legacy films and series use the old production and renewal formulas; only newly greenlit films with a flexible `budgetPlan` opt in.
- Mid-length films currently use the short-film screening/festival path; web episodes use the pilot/network commission core with a web-specific wrapper. They are not yet distinct standalone audience markets.
- Studio overhead is still outside the film cap. Exceptional festival costs or post-release actions remain separate decisions; the UI should not describe total company cash commitments as identical to the project cap.
- Rival studios retain their pre-v14.4 simplified budgets. New rival media variants / AI allocation strategies and true season-by-season contract negotiations require a separate scoped release.
- Physical Android/iPhone device memory, browser storage and performance need real-device validation.

## QA
- New: `tests/v14_4_budget.js`; `.github/workflows/v14_4.yml` runs this test, legacy economy tests and Chromium UI smoke suites.
- Preserve pre-v14 save compatibility, new cap allocation conservation, stage expenditure, no double-charged promotions, independent franchise results, sponsor payments and series salary pressure.
- Only mark released when the PR and main-branch regression gates and Pages deployment succeed.

