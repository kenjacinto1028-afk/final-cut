# Final Cut — Proposed v10 Film Festival, Awards & Rival World Expansion

**Status:** Design proposal from 2026-11-20 discussion; approved direction, **NOT IMPLEMENTED**. Existing v9 game code and prior versioned Library files must be preserved.

## What v9 actually does (checked in the released v9 ZIP)

### Festival calendar and film routing

- Six annual fixed festivals exist, one per tier: Local (week 8), Regional (16), National (24), Continental (32), International (40), World (48).
- The film's chosen festival tier is **not determined by the week it finishes**. The `festivalPlan` uses merit = `0.52 × quality + 0.48 × critic score + min(3, prestige × 0.04)`. Eligibility is `merit + 9 >= entryScore`; then a randomized fit-based ranking chooses among eligible festivals. Studio tier is not a gate.
- For **shorts**, one eligible festival is chosen on completion, and the result resolves **three weeks later regardless of the chosen festival's scheduled calendar week**. This timing differs from features.
- For **features**, up to three festivals are selected when the film releases. A chosen festival processes the film when its annual week occurs, as long as it was released during the past 52 weeks. A feature released at week 30 could enter the week-32 Continental event **if it is on the film's plan**, otherwise it might attend later events or earlier events in the following year.
- The festival outcome is an independent threshold/roll (`merit ± 11`; feature film adds up to 2.5 buzz points). **Currently no competing rival festival submissions are used in the prize calculation.**

### Existing prize catalog

| Tier | Week | Festival | Prize | Selection threshold | Prize threshold |
| --- | ---: | --- | --- | ---: | ---: |
| Local | 8 | Lakeshore Film Festival | Local Jury Prize | 43 | 67 |
| Regional | 16 | Red Mesa Film Festival | Regional Jury Prize | 51 | 74 |
| National | 24 | Northfield National Film Festival | National Grand Prize | 61 | 81 |
| Continental | 32 | Harbor Lights Continental | Continental Jury Prize | 71 | 88 |
| International | 40 | Northfield International | International Grand Prize | 81 | 96 |
| World | 48 | Golden Atlas World Festival | World Grand Prize | 91 | 104 |

- A festival currently produces **one main prize**, **Official selection**, or no selection; there is **no second/third place**. An official selection is **not a runner-up**.
- Shorts record their outcome as `Won`, `Official selection`, or `Screened` and gain income/fame/prestige depending on the result. Features get a festival-results record, buzz, fame, prestige, and talent-fame effects for prizes.
- Annual **Golden Reel Awards** occur at week 10 and judge feature films released the previous year. Categories: **Best Picture, Best Direction, Best Screenplay, Best Lead Performance**. These do have **nominations** (up to four candidates per category) and one winner per category, but do not award runner-up places.
- **Scoring issue to fix:** v9 `scoreCounts()` ignores short films before counting festival prizes and selections. Short festival success currently affects gameplay fame/prestige but **not** the festival part of the final score. This is an unintended disparity to address in v10.

### Existing rival baseline

- Four starting rivals; cap six active rivals. Starting tiers are Indie and Mid Studio. The current source has 24 handcrafted rival names, plus a generated fallback.
- Each year, if below cap and no upstart is scheduled, there is a 20% chance of scheduling a new studio after 6–20 weeks. Bankruptcies trigger replacement schedules. Existing rivals expand, shrink, compete on release dates, poach talent and contribute to Golden Reel nominations.

## Approved v10 design direction

### A. Larger, living rival ecosystem

- Start with **six active rivals**, with starting tiers **Indie or Mid Studio only**, mixed strategies and distinct profiles.
- Raise the absolute active-rival cap to **15**. Grow the ecosystem organically through the campaign rather than immediately spawning 15 studios. New openings, expansion, contractions and bankruptcies remain active.
- Increase the pool of handcrafted studio names to at least 40–50 to minimize generic fallback names across decades.
- Tune studio entry rate and production volume to avoid excessive film glut, huge cash loss, crowded log messages or repetitive release interrupts. Consider progressive entry pressure as decades advance; track active rivals per era in tests.
- Test rival competition in player box office, award nominations, talent poaching and studio growth; avoid a large implicit penalty to beginning Solo/Indie players.

### B. Awards beyond Golden Reel

Keep **Golden Reel Awards** as flagship ceremony and expand with distinct fictional ceremonies **gradually in world time**:

- **1980s:** *Critics Circle Honors* — critics, direction and screenplay, strong quality/prestige weight.
- **1990s:** *Independent Screen Awards* — shorts, independent features and breakthroughs; lower studio-size influence, no mandatory prestige gate.
- **2000s:** *Audience Spotlight Awards* — audience response, commercial reach and genre-specific popularity.

Start with one ceremony in 1970, building to roughly four by the 2000s. Ceremonies should use separate eligibility windows/categories/nominee results. A film can qualify for several if its release date, format and category fit; **award judging must not set a single global `awardsJudged` flag that blocks other ceremonies**.

### C. Gradually expanding festival world

