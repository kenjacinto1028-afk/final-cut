# Final Cut v10 — Home Region & Film Rankings

**Status: Approved planning additions; NOT implemented.** Updated 2026-11-20. Complements `V10_FILM_HISTORY_AND_REGIONS_PLAN.md` and `V10_WORLD_EXPANSION_PLAN.md`. Keep source files separate; no new micromanagement layer.

## A. Choose a studio home region at new-game setup

Select one of the **same five markets** planned for distribution:

| Home region | Taste and strategic identity (illustrative; tuning required) |
| --- | --- |
| North America | Larger domestic box-office ceiling; high commercial competition |
| Europe | Stronger critical/prestige and drama-oriented audience opportunities |
| Asia-Pacific | Genre-dependent growth and expanding reach as decades pass |
| Latin America | Stronger local action, romance and family-market fit |
| Middle East & Africa | Smaller initial theatrical reach but lower-competition niche opportunities and later growth |

**Rules**

- Select during new-game creation, default **North America** to preserve the Hollywood-style baseline. A chosen home region becomes the studio's headquarters for that campaign; do **not** add an HQ relocation system yet.
- Home-region release is the default and has **no extra international distribution surcharge**. The other four markets can be chosen through the existing proposed release-planning step (Home only / Select / Wide / Worldwide).
- Home-region identity influences *modestly*: local audience/genre/topic tastes, domestic box-office opportunity and costs, initial contact or talent availability, and regional visibility. It **does not** impose absolute restrictions on artist quality, studio upgrades, or festival tiers. Quality-based World-tier festival access remains possible from every home region.
- Small studios in every region must be economically viable: tune different market size against distribution expense, baseline revenue and local competition. Do not equate a smaller market with permanent low-quality films.
- Standardize the economy in one game currency (USD-equivalent) for readable comparisons; no exchange-rate or country office simulation. Era progression improves overseas distribution access, as already planned.
- Use studio home region as contextual metadata in the film-history archive; the **release regions** of each film remain separate choices. Region filters in the archive and rankings must mean **where a film was shown**, not where its studio is based.
- Save migration: v9 games without this field get **North America** as home, with no retroactive invented territorial grosses. Existing games never interrupt progress with a new setup dialog.

## B. Film Rankings — integrated with permanent film history

Create a single **Film Rankings** page alongside the proposed **My Filmography** and **World Film Archive** (not several disconnected rankings screens). **My Filmography also has its own embedded My Rankings tab and displays both personal and relevant world placements**. Clicking any ranking entry opens the same historical film-details panel as the archive.

### My Filmography — rankings on the player's own history screen

The **My Filmography** historical screen must also include a **My Rankings** tab/filter, directly beside the normal chronological film list—not just a link out to World Rankings. Its default scope is **my studio's films only** and it uses the *same stored film records and scoring formulas* as global rankings. No duplicate archive or separate ranking engine.

- **All My Films:** list the player's full historical filmography with sortable **Studio Rank**, **World Rank** (for the chosen matching category/format where eligible), overall score, release year, genre/topic, critics, gross/profit and awards. Opening a row shows the existing full film-detail window.
- **My Rankings:** sort/rank **Best Overall**, **By Genre**, **By Topic**, **Top Grossing**, **Critics' Favorites**, and **Award Leaders** among *only the player's films*. Clearly show when a ranking is within the current genre/topic/filter rather than a global position.
- **Compare to World:** show a small world placement alongside personal placement (e.g. `#2 of my studio / #31 world, Drama`) and offer a direct link to the same category in the World Film Rankings. Never confuse the **studio rank** with the **world rank**.
- **Filters:** decade/year, genre, topic, short vs feature, release region, and awards. Default to feature films for comparable overall ranks; provide a short-film view; keep TV pilots visible in filmography but outside theatrical rankings.
- **Historical permanence:** all player films remain ranked throughout the full career, even if a film has stopped earning, the cast retires or the studio changes tier. Recompute a film's standing only when legitimate new results or new competing releases arrive; do not reroll old metrics. For earlier saves, show unavailable fields honestly.
- **Usability:** one ranking table with a compact scope toggle (**My Studio / World**) where helpful, not additional top-level navigation or repeated category pages; sortable columns and pagination for 60-year careers. Ranking pages must remain mobile friendly.

**Illustrative row:** `#1 studio · #18 world — A Winter Promise (1982) — Drama / Family Secret — 87.3 overall — 3 awards`. This is a UI example, not an actual game record.

**Main ranking views**

