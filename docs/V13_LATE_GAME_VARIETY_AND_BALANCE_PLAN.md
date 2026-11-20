# Final Cut v13 — Late-game challenge and long-term variety (proposal only)

Status: **Approved and implemented in v13**. Grounded in released v12 source and eight tuned 1970–2031 strategy simulations (2026-11-20). Game source was updated and tested; see `CHANGELOG_V13.md` and `TEST_REPORT_V13.md`.

## What v12 actually does
- Starts with **6 rival studios**, supports **15 active**; final tuned runs had **11–15** active rivals and **2,164–2,845** archived rival films.
- Awards world grows to **4 annual ceremonies** and **16 festivals** by the 2020s. Golden Reel includes film, acting, direction and screenplay awards; other ceremonies have their established categories. Preserve those; do not add technical/staff award categories.
- `studio.fame` and `studio.prestige` are both capped at 100. Prestige decays to **85% of its value each year** at the Golden Reel ceremony but can refill from festival and ceremony wins.
- Across eight tuned campaigns, final **fame was 99–100** and **prestige was 100 in every campaign**. The tested campaigns recorded **104–468 ceremony wins** (the `wins` simulation counter), **157–266 festival prizes**, and **890–1,033 festival official selections** over the long campaign. These are cumulative totals across decades, not per-season counts. These figures explain why awards can feel commonplace late in the game.
- The annual ceremony candidate filter currently applies the minimum nomination score to player films but lets AI competitors bypass it (`x.score >= A.minScore || !x.e.p`); make merit thresholds symmetrical before tuning award difficulty.
- Rival box-office pressure is currently partially normalized as the active rival count grows; more studios alone would not increase competition proportionally, and they increase simulation and save-storage costs.

## Decision: not more studios by default
Keep **6 starters / 15 active maximum** for v13's first balancing pass. Make existing rivals tougher and more memorable before considering more:
1. Establish **2–4 rotating industry leaders** within the available 15, competing for talent, franchises, festival attention and release slots. Leadership changes with hits, slumps, mergers/closures and entrants.
2. Strengthen specialization by genre and regions and give each rival a visible public identity (prestige house, blockbuster empire, genre specialist, indie challenger).
3. Build **multi-year rivalries** with clear, optional milestones and next-year comparisons; do not introduce additional management clicks.
4. Let aging rivals decline and new ones emerge, avoiding 15 permanent static opponents.
5. Only consider raising the cap to **18** if multi-seed tests show low competition despite the stronger AI and acceptable browser/save performance. Do not increase merely for decoration.

## A. Fame versus present-day attention
**Problem:** fame 100 ceases to differentiate studios.
- Keep **Lifetime Fame** as durable public recognition (0–100), useful for long-term stature and recruitment, not as a constantly decaying identity that punishes legacy studios.
- Add a separate **Current Buzz / Public Attention** measure, affected by recent hits, film releases, marketing, controversies and dry periods. It rises and fades over months/years, even when permanent fame is 100.
- Current Buzz drives opening awareness and momentum, while talent's **own fame** still drives their personal publicity; talent's skill remains separate and drives quality.
- A once-famous studio can lose heat after several weak releases; one surprise indie hit can leap ahead on current attention. Use one dashboard meter, not recurring micromanagement.

## B. Prestige versus permanent legacy
**Problem:** the current annual 15% decay is outpaced by accumulated trophy rewards.
- Replace or supplement saturated prestige with **Current Prestige**, a rolling ~3–5-year measure of weighted critics' reception, elite awards and major festival wins, with soft deterioration after low-output years.
- Maintain **Lifetime Legacy** separately: permanent studio milestones, historic trophies, major films, box office, franchise impact and talent breakthroughs, so nothing historically achieved gets erased.
- Studio tier remains attainable and is **not abruptly removed** because current prestige falls; recruitment and elite award campaigns get modest current-prestige influences.
- Display **current / all-time** values together with a simple explanation of why they changed.

