# Final Cut v10 — Film History, Regional Distribution & Festival Qualification

Status: **Planning only**; no game logic, UI source, saves, or GitHub commits changed. Companions: `V10_WORLD_EXPANSION_PLAN.md` and `V10_HOME_REGION_AND_FILM_RANKINGS.md`; read sections independently to conserve context. Date: 2026-11-20.

## Evidence from released v9 (inspected `FinalCut_v9_2026-11-20.zip`)

- **Player films:** `state.projects` keeps project records and `UI.viewProjects()` can filter all projects. `UI.projectDrawer()` already shows budget, critics, gross, revenue, festivals, awards, current cast/crew and event IDs, but it does not provide a dedicated year-by-year filmography, stable production credits and a historical detail view.
- **AI films:** rival film objects currently store title, genre, budget, quality, hype, release date (`week`), grosses, revenue, result, but not actors, directors, writers, credited crew, topic, detailed festival outcomes or permanent archive IDs. Only six completed films are retained per rival (`TUNING.rivals.keepFilms=6`), and the oldest bankrupt rival companies are deleted (`keepClosed=6`). Historic AI credits cannot be reliably reconstructed from old saves.
- **Regional distribution:** no selectable geographic markets or region-by-region gross records. The Distribution employee department contributes to a generic box-office multiplier; video/streaming/TV-rights later windows exist, but are not country/region-specific.
- **Festival merit:** `0.52 × quality + 0.48 × critics + min(3, studio prestige × 0.04)`, with short-film eligibility `merit+9 >= entryScore`. The current Regional festival's advisory entryScore is only **32**, while Official Selection requires a subsequent judging roll of at least **51** and winning requires **74**. v9 festival application/entry is *not* an Official Selection or award. A low-budget film with free/empty cast slots can be submitted to Regional without winning anything; this is not automatically a bug, but can feel too permissive.
- **Default crew:** `founder` can direct/write without fees; empty lead/crew slots contribute skill 20 each, founder has 18–30 initial directing/writing, base quality 14, topic match adds up to +8, and randomness/events can change quality. Free staff do not intrinsically disqualify festival screenings; quality should matter more than salaries.
- **Festival timing:** shorts currently enter one festival immediately on release and receive a result 3 weeks later regardless of festival calendar; features shortlist up to three festivals based on merit and are judged on scheduled event weeks.

## A. Two connected film-history views

**My Filmography:** all completed and ongoing player shorts, features and pilots; year and format filters, searchable title, ratings, gross/profit, trophy count; chronological sections and lifetime studio totals. **This same historical screen has an embedded My Rankings view** for Best Overall, Genre, Topic, Top Grossing, Critics, and Awards, covering the player's films. Include **Studio Rank** and **World Rank** for the equivalent ranking category and eligible film format; clickable titles/ranks open the shared film-detail window. TV pilots remain in filmography but outside theatrical rankings. See `V10_HOME_REGION_AND_FILM_RANKINGS.md` for the canonical ranking formula and filters.

**World Film Archive:** all player films and every completed AI film in compact historic records, with richer details for major AI productions. Highlight historical top-grossers, critically acclaimed films, annual award winners/nominees, major festival prize winners and noteworthy flops. Search/filter by year, studio, genre, region, awards, format; click into film details, linked from Rivals, Awards and Festival pages. Rival bankruptcies and talent departures must not erase saved histories.

**Film detail record (one design used everywhere):**
- Studio and persistent film ID, title, format, genre/topic, project start, production milestones, release date, end of release, year, budget and expenses.
- Director, writer, lead, credited crew and any relevant department staffing snapshot; individual employee names only when actually recorded. Show snapshot credits rather than today's possibly-changed cast/skill. For older AI films without data, show **"Credits unavailable (earlier save)"** rather than generating false historical credits.
- Critics, quality, opening and total worldwide gross, regional receipts, studio revenue and profit, commercial outcome, awards nominations/wins, festival selections/mentions/prizes, and relevant milestone decisions if recorded.
- Poster and compact recognition badges; optional links to studio and talent profiles.

