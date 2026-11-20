# Final Cut v12 — Batch F Expanded Scope

**Status:** Implemented and tested in v12. **Source:** v12 A–E local working build (`/mnt/data/finalcut_v12_work/FinalCut`). Do not modify or publish the released v11 game until the expanded F implementation and regression pass are complete.

## Confirmed starting point (inspected v12 source)

- Sequel projects exist with a franchise identifier, increased initial awareness and rising expectations, but there is **no returning-cast continuity reward or recasting penalty**. Starting a sequel currently clears all four role selections (director, writer, lead, key crew).
- Every production has exactly four named role slots (`director`, `writer`, `lead`, `crew`), regardless of budget. Studio departments are aggregate headcounts with average skill and morale; they are not individually named.
- Actors, directors, writers and named specialist crew have a drawer with skill, fame, recognition, reliability, traits, contracts, a short recent-work list, awards totals and credits on **player** productions. They do **not** have complete world filmographies or persistent controversy timelines.
- Current annual ceremonies recognize Best Lead Performance, Direction and Screenplay; there is no separate Supporting Performance or specific technical crew award. Artist award tallies are aggregates; film-level categories can also grant credit to the whole attached cast rather than only the directly recognized individual. This should be corrected when individual award history is added.

## F1. Sequel continuity and recasting

- When launching a sequel, preselect/suggest **original named leads**, directors and writers if available. Do not automatically sign anyone or bypass availability, fees, contracts, or talent willingness.
- Snapshot stable person IDs (not just names) from the original film. If they left a previous roster, still allow fresh negotiations. For old saves where IDs cannot be reconstructed, show continuity as unknown and do not invent returning credits.
- Returning principal performers increase opening awareness based on their prior billing, recognizability and reception; avoid rewarding irrelevant background roles equally.
- Recasting a principal actor loses part of the nostalgia/hype benefit; a particularly well-known original lead means a larger loss. No automatic reduction to inherent film quality. The replacement's **skill** can increase quality, and their **fame** can recover some marketing appeal.
- Continuity of original director/writer improves audience recognition and creative consistency modestly. Different creative leads can still produce better movies; avoid hard requirements.
- Sequel contract fees may rise after breakouts. Display a clear **Returning cast / Recast / Unavailable** status and an estimated *quality vs hype vs fee* comparison during sequel planning. More installments bring fatigue and expectations; returning people do not nullify that risk.
- Player and AI sequels should follow comparable principles when sufficient AI cast data exists. Avoid regressions in older AI film records that have no identifiable credits.

## F2. Scale project cast and crew without micromanagement

- Preserve base slots (director, writer, lead, key crew). Add optional **supporting actors** and **specialist production crew** slots according to feature budget/format scale. Recommend 0–1 additional actor for small productions, 1–2 for medium, and up to 3 for high-budget films; include parallel capped specialist crew choices. Exact caps should be tuned in simulations rather than hard coded from this planning note.
- Distinguish **named hired professionals** (credited and career-trackable) from **temporary background production staff** (headcount package/extra expense, not 100 individual biographies). Do not turn the game into payroll micromanagement.
- Extra named personnel cost explicit fees; temporary staffing adds weekly costs. More people can improve quality, reliability or hype in a bounded, role-dependent way, but diminishing returns and coordination overhead should prevent guaranteed masterpieces.
- Keep all recognition tiers castable at every studio scale subject to budget, availability and terms. Larger budgets enable ensembles, but do not impose arbitrary fame/tier gates.
- Ensure new slots appear in the film planner, fee preview, contracts, project stages, film archives, sequels, AI release records, and migrated saves. Fees should reduce production resources as in current mechanics.

## F3. Complete career records for named artists; sensible employee detail

- Add an **Artist Career** section (or full-page view opened from the existing talent drawer) for **actors/actresses, directors, writers, named specialist crew**. Use one person identifier across player and AI films.
- Show craft, fame, recognition tier, regional reputation, specialties, reliability, traits, age/career phase if already grounded, employer/contract status, and changes over time.
- Link to a **chronological filmography** of all credited player and AI projects that can be identified reliably, with role, release year, critical/audience reception, grosses, festivals, nominations and wins.
- Maintain a chronological **career timeline** for breakthroughs, slumps, comebacks, retirements, contract changes and relevant public controversies. Existing scripted incidents can populate this only when an identified participant and impact were recorded; do not fabricate retroactive history. Repeated controversies should be rare, should have consequences such as temporary publicity or reliability/negotiation changes, and should not overwhelm gameplay.
- **Department employees currently have no individual identities.** Keep routine department members as aggregated headcount/skill/morale. If richer careers are desired for staff, expose optional **named key department heads** with modest career and work histories; they should not create individual daily HR actions.
- Make filmographies and historical credits durable when people retire, change studios or a rival goes bankrupt. Bound saved timeline detail so 60-year saves remain performant.