- Retain the original six festivals and six tiers. Add **at most two additional specialized fictional festivals per decade** (e.g., ~6 in the 1970s, 8 in the 1980s, 10 in the 1990s, 12 in the 2000s, 14 in the 2010s and 16 in the 2020s), with varied focuses (documentary, genre, first-time director, shorts, prestige, audience).
- New festivals have founding years and only appear in the festival calendar after they begin. Each has an actual annual date, tier, eligible formats, and an identity that matters modestly for selection.
- Continue **automatic submissions**, but avoid automatic over-entry just because more festivals exist. Recommended cap initially: **initially one or two for shorts and up to three for features, rising with the festival world (up to three shorts and four features in later decades)**, configurable after simulations.
- Align short film result timing with a consistent, readable event-calendar model; no result should claim the film screened at an event months before that event occurs. Display upcoming event dates and expected wait in project details.
- Preserve the ability of exceptional tiny studios to reach high-tier festivals through quality; studio fame or prestige may give only a minor edge.

### D. Expanded festival outcomes and meaningful near-misses

- Keep original top prizes, add optional awards by film format and event identity (e.g., **Best Short Film**, **Best Feature**, **Audience Award** for appropriate festivals). Avoid requiring dozens of categories at every festival.
- Add a limited **Jury Special Mention / Runner-Up** result. Treat it as its own earned distinction with a modest reputation/revenue/score reward below main prizes and above mere official selection.
- Distinguish **Winner**, **Runner-Up / Special Mention**, **Official Selection**, and **Not Selected / Screened**. Do **not** count every official selection as a runner-up or double-count one result as two awards.
- Count festival achievements for **both shorts and features** in career history and final scoring, with sensible caps/weights to avoid short-film trophy farming.
- Ideally allow rival films to appear as festival competitors, with quality-based selection and luck. Keep results understandable and fair; do not substitute rival fame for film quality.

### E. Player-facing clarity and pacing

- Show planned festival/tier/expected date on a finished or released project and the reason a film may qualify higher (quality and critics score). Explain selection thresholds as approximate merit indicators, not promises of a win.
- Awards page: upcoming festival calendar, qualified works, selections, wins, special mentions, ceremony nominations, and an archive of past ceremonies.
- Keep passive headlines for ordinary selections and results; reserve blocking popups for major prizes, milestone breakthroughs or actionable decisions.
- Keep game file layout separated (`content.js`, `engine.js`, `ui.js`, `sim.js`); avoid unnecessary new management screens.

## Proposed work batches (not yet authorized as implementation)

| Batch | Work | Primary files | Best model |
| --- | --- | --- | --- |
| 1 | Festival short-vs-feature timing consistency, runner-up results, short scoring | `engine.js`, `ui.js`, `content.js`, `tests/regression.js` | GPT-6 High |
| 2 | Six starting rivals, 15-cap, entry pacing and market/award/talent scaling | `engine.js`, `content.js`, `sim.js` | GPT-6 High |
| 3 | Era-unlocked festivals and different festival identities | `content.js`, `engine.js`, `ui.js` | GPT-6 Medium |
| 4 | Multiple annual ceremonies and independent nomination histories | `content.js`, `engine.js`, `ui.js` | GPT-6 High |
| 5 | Full-horizon 1970–2031 simulations, save migration and browser regression | `sim.js`, `tests/`, `engine.js` | GPT-6 High |

## Acceptance tests

- A week-30 short is **not** automatically assigned Continental solely based on date; the displayed festival result and actual event calendar are consistent.
- Small-studio film with exceptional merit has a non-zero path to World-tier festival recognition; poor-merit films do not routinely win elite events.
- Winner, runner-up and official selection are tracked distinctly for features **and** shorts; both affect relevant scoring.
- Exactly six starting rivals, all Indie/Mid, grow toward but never exceed 15 active; bankruptcies and entries don't corrupt save state.
- Ceremony and festival availability changes only when the fictional world reaches the configured founding year; previously earned awards remain in history.
- Rival count and expanded awards do not flood the UI with popups, distort player economics, or slow simulated seasons beyond acceptable performance.
- Existing v9 saves load with a documented version migration; no original v9 files are overwritten.


## Companion v10 plan (2026-11-20 extension)

See `V10_FILM_HISTORY_AND_REGIONS_PLAN.md` for the new **My Filmography / World Film Archive**, permanent AI film credits and historical results, selectable regional release/distribution costs and revenues, and a festival-qualification review for low-budget default casts. That companion clarifies the approved **maximum two specialized festivals per decade** and increasing **multiple automatic festival entries per film** as new events open. Its archive/ID model should be built before major new rival output or ceremony histories. This remains a plan; no code is modified.

## Companion planning addition — studio origin and film rankings

`V10_HOME_REGION_AND_FILM_RANKINGS.md` now defines choosing any of five studio home regions at new-game setup, domestic-market defaults/migration, and a film leaderboard (Overall / Genre / Topic, plus commercial and critics/awards presets). For rankings to include up to 15 active rivals fairly, retain compact records for **all** completed AI films, with richer snapshots only for notable films. This is planning only; source and GitHub remain unchanged.