**Data architecture:**
- Give all player and AI films stable, non-colliding IDs (e.g. `player:projectID`, `rival:studioID:filmID`). Store immutable names and key financial/credit snapshots when production starts or release completes; do not rewrite history when an artist changes studio, ages, retires, or a studio closes.
- Add lightweight `worldFilmHistory` in game state for **every completed AI film** (compact IDs, genre/topic, quality, critics, earnings and awards so All-Time/Genre/Topic rankings are complete), with richer credit and production snapshots for notable AI films. Retain all player project records. Capture available AI credits *at film creation* (director/writer/lead/crew references or stable names), using relevant talent pools/budgets; do not pretend v9 already models these credits.
- Select AI films for **expanded details** using awards, nominations, festival wins, top market gross/critic rankings, and notable upset/flop flags. Keep core records for **all** AI films compact and outside active simulation loops, rather than deleting ranking-eligible films.
- Existing v9 saves migrate non-destructively: preserve current projects and surviving rival films; do not invent cast/crew or missing films that v9 discarded. Protect browser localStorage capacity and long-game UI performance with archive size tests and lazy/paginated lists.

## B. Selectable distribution regions

Introduce **five broad distribution markets**: North America, Europe, Asia-Pacific, Latin America, and Middle East & Africa. **New-game setup lets the player choose any of these five as their home region** (North America is the default for legacy/Hollywood-style starts). Home region determines the domestic/no-surcharge market; other chosen markets count as overseas. See `V10_HOME_REGION_AND_FILM_RANKINGS.md` for balanced regional identity and save migration.

- **Where to choose:** one distribution step during feature-film release planning, alongside existing release date and marketing; presets `Home only`, `Select regions`, `Wide`, `Worldwide`. Display the market estimates and total incremental distribution/localization/marketing cost before accepting. Home release remains default at no additional fee so existing strategies and small studios are viable.
- **Financial effect:** each additional region has market-size potential, genre/topic/era taste, competitor pressure, localization/distribution cost, studio revenue share, and uncertainty. Do not simply multiply the current global gross by the number of selected regions. Book regional gross and costs separately and reconcile to film-wide total; later windows remain accounted for separately.
- **Reputation effect:** successful international reach generates modest studio fame and talent exposure; prizes retain their own prestige and must not be double-counted. A wider rollout creates more opportunity and more risk; partners can provide cheaper reach with lower revenue share for smaller studios rather than hard locking regions by studio tier.
- **Festival effect:** reach/region can modestly influence discoverability for geographically relevant festivals, but **festival eligibility is not automatically tied to theatrical distribution**. A film from a small studio can attend high-tier international festivals without purchasing a worldwide theatrical release. Event-specific rules may require premiere status or regional focus; show them explicitly, no hidden geographic gates.
- **Historical era:** initial overseas distribution is costlier and less predictable in the 1970s; access improves with later eras. No separate warehouses, offices, licensing offices, or country-level micromanagement.
- **Scope:** features first. Short films retain festival reach, not full theatrical region-rollout management; pilots can receive regional TV licensing as a future refinement only if balancing supports it. Preserve v9 generic distribution behavior for old saves by assigning an equivalent home/global legacy baseline and recording new regional splits only going forward. Avoid breaking v9 economics.

## C. Festival qualification and variety — approved refinement

**Is a default/no-fee cast going to Regional too easily?** Yes, inspect and tune the *application shortlisting*, not punish free talent automatically. The low Regional `entryScore=32` permits even a modest film to be proposed for entry; selection and win thresholds are higher. Treat **Submitted**, **Official Selection**, **Jury Mention**, **Winner** as separate statuses, with clear calendars; entering is not an award. Benchmark first-release micro/low-budget, high-skill indie, and expensive-but-poor projects across many seeds. Tune expected entry/selection/win rates, not a universal minimum budget or studio reputation gate.

**Cap per decade:** original six founding festivals (1970); introduce **at most two additional specialized festivals per following decade**. New festivals should have a distinct identity (independent, documentary, horror/genre, debut director, animation, short films, audience-driven, etc.), with year founded, annual week, preferred genre/topic/format, geographic focus and award categories. Examples are options, not mandatory additions. A sensible upper bound is 16 active by the 2020s only if two are added every decade.

**Multiple festivals per film:** one film can be submitted to the appropriate tier festival **and** a specialized event if eligible (e.g. Regional + Independent Screen Showcase). Keep submissions automatic and based on finished film quality, critics, format, festival focus, past submission and dates. Aim for 1–2 short submissions and 1–3 feature submissions in early decades, scaling gently to **up to 3 shorts and 4 features** after circuit growth. Cap repeat entries/fees and avoid flooding the player with alerts. Do not require separate player choices for every submission.