## F4. Individual acting/creative/technical awards and correct attribution

- Preserve existing awards and festival prestige. Add *Best Supporting Performance* when films have supporting actors, and a small curated technical category set linked to real named specialties: *Best Cinematography*, *Best Editing*, *Best Original Score*.
- Keep categories appropriate to each ceremony; do not add every category to every festival/award. Technical categories and nominations must have an eligible credited professional, not a generic department headcount.
- Record nominations/wins by **person ID, film ID, role, ceremony, category and year**. Display them both on each artist's career page and on the film's award history.
- Correct any over-broad tally: a Best Picture win belongs primarily to the **film/studio**, not automatically as an acting/directing/writing award for every cast member. Only properly credited individuals receive personal award wins; team appreciation/fame can still be a smaller separate effect.
- Nominees from rival films should be eligible where identifiable. Use a restrained number of winners, stable yearly judging and skill/film fit rather than fame alone.

## F5. Balance, tuning and comprehensive validation

- **User explicitly requested balancing and tuning in Batch F**, not just regression testing. Tune sequel continuity/recasting penalties vs fame and skill, total casting costs, staff salaries, extra-person benefits, awards scarcity, career growth, AI competition, TV/economy, and reputation saturation.
- Validate cheap/high-volume, prestige, blockbuster and careful/balanced studio strategies at several regions and multiple seeds through the full 1970–2031 campaign. Benchmark against v11/v12 A–E, including bankruptcy, average margins, award counts, save file growth, and rival competitiveness. Bankruptcy is allowed, but avoid extreme or inexplicable swings.
- Test all casting/recasting combinations (original cast available, unavailable, retired, contract-bound; changed lead vs returning crew; high skill/low fame replacement), fee caps, save migration and permanent careers/award histories.
- Run JavaScript syntax and v9/v10/v11/v12 regression suites, new F feature tests, real-browser desktop/mobile playthroughs, local image poster persistence and export/import. Fix blocking issues before any GitHub merge.
- If completed and explicitly directed, publish a versioned v12 release to `main` with a ZIP, changelog, test report and updated checkpoint. Until then GitHub `main` stays on v11.

## Implementation effort / model choice

| Workstream | Complexity | Best ChatGPT model |
| --- | --- | --- |
| F1 Sequel continuity and recasting | High — cross-film IDs, casting economics | GPT-6 High |
| F2 Larger casts and crew | High — production formula, UI, history, contracts | GPT-6 High |
| F3 Full artist career records | High — durable world history/migration | GPT-6 High |
| F4 Individual awards | High — category logic and proper credits | GPT-6 High |
| F5 Balance, UI/regression/simulations | Very high — multi-seed integration and release readiness | GPT-6 Extra High |

**Implementation sequencing:** F1 → F2 → F3 → F4 → F5. Checkpoint code and tests after each substep. Existing source remains in separated modules (`content.js`, `engine.js`, `ui.js`, `style.css`, `media.js`, `sim.js`, `poster-store.js`).


## Final user scope override (authoritative)

- Full interactive career pages/timelines are for **directors and writers only**, each showing the existing fame-derived recognition tier and historical works. Actors, actresses and crew retain compact talent details; ordinary department employees remain aggregate, with no individual career pages.
- Personal awards are limited to **actors/actresses, directors and writers**. A supporting-actor performance category is permitted, but **do not add technical/cinematography/editing/score awards**. Preserve the existing movie-level award categories. Correct award ownership and historical attribution.
- Complete F1–F5 including meaningful balancing/tuning and multi-strategy tests; merge the verified v12 release to main after tests pass.

## Final approved scope and implementation
The original sections F3/F4 above describe earlier suggestions and are superseded by the user's later decision: **only directors and writers** receive full career pages and tiers; actors retain compact existing profiles. Only actors, directors and writers receive personal award categories and histories (including supporting performance). **No technical crew awards or individual department employee careers.** Completed Batch F details and tests: `CHANGELOG_V12.md`, `TEST_REPORT_V12.md`.