## C. Scarcer, more meaningful awards
- Keep **exactly the existing four ceremonies**, established category types and 16-festival circuit; preserve individual honors only for actors, directors and writers, and film-owned movie awards.
- Fix **equal player/AI nomination eligibility**. Require a credible nominee field and minimum quality/score for **winners**; allow a category/festival to award no major trophy when there is no qualifying work.
- Toughen **elite** festival and flagship ceremony wins selectively, while keeping Local/Regional/indie/short recognition accessible. Strong small-studio films remain eligible for elite events on merit alone.
- Count **Official Selection**, **Jury Mention**, minor festival wins, major festival wins and flagship awards as distinct prestige weights. Historical totals remain visible, but a selection never looks equal to a grand prize.
- A film may win legitimately in **multiple ceremonies/festivals**: do not add a blanket one-win-per-film lock.
- Keep awards campaigns as a marginal edge in competitive races, not a guarantee over substantially better movies.
- Calibrate from annual rates and category-specific nominee pools rather than simply slashing cumulative historical totals. An occasional no-winner year is acceptable, not automatic every year.

## D. Late-game goals with minimal micromanagement
1. **Decade rivalries and leaderboards**: rolling 3- and 5-year awards, audience share, critic quality and international reach, alongside all-time rankings. Make the player's nearest competitor and gap visible.
2. **Studio legacy milestones**: optional long-run achievements for mentoring unknown talent, creating an enduring franchise, dominating a genre, making a global breakthrough, or winning a major award with a low-budget film. These are goals, not blockers.
3. **One occasional high-stakes studio initiative**: a prestige passion project, franchise expansion, global co-production or talent-development banner. Choose once at a milestone rather than weekly, with risks, costs and rewards that differ by studio identity.
4. **Reissues / classic-film revivals**: optional periodic release of a historic movie, yielding limited nostalgia revenue, attention and new audience; cap frequency so old hits cannot print infinite money. No forced management screen.
5. **Decade events / industry shifts**: changes in regional tastes, distribution technology and emerging audiences that can briefly reward an underdog or unsettle a leader. Use existing era/market systems; no new spreadsheet-style operation.
6. **Final legacy recap**: at score lock, summarize the most defining films, creative partners, rivalries and era leadership, rather than focusing on cash and a single composite number.

## Suggested v13 batches
| Batch | Scope | Model | Why first |
|---|---|---|---|
| A | Fix award eligibility parity; recalibrate award/prize scarcity and weighted importance | GPT-6 High | Directly fixes observed award dilution |
| B | Current Attention, current Prestige and permanent Legacy tracking | GPT-6 High | Makes post-100 progression meaningful |
| C | Elite rival identities, rise/fall cycles and rolling rankings | GPT-6 High | Stronger world without adding 10+ studios |
| D | Studio milestones, occasional initiatives, nostalgia reissues and decade events | GPT-6 High | New late-game decisions without repetitive clicks |
| E | Dashboard, history, score breakdown, save migration and UI explanations | GPT-6 Medium | Makes systemic changes understandable |
| F | Automated multi-region, multi-strategy long simulations and browser/storage checks; tune economic impact | GPT-6 Extra High | Prevents unintended late-game instability |

## Acceptance criteria / balancing targets
- At least **20 different seeds across the five home regions** (including prestige, blockbuster, cheap and careful), plus targeted 1990/2010/2025 snapshots; compare to saved v12 benchmarks.
- Elite awards are measurably harder than minor/local awards; a strong low-budget film can still win a top trophy; player and AI obey the same category eligibility.
- Current buzz and current prestige move downward after prolonged inactivity while permanent lifetime legacy stays intact. No expectation that long-lived fame must fall below 100.
- Rising star rival studios can genuinely beat a rich player studio at the box office and award seasons; no inflationary blanket AI bonuses.
- Older films, awards, ranking achievements, and talent histories remain valid after saving, loading and migrating v12 saves.
- Normal routes (feature, short, TV), five starting regions and conservative studios remain viable; no huge sustained save-size growth or excessive interruption popups.
- Keep the large majority of progression playable with existing screens, and add no mandatory employee-by-employee controls.

## Approved implementation default
Recommended v13 default: **stay at 15 active rivals**, add **Current Attention + rolling Current Prestige + permanent Legacy**, make elite awards scarcer, and focus late-game on rivals and legacy goals. More than 15 studios is a later performance/competition decision, not a prerequisite.