**Awards results and competition:** one coherent calendar and 52-week eligibility window for both shorts and features; distinguish wins, Jury/Special Mentions, Official Selections and rejections. Allow rival films to compete in appropriate festival judging, not only on independent target rolls. Difficulty rises with festival tier and actual competition; major film quality, execution and critical appeal dominate over studio fame and paid talent. Keep a tiny but credible elite win chance for outstanding small-studio films, not ordinary low-quality ones. Add up to a few format/genre-relevant categories where appropriate, not dozens per event. Count achievements for both shorts and features in the career and final score.

## D. Integration, UI and low-micromanagement guardrails

- `Filmography`, `World Archive`, and one **Film Rankings** page can live as subtabs of a combined **Films & History** area, rather than creating many new main sidebar items. **Within Filmography, add an `All Films | My Rankings` toggle**, showing player-only rankings and each film’s matching world placement; the World Rankings view covers player + AI films. Overall, genre, topic and commercial rankings link to the **same film record and detail window**, not duplicate histories; Awards/festival history stays under Awards.
- Show a clean film detail drawer/page with **Production | Credits | Performance | Recognition** sections; show region charts only when data exists. Support search, sorting, year, studio and awards filters without loading thousands of detailed cards.
- Regional release selection is a single decision/preset, not a week-by-week task. Festival applications remain automatic. Routine submissions/selections go to Studio Wire; popups for exceptional wins only.
- Reuse `content.js` (market/festival definitions), `engine.js` (state, archives, credit snapshots, region math, festival eligibility), `ui.js` (archive views, detail, release planning), `sim.js` plus `tests/` (long-run load and economic tests). Touch `style.css` only for missing layout/contrast rules.

## E. Implementation batches and model choice

| Batch | Work | Main files | Best ChatGPT model |
| --- | --- | --- | --- |
| A | Compact film snapshot model, stable IDs, legacy migration, AI credits captured at creation | `engine.js`, `content.js`, tests | GPT-6 High |
| B | Player filmography with embedded personal rankings and world placements; major-AI archive; shared searchable historic details and links | `ui.js`, `engine.js`, `style.css` | GPT-6 Medium |
| C | Five-market regional film distribution options, costs, gross/revenue splits, fame/awards interaction | `content.js`, `engine.js`, `ui.js`, `sim.js` | GPT-6 High |
| D | Festival shortlist calibration, specialized events cap, multiple entries, fair rival competition | `content.js`, `engine.js`, `ui.js`, tests | GPT-6 High |
| E | Integrate with separate v10 rivals/ceremonies plan and run full save and 1970–2031 performance/balance checks | `engine.js`, `sim.js`, `tests/`, docs | GPT-6 High |

**Dependencies:** implement permanent IDs and credits before expanded AI rival output, award histories and regional financial histories; add regions before their permanent performance archive display; build calendar-aware festivals before backfilling their records. Do not implement any batch without the user's go-ahead.

## Acceptance checks

- All player films remain browseable and have production/actor/staff/financial/award history **plus player-only Overall/Genre/Topic/Commercial/Critics/Awards rankings on the My Filmography screen, with a separate world placement for the same category**; all completed AI films retain compact ranking records after bankruptcies and rival pruning, with expanded details for major titles; pre-v10 missing credits display honestly.
- Studio/cast names and award dates remain fixed snapshots and don't change when roster/talent data changes later.
- A domestic-only film keeps approximately v9 financial baseline; overseas distribution exposes explicit cost and additional upside with bounded balance impact. Region gross totals reconcile with worldwide total and change profits without duplicated revenue.
- A small film can apply to a Regional festival but applications aren't mislabeled as awards. For first micro-shorts with free talent, the *selection and prize* rates remain appropriately modest; truly high-quality tiny-budget films can reach elite tiers.
- Only up to two specialized festivals begin in each decade after 1970; new festivals do not appear retroactively; one film can attend a tier festival and specialist events with no duplicate prize record.
- Migration from v9 preserves all existing records without inventing missing past AI movies; multi-decade saves stay responsive on desktop/mobile.