1. **Best Films — Overall:** combined artistic and commercial achievement, not simply box-office dollars or studio fame.
2. **Best by Genre:** separate leaderboards for the game's existing genres.
3. **Best by Topic:** separate leaderboards for all **25 topics** (including the nine added in v9).
4. **Top Grossing:** separate commercial leaderboard, adjusted for historical market scale so a 1970 classic can compare fairly with a 2025 release.
5. **Critics' Favorites / Award Leaders:** additional simple ranking presets using existing review and recognition data; no extra gameplay-stat meters.

**Optional filters**: All time / decade / year, format (Features or Shorts), studio (Mine / All / a named rival), and release region. Display rank, title, year, studio, genre/topic, key score and major awards. Highlight player films without advantaging them in the score.

**Ranking calculation — proposed tuning starting point**

- **Overall Film Score, 0–100:** 40% critics rating + 25% finished film quality + 20% era-normalized commercial reach + 15% award/festival achievement. Values are illustrative and should be calibrated with seeded simulation.
- Commercial reach uses **release-era and available-market benchmarks**, not raw historical gross or amount spent; cap extreme blockbuster effects so films with tiny budgets can rank. Normalize region/era fairly.
- Recognition distinguishes major ceremony wins, festival-tier wins, special mentions, nominations and official selections. Capped weights prevent award-volume farming or multiple automatic festival entries dominating the rankings.
- Festival attendance is not a win; studio reputation is not directly part of the score. Films can move up after a new ceremony win or later release-window results, but earlier records are never overwritten.
- **Features and Shorts do not share a default overall board**: use Features as default and allow a separate Short Films filter; TV pilots remain viewable in filmography but do not enter theatrical rankings.
- Ties use a stable, documented ordering (e.g., critics score, release year, immutable film ID). Scores are computed from the film's frozen historical record plus legitimately later-discovered outcomes; never reroll historical results when reopening rankings.

**AI films and data retention — key dependency**

- Rankings must include the player's films **and AI rivals' films**. The earlier v10 proposal stored only notable AI films. To avoid biased or incomplete rankings, retain a **small core historical record for every completed AI film** (ID, studio, title, year, format, genre, topic, quality, critics, release regions, gross and recognition). Keep richer cast/crew and production-detail snapshots for noteworthy works only.
- AI film credits are captured at creation when available; never fabricate missing past credits. Rankings work even if a film has only compact metadata; older v9 save data is explicitly marked **Incomplete history** if past AI records were discarded.
- Store ranking source data once in a compact, persistent historical collection; derive/sort leaderboards on demand (cached when needed) rather than saving duplicate ranked lists. With up to 15 rivals and a 60-year game, test localStorage size, migration and responsive list pagination/search.
- Historic studio bankruptcy must not erase records or film rankings. Expanding to 15 rivals must not change the scoring formula based on producer identity.

**Gameplay role**: rankings principally provide history, prestige and long-term goals. Optionally grant a *small, once-only* fame/industry recognition milestone for genuinely historic breakthroughs; **avoid ongoing passive income bonuses**, new employees and repeated ranking popups.

## Dependencies and rollout (planning only)

| Sequence | Work | Primary files | Suggested model |
| --- | --- | --- | --- |
| 1 | New-game home region + save migration; make existing proposed distribution respect home | `engine.js`, `ui.js`, `content.js` | GPT-6 High |
| 2 | Historic core AI-film records and immutable player/AI credits; stable IDs | `engine.js`, `sim.js` | GPT-6 High |
| 3 | Ranking calculations and era/region normalization | `engine.js`, `sim.js` | GPT-6 High |
| 4 | World Rankings plus embedded **My Filmography → My Rankings** with studio/world rank columns, filters and shared clickable detail window | `ui.js`, `style.css` | GPT-6 Medium |
| 5 | Multi-region, multi-rival regression and performance tests | `tests/`, `sim.js` | GPT-6 High |

## Acceptance criteria

- All five home regions are selectable. The selected region displays in setup, studio info and distribution planning; home-only rollout is valid and affordable across all five.
- An old v9 save loads with North America as its default home; no retroactive fabricated region financials.
- Distribution prices, projected receipts, festival visibility and small-studio viability are balanced for every home region; no geography blocks World-tier recognition.
- Overall, genre and topic world rankings include **both player and all retained AI releases**; **My Filmography contains player-only rankings plus accurate matching world positions**, with the same clickable historical film detail records, even after rival bankruptcy.
- A 1970 release is not buried solely because 2020 box-office dollars are larger. Shorts do not compete against feature grosses by default.
- Festival/ceremony wins can update a film's rank without duplicate trophies; results remain deterministic when a save is reopened.
- Across seeded full-horizon simulations with up to 15 rivals, rankings remain fast, save files remain within browser limits, and historic records do not disappear.

**Scope boundary:** This document is planning only. Do not modify v9 code, GitHub `main`, or existing releases until an implementation request is given.
