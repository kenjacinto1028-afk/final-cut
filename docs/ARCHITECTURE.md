# Final Cut – Architecture

**Current SAVE_VERSION: 9** (`engine.js` HEADER). Game save: localStorage `backlot_save`; separate leaderboard key: `finalcut_leaderboard`; media settings: `finalcut_media`. **Version 8 saves automatically migrate to v9**: initialize `market.topics` (25 ids), `recruitment.declined` and `events.recentProduction`, preserving existing studio progress. Other versions are rejected. See `CHANGELOG_V9.md` for updated file responsibilities and `TEST_REPORT.md` for validation.

**v9 updates (supersede historical statements below where they conflict):** 25 topics with quarterly topic demand and era taste; six automatic film festival tiers open to all studio sizes; reputation-based artist/employee recruitment using the existing fame/critics/prestige stats; production event cooldown and memory, fewer blocking routine updates; a warm-ivory/charcoal high-contrast interface and a collapsible mobile menu. `marketOutlook` now includes `topic`; `marketInfo` now includes `topics`. Short films have `festivalTierId`/`festivalTier` and festival results have `tier`; features retain the automatic festival plans. `save()` writes v9. Quarterly finance reports no longer interrupt Advance. Browser smoke tests and full simulation results are in `tests/`. This file retains historical v8 implementation details for context.

## Load order (plain scripts, index.html)
content.js → engine.js → media.js → ui.js

## Live build
Published 2026-11-20 as a claude.ai artifact (private until shared): https://claude.ai/artifact/XuSc9wVv1r4RNmoSyuzhQV. Same 6 files (index.html, style.css, content.js, engine.js, media.js, ui.js). Artifact pages can't load remote images or call other hosts; the game needs neither (Google Fonts are allowed, with system fallbacks).

## Files and sections
- content.js (data only, global `CONTENT`): HEADER, STAGE_LABELS, ERAS, GENRES, TOPICS, TITLES, NAMES, TALENT_ROLES (+ SLOT_LABELS), CREW_SPECIALTIES, TRAITS, TALENT_EVENTS, EVENT_CATEGORIES, EVENTS, AWARDS (AWARDS, AWARD_TEXT), NEWS, FESTIVALS, DECISIONS, FIXED_DECISIONS, STUDIO_SIZES, MARKET (SEASONS, CYCLES, MARKET_TEXT), REVENUE_WINDOWS, GROWTH_TIERS, STAFF_DEPTS (+ STRIKE_EVENT), RIVALS (RIVAL_NAMES, RIVAL_STRATEGIES, RIVAL_TEXT), SCORE
- engine.js (rules, global `Engine`, no DOM): HEADER, TUNING, TUNING_RIVALS, TUNING_EVENTS, TUNING_ERAS, TUNING_AWARDS, TUNING_NEWS, TUNING_SCORE, UTIL, STATE, EVENT_BUS, CALENDAR, ERAS, FOUNDER, TALENT, CONTRACTS, CAST, PROJECTS, QUALITY_HYPE, DECISIONS, EVENTS, RELEASE, FINANCE, ECONOMY, MARKET, RIVALS, TV, WINDOWS, GROWTH, STAFF, AWARDS, NEWS, SCORE, LEADERBOARD, BANKRUPTCY, TURN_LOOP, SAVE_LOAD, PUBLIC_API
- sim.js (headless Node bots for balancing, not loaded by the game): reads content.js + engine.js from the same folder, seeded RNG. `node sim.js <prestige|blockbuster|cheap|careful> <runs> [seedBase]`, optional env `OVR='{"boxOfficeBudgetExp":0.7}'` overrides TUNING keys (dotted paths), `UNTIL=1980` stops at that year, `DETAIL=1` adds per-film rows. One JSON line per run (score, parts, counts, profit, cash, fame, features, flops). 7.5: `careful` bot added (cautious human: mid budgets at most, mixed genres, cash cushion); the cheap bot now hires cheap talent (fees ≤ 4% of budget per slot; was local hires only).
- media.js (global `Media`, reads Engine, never changes game state): HEADER, SETTINGS, UTIL, MUSIC_STYLES, MUSIC, MOOD, POSTERS, ART (8.3), SFX (8.4), FX (8.5), EVENT_HOOKS, INIT
- ui.js (display only, global `UI`): HEADER, HELPERS, MEDIA_HELPERS (8.3), TABLE, NAV, TOPBAR, VIEW_START, VIEW_DASHBOARD, VIEW_NEW_PROJECT, VIEW_PROJECTS, VIEW_TALENT, VIEW_ROSTER, VIEW_FOUNDER, VIEW_FINANCE (+ quarterTable), VIEW_MARKET, VIEW_TV, VIEW_STAFF, VIEW_RIVALS, VIEW_AWARDS, VIEW_SCORE, VIEW_NEWS, VIEW_LOG, DRAWER, MODAL, RENDER, ACTIONS, INIT
- style.css: BASE, LAYOUT, COMPONENTS, MODAL, TOPBAR_NAV, TABLE, DRAWER, DASHBOARD, PHASE4 (details, dept cards), MEDIA (sound controls, poster, portrait, banner, trophy list, confetti canvas, shake, era card, reduce-motion) (V2 high-contrast; CSS variables in :root)
- index.html: `#app` > `#nav` (black sidebar) + `#content` > `#topbar` + `#main`; `#scrim` + `#drawer` (slide-in); `#modal`. `#app` gets class `start` when no game is loaded (hides sidebar and top bar). Fonts: Archivo + Inter from Google Fonts, with system fallbacks.

## UI navigation (ui.js NAV)
`GROUPS` = Studio (Dashboard, New project, Projects, TV, Founder, Log), People (Talent, Roster, Staff & HR), Business (Finance, Market, Rivals), World (News, Awards, Score). All entries are enabled now; the 3rd element on an entry would mark a disabled "Soon" placeholder. Roster shows a yellow badge with the number of expiring contracts. The nav foot (and the start screen) has `soundControls()`: Music toggle + volume slider (8.1, `UI.toggleMusic()`, `UI.setVolume(0–100)`; the slider doesn't re-render), Sound effects toggle (8.4, `UI.toggleSfx()`, only shown when audio is supported) and Reduce motion toggle (8.5, `UI.toggleMotion()`, always shown).
History: `hist` (visited views) + `hpos`; `go(v)` pushes and drops forward entries; `back()`, `forward()`, `resetHistory()` (on load). Top bar shows ‹ › buttons, breadcrumb (group › page), week/era, cash, run score (link to Score; "final" once locked), Next week, Advance.

## UI table (ui.js TABLE)
`tblHtml(id, cfg)` renders filters + search + table; per-table state (sort, dir, filter, q) lives in `tables[id]`. cfg: `rows()`, `rowId`, `search`, `onRow`, `rowClass(r)` (optional, e.g. `warn` = yellow row), `sort`/`dir` (optional default), `columns[{key,label,num,value,render}]`, `filters[[id,label,predicate|null]]`. Public: tblSort, tblFilter, tblSearch, tblRow. Used by VIEW_PROJECTS, VIEW_TALENT, VIEW_ROSTER, VIEW_MARKET, VIEW_TV, VIEW_RIVALS, VIEW_NEWS, VIEW_SCORE (leaderboard).

## UI drawer (ui.js DRAWER)
`drawer = { kind: 'project'|'talent', id }`. `openProject(id)`, `openTalent(id)`, `closeDrawer()`; `renderDrawer()` runs at the end of every `render()` and then calls `fxPass()` (8.5 count-up). Project drawer: poster (8.2, `Media.posterSVG(p)`), award and festival icons under it (8.3, `awardIcons(p)`), numbers (gross and revenue count up), opening market (incl. era taste when recorded), revenue windows, festival results and award lines (6.3), series status, cast (links to talent), decisions faced (`decisionLabel` looks in DECISIONS, FIXED_DECISIONS, TALENT_EVENTS and EVENTS). Talent drawer: abstract portrait (8.3), stats, awards line (6.3) with up to 6 trophy icons (`talentTrophies`), traits, credits, contract actions (sign / renew / release). `drawerMsg` shows the last action result. Esc and scrim click close it.

## UI media helpers (ui.js MEDIA_HELPERS, 8.3–8.5)
Display only. `hasMedia()` (Media loaded), `isPicture(cat)` (regex /picture/i), `cu(key, n)` (emits `<span data-key data-count>` for the count-up), `portrait(t, size)`, `eraBanner(eraId)`, `trophyIcon(o)`, `festBadgeKind(result)` (Won / prize name / winner → prize, Official selection → selection), `awardIcons(p)`, `talentTrophies(t)` (max 6), `toggleSfx()`, `toggleMotion()`. If media.js is missing everything falls back to plain text.

## UI modal and effect hints (ui.js HELPERS, MODAL)
`effectHint(e)` turns an effects object into short text (cash, quality, hype, cost, marketing, delay, fame, critics, genre demand, star fame/morale, roster/staff morale, pay, strike, layoffs). `renderModal()` titles a decision with `CONTENT.EVENT_CATEGORIES[pending.category]` (default "Decision") and adds a red "Crisis" tag when `pending.disaster`. Era transitions (`pending.scope === 'era'`) are drawn by `eraCard(pd)` (8.5): "New era" title, an era backdrop banner (`Engine.eraInfo(pd.eraId)`), the `pending.lines`, and the Continue button without effect hints. The score lock (`pending.scope === 'score'`, 7.1) works the same way as a plain card with the title "Final score". The bankrupt card (`state.gameOver`) shows `state.score` (value, rank, one line per part from `Engine.scoreLines`).

## UI market (ui.js VIEW_MARKET)
Strip: era, economy, season, rival releases, biggest opening. Genre table (`market`, default sort Demand): popularity, era taste, demand (= popularity × taste). Release calendar. Era block: name, years, blurb, `Engine.eraLines()`.

## UI rivals (ui.js VIEW_RIVALS)
Reads `Engine.rivals()`, `rivalInfo(id)`, `activeRivals()`, `audienceShare()` and the `rival` entries of `state.log`. Table `rivals` (Active / All / Closed). Module variable `rivalSel` holds the selected studio id; a row click sets it and re-renders, and the detail (strategy, cash, quarter results, recent releases, coming-up films, talent poached from you) shows under the table, not in the drawer. Talent names open the talent drawer.
Related display columns (5.5 follow-ups): VIEW_ROSTER has a Morale column (`Engine.talentMorale(t)`, red below `TUNING.rivals.poach.moraleBelow`); VIEW_MARKET's release calendar has a "Named rival films" column from `marketInfo().slate[i].rivals`.

## UI awards, news and dashboard (ui.js VIEW_AWARDS, VIEW_NEWS, VIEW_DASHBOARD)
VIEW_AWARDS reads `Engine.awardsInfo()`: strip (next ceremony, prestige, trophies), festival circuit, eligible-films table with campaign buttons (`UI.awardCampaign(id, level)` → `Engine.awardCampaign`), trophy case (`<ul class="trophy-list">` with trophy icons, 8.3), past-ceremony details. VIEW_NEWS is a `tblHtml('news')` table (Date, Section, Headline) with filters from `Engine.newsFilters()` and a search box; rows come from `Engine.news(filterId)`. The dashboard shows the current era's backdrop banner on top (8.3), gross figures that count up (8.5), and a Headlines list from `Engine.news(null, TUNING.news.headlines)` with an "All news" link.

## UI score (ui.js VIEW_SCORE, 7.1–7.2)
Reads `Engine.scoreInfo()` and `Engine.leaderboard()`. Strip (score now / final score, profit, locks at / locked, rank), a breakdown table from `CONTENT.SCORE.parts` (points per part, description, counts for awards and hits), and a `tblHtml('leaderboard')` table (#, name, studio, score, date, ended; this run's row is highlighted once locked). `UI.clearLeaderboard()` asks for confirmation, calls `Engine.clearLeaderboard()` and never touches the game save.

## Engine public API
state (getter), TUNING, SLOTS, on(fn), newGame({studioName, founderName}), nextTurn(), advance(), choose(i),
startProject({title, format, genre, topic, tier, cast}), previewProject(opts) → {ok, reason, budget, fees, prodBudget, weeks, weekly, prodQuality, cashAfter}, randomTitle(), formats(),
activeProject() (first active), activeProjects(), capacity(), getProject(id), takeLoan(), repayLoan(), loanCap(), freelanceIncome(),
weeklyBurn() (living + interest + salaries + payroll + overhead + active productions + airing episode costs), weeklyProfit(), weeklySalaries(),
studioSize() → {level, fixedOverhead, revenueShare, trailingRevenue, overhead, staff, payroll, nextRevenue}, staffCount(), weeklyPayroll(), officePayroll(), weeklyOverhead(revenue?), quarterToDate() → {quarter books…, deals, profit, weeks},
marketInfo() → {genres: [{id, name, pop, taste, demand}], topics: [{id, name, pop, taste, demand}], era: {id, name}, cycle, season, audienceCap, slate: [{week, competitors, background, rivals: [{title, studio, rivalId, genre, budget}], season, seasonMult}]}, marketOutlook(p, offset) → {genre, taste, topic, season, cycle, competitors, pressure, rivals, mult},
series(), activeSeries(), getSeries(id), tvSlotsUsed(), windowName(id), growthTier(i?), upgradeQuote() → {ok, reason, tier, name, cost, next, top}, upgradeTier(),
staffInfo() → [{id, name, heads, max, skill, morale, payLevel, pay, payroll, strikeWeeks, bonus, costs}], staffAction(dept, 'hire'|'fire'|'raise'|'cut'|'train'),
rivals(), activeRivals(), getRival(id), rivalInfo(id) → rival + {strategyName, baseStrategyName, tierName, overhead, typicalBudget, talent, focusNames}, rivalName(id), audienceShare(lastYear?) → [{id, name, gross, share}], talentMorale(t),
founderRole(), founderFreelancing(), founderProject(), dealDiscount(), founderHype(),
talent(), getTalent(id), talentFee(t, format), salaryOf(t), traitsOf(t), effReliability(t), talentStatus(t), slotOptions(slot, format), castSummary(p),
roster(), rosterCap(), weeksLeft(t), isExpiring(t), expiringContracts(), contractQuote(id, years, renew), signExclusive(id, years), renewContract(id, years), releaseContract(id), severanceOf(t),
dateOf(week), eraOf(year), eraInfo(eraId?) → {id, name, blurb, start, end, taste: [{id, name, mult}], tech: [{id, name, quality}], postWeeks, festival, tvFee, pickup, windows: [{id, name, start, end, mult}]} (current era when empty), eraLines(eraId?) → 4 summary strings (taste, tech, formats, windows),
awardsInfo() → {name, next: {year, week, covers}, eligible: [{id, title, year, score, buzz, campaign, quotes}], history, trophies, prestige, circuit, campaigns, categories}, campaignQuote(id, level), awardCampaign(id, level) → {ok, reason},
news(filterId?, limit?) → [{week, text, type, cat, label}] newest first, newsFilters() → [{id, name}],
scoreInfo() → {locked, value, parts: {profit, awards, fame, reputation, hits}, counts: {wins, noms, picture, festPrizes, festSelections, hits, shows}, profit, week, year, reason: null|'lock'|'bankrupt', rank} (live while the run is on, frozen after the lock), scoreLines(sc) → one string per part, leaderboard() → [{name, studio, score, date, year, reason}] best first, clearLeaderboard(),
save(), load(), hasSave(), clearSave()

## Engine events (Engine.on(fn(type, data, state)))
newgame, load, turn, advance, project, stage, decision_pending, decision, release, festival, finished, finance, warning, era (data = CONTENT.ERAS entry; also raises the era popup), gameover, contract, founder_role, quarter (data = quarter summary row), market, tv, tier, staff, rival (data = rival; strategy switch, grow, shrink, bankrupt, upstart), poach (data = {talentId, rivalId}), awards (6.3, after each ceremony), score (7.1, data = state.score, when the score locks)

## State shape (v8)
```
state = {
  version, week,                 // week 0 = Wk 1, 1970
  cash, debt,
  founder: { name, role: 'filmmaker'|'executive', stats: { directing, writing, business, charisma } },   // 0–100
  studio: { name, fame, criticsRep, releases, tier, prestige },   // tier = growth tier index 0–4; prestige 0–100 (6.3)
  projects: [ {
    id, title, format: 'short'|'feature', genre, topic, tier,
    budget, fees, prodBudget, weekly, spent, marketingSpend,
    cast: { director, writer, lead, crew },   // 'founder' (director/writer), talent id, or null = local hire
    castNames: { slot: name },                // snapshot for display
    stage: 'development'|'preproduction'|'shoot'|'post'|'release'|'done', stageWeeksLeft, startWeek,
    qualityMod, hypeMod, usedEvents: [], lastEventWeek, lastSlipWeek, flags: { devEvent, cutDone, marketingDone },
    quality, hype, critic, releaseWeek, weeksInRelease,
    opening, gross, revenue, festival, result,
    market: { genre, taste (6.2, optional), topic (v9), season, cycle, competitors, pressure, mult, rivals: ['Studio: Title'] } (features, at opening), windows: [ { id, from, weeks, total, paid } ] (features, after theaters),
    buzz, festivalTierId / festivalTier (shorts, v9), festivalPlan: [festivalId], festivals: [festivalId], festResults: [ { festival, tier, result } ], campaign: { level, spent }, awards: [ { year, cat, won } ], awardsJudged   // 6.3, features
  } ],                           // format: 'short'|'feature'|'pilot'; flags also has dateDone
  series: [ { id, projectId, title, genre, season, episodes, aired, epCost, fee, quality, hype, ratings: [], lastRatings, seasonAvgs: [], status: 'airing'|'hiatus'|'ended', hiatusLeft, revenue, cost } ],
  nextSeriesId,
  talent: [ {
    id, name, role: 'director'|'writer'|'actor'|'crew', specialty (crew only),
    skill, fame, reliability, affinity: [genreId], traits: [traitId], credits: [projectId], joinedWeek,
    awards: { noms, wins } (6.3, added when first awarded),
    contract: null | { type: 'project', projectId } | { type: 'exclusive', startWeek, endWeek, salary, warned, morale, idle, offerWeek } | { type: 'rival', rivalId, endWeek }
  } ],
  pending: null | { projectId (null for studio decisions), id, talentId, text, choices: [ { label, effects, result } ], scope?: 'staff'|'poach'|'event'|'era'|'score', dept?, rivalId?, offer?, years?, category?, disaster?, eventId?, genre?, eraId?, lines? },
  queue: [ pending… ],           // decisions waiting behind the current one
  warning: { stage: 0|1|2, deadline },
  log: [ { week, text, type, cat? } ],   // max 300; types include 'event' (6.1), 'era', 'award', 'star', 'economy' (6.3/6.4), 'milestone' (7.1 score lock); cat = optional news section override
  nextId, nextTalentId, gameOver: null | { reason, week }, stopFlag,
  score: null | { value, parts: { profit, awards, fame, reputation, hits }, counts: { wins, noms, picture, festPrizes, festSelections, hits, shows }, profit, week, year, reason: 'lock'|'bankrupt', rank },   // 7.1: null while the run is live
  lastWeek: { income, revenue, costs, interest, salaries, overhead, payroll },
  finance: {
    q: { revenue, freelance, production, salaries, payroll, overhead, interest, living, borrowed },   // current quarter, weekly flows
    qStartCash, lossCarry,
    history: [ { year, quarter, …q, deals, profit, tax, net, lossCarry, cash } ]   // last 12 quarters
  },
  market: { genres: { genreId: popularity }, topics: { topicId: popularity } (v9), cycle: { id: 'boom'|'normal'|'recession', quartersLeft }, slate: [ unnamed small releases per week, [0] = this week ] },
  staff: { depts: { deptId: { heads, skill, payLevel, morale, strikeWeeks, grievance } } },
  recruitment: { declined: { talentId: cooldownUntilWeek } },   // v9 elite-offer cooldowns
  events: { cooldownUntil, nextWeek, seen: { eventId: week }, recentProduction: [eventId] },   // 6.1: disaster cooldown, next studio-event roll week, last week each studio event fired
  awards: { history: [ ceremony results, newest last, max TUNING.awards.keepHistory ], pool: [ snapshot of rival films for the next ceremony ] },   // 6.3
  rivals: {
    list: [ { id, name, strategy, baseStrategy, focus: null|[genreId], tier (1–4), cash, fame, status: 'active'|'bankrupt', foundedWeek, closedWeek,
      films: [ { id, title, genre, budget, quality, hype, week, stage: 'planned'|'release'|'done', checked, moved, opening, gross, revenue, weeksIn, result } ],
      qResult, results: [last 4 quarters], tierWeek, lossStreak, winStreak, negQuarters, releases, nextFilmId } ],
    nextId, upstartWeek, boxOffice: { year, you, rivals: { rivalId: gross }, last }
  }
}
```
Leaderboard (not in the game state): localStorage `finalcut_leaderboard` = JSON array of `{ name (founder), studio, score, date (real date YYYY-MM-DD), year (game year the run ended), reason: 'lock'|'bankrupt' }`, best first, max `TUNING.score.leaderboardSize`.

## Events (6.1)
- content.js `EVENT_CATEGORIES` (industry, economic, studio, talent, production → label) and `EVENTS` (46 events). Each event: `id`, `category`, `text`, `choices` (2–3, each with `label`, `effects` (max 2 keys), `result`); optional `from`/`to` years, `minFame`, `minTier`, `minReleases`, `cycle` (economy cycle id), `needs` ('roster'|'staff'|'debt'|'production'), `once`, `disaster`, `genre`.
- Studio-level events (industry, economic, studio, talent/staff) fire from `eventTick()` (engine EVENTS). Category 'production' events are project-bound and are merged into the `maybeEvent` pool with DECISIONS. `TALENT_EVENTS` (3 per trait, `category: 'talent'`) still fire only while a talent with the trait is attached.
- Studio effect keys: `cash` (written in content as weeks of burn; the engine converts to dollars when the popup is raised, floor `TUNING.events.minBurn`), `fame`, `critics`, `hype`/`quality`/`weeks` (all active projects), `market` (genre popularity), `talentMorale`, `talentFame`, `rosterMorale`, `staffMorale`.
- `TUNING.events`: `startWeek` 30, `studioChance` 0.06 per week, `gapWeeks` [6,14] between studio events, `repeatWeeks` 104 before an event can repeat, `disasterCooldown` 20, `disasterWeight` 0.6, `minBurn` 400.
- A disaster (flag `disaster`) sets `state.events.cooldownUntil`; until then no studio events and no other disasters fire. Decisions use `scope: 'event'` and log type 'event'.

## Eras (6.2)
- Names, start years and blurbs: content.js `ERAS`. Numbers: engine.js `TUNING.eras[eraId]` = { `taste` {genre: ×}, `genreQuality` {genre: points}, `postWeeks`, `festival` ×, `tvFee` ×, `pickup` +chance, `windows` {windowId: ×}, `boxOffice` × (7.5: theater attendance, 1 / 1 / .9 / .8 / .75 / .72; shown in `eraLines` under Formats) } (missing = neutral). Engine ERAS section: `eraMods()`, `eraTaste(g)`, `genreDemand(g)` (= popularity × taste), `eraQuality(g)`, `eraInfo()`, `eraLines()`.
- Where they apply: demand → your openings and release-date outlook, rival openings, rival "hottest genres", pilot pickup score, TV ratings. Tech quality → `computeQuality` at release and rival films at greenlight. `postWeeks` → post-production length (min 1). `festival` → short-film festival earnings. `tvFee`/`pickup` → new series at pickup (running series keep their fee). `windows` → window totals when a feature leaves theaters.
- Transition: `checkCalendar` on week 1 of an era's start year logs it, emits `era` and raises a studio popup (`scope: 'era'`, `category: 'era'`, `lines` = `eraLines(id)`, one Continue choice; `choose()` applies nothing). Effects switch at once (no blending).

## Awards (6.3)
- content.js `AWARDS` = { ceremony name, circuit [{id, name, week, prize}] (3 fictional festivals), categories [{id, name, slot}] (Best Picture, Direction, Screenplay, Lead Performance), campaigns [{id, name}] } and `AWARD_TEXT` (log lines). Numbers: engine.js `TUNING.awards`.
- Festival circuit (`festivalTick`): at each festival week your features released within `festWindow` weeks with critics ≥ `festMinCritic` are auto-submitted once per festival. Score = 0.5 critics + 0.5 quality + 0.3 buzz ± 10. ≥ `festSelect` = Official selection (buzz, fame); ≥ `festPrize` = prize (more buzz, studio and cast fame). Buzz capped at `buzzMax`.
- Ceremony ("The Golden Reel Awards", week 10 each year, `runCeremony`) judges features released the previous year. Rival films are snapshotted into `state.awards.pool` on week 1 of each year. Player score = quality, critics, hype, buzz and campaign points; rivals get `rivalBoost` (placeholder, balances the gap in film quality). Four nominees per category, max `maxPerStudio` per studio, player needs `minScore`. Slot categories add the slot talent's skill. Noise on nomination and on the win.
- Campaigns (`awardCampaign`, `campaignQuote`): none / small (3% of budget) / big (8%), minimum $500; an upgrade pays the difference; points added to the film's score. State: `p.campaign`.
- Effects: film nomination = studio fame +1 once; win = fame +3 (+6 Best Picture, max +10 per film) and critics reputation +2; talent: nomination fame +1, win fame +4 and skill +1 (`t.awards`); prestige +1 nomination, +4 win, +8 Best Picture, ×0.85 decay each ceremony, max 100. Prestige adds `prestige × prestigeHype` to `computeHype` (small economy touch).
- Ceremony logs use type 'award' (the rival Best Picture winner has cat 'rivals'); a ceremony with a nomination for you sets `stopFlag`. Emits `awards`. `awardsTick()` runs in TURN_LOOP after `eventTick()`.

## News (6.4)
- The feed is real `state.log` entries; nothing is invented. `addLog(text, type, cat)` has an optional `cat`. content.js `NEWS` = { filters (Release, Market, Stars, Rivals, Economy, Awards, Staff), typeMap (log type → filter), catMap (cat → filter), hidden types ('project', 'decision'), hiddenCats ('production') }.
- Section of an entry = its `cat` (mapped via catMap, or a filter id) if set, else the typeMap of its type. Hidden types and categories are left out. `Engine.news(filterId, limit)` returns newest first, `newsFilters()` lists the filters.
- New log types: 'award', 'star' (`starMilestone`: talent fame crosses 50/75/90 after a film), 'economy' (cycle changes, was 'market'). `TUNING.news` = { starFame [50,75,90], headlines 5, feedMax 300 }. The feed is limited to the 300-entry log.

## Score and leaderboard (7.1–7.3)
- content.js `SCORE` = { parts [{id, name, desc}] (profit, awards, fame, reputation, hits), text { locked, bankrupt, rank } }. Numbers: engine.js `TUNING.score`.
- Formula (`scoreCalc`, floored at 0, rounded): profit = `profitWeight` × sign × log10(1 + |profit| / `profitRef`) with profit = cash − debt − start cash; awards = `awardsScale` × (wins × `win` + lost nominations × `nom` + Best Picture wins × `pictureWin` + festival prizes × `festPrize` + selections × `festSelect`)^`curve`, features only; fame = studio fame × `fame`; reputation = critics rep × `critics` + prestige × `prestige`; hits = `hit` × (Hit features + shows with ≥ `hitSeasons` seasons)^`curve`. Current values: profitRef 5000, profitWeight 60, fame 2, critics 0.5, prestige 0.5, win 6, nom 2, pictureWin 6, festPrize 3, festSelect 1, awardsScale 2, hit 8, hitSeasons 3, curve 0.5.
- Lock: `checkCalendar` calls `lockScore('lock')` on week 1 of `TUNING.scoreLockYear + 1` (2031); `gameOver()` calls `lockScore('bankrupt')`. Locking is idempotent, freezes `state.score`, records the run on the leaderboard (rank returned), logs it (type 'milestone'), emits `score`, and at the lock year raises a studio popup (`scope: 'score'`, `lines` = `scoreLines`, one Continue choice). Play continues after the lock with the score frozen. Features released late in the lock year are judged at the next ceremony (week 10 of 2031), after the lock, so their awards don't count.
- Leaderboard (`recordScore`, `leaderboard`, `clearLeaderboard`): localStorage `finalcut_leaderboard`, best first, top `leaderboardSize` (20), ties by older date first; without browser storage the list lives in memory. One entry per run.
- Balance (7.5, sim.js, seeds 1000–1029): median score prestige 764, blockbuster 740, cheap 622, careful 786; bankrupt 1 / 1 / 0 / 0 of 30; median profit $46M / $42M / $8M / $65M. Score weights unchanged from 7.3.
- Balance (7.3, sim.js): bots (prestige / blockbuster / cheap genre) play 1970 → lock. With linear counts the awards and hits terms decided everything (medians 7,225 / 6,111 / 1,638). The square-root curve compresses volume; on 30 fresh seeds each the median final score is prestige 891, blockbuster 871, cheap 575. Game-rule TUNING was not changed (a lower `boxOfficeBudgetExp` only broke the blockbuster bot).

## Rules summary
- Productions: up to `capacity()` at once (from growth tier: 1/1/2/3/4). Each spends its weekly production budget. One decision shows at a time; others queue.
- Cast: director, writer, lead, crew. Founder can fill director/writer on one production at a time while a filmmaker. Empty slot = local hire (skill 20 in v9).
- Fees: paid up front from the project budget (max 60%). Fees above 30% of budget cut the tier's quality bonus. Roster talent costs no fee.
- Quality = base + weighted slot skills (director .35, writer .25, lead .15, crew .10, mentors add skill) + tier × production share + topic fit + genre affinity (+3 each) + trait quality + crew specialty + era tech (6.2) + decisions + random, then the soft cap (7.5: above `TUNING.softCap.quality` 70, extra points fade: knee + 30 × (1 − e^(−over/30)), so ~100 raw → ~89).
- Hype = studio fame × .4 + founder Charisma (×.1 filmmaker, ×.2 executive) + lead fame × .25 + director fame × .08 + traits + crew specialty + decisions + marketing + prestige × .05 (6.3), then the soft cap (7.5, knee `softCap.hype` 65).
- Shoot: unreliable or Perfectionist/Hothead talent can add a week. Trait events (CONTENT.TALENT_EVENTS) are ~40% of events when matching talent is attached.
- Talent: 37 at start, 3–5 newcomers per quarter, pool trimmed to 70 (never removes talent with credits). Skill grows on release × (1 − skill / `talent.growthCap` 85) (7.5; was 120, so reused talent hit 100), fame on result. Free agents drift yearly.
- Contracts: per-project deal ends at release. Exclusive from fame 20: weekly salary (feature fee × 1.5 / 52), 4-week bonus, 1–3 years, roster cap from growth tier (2/4/7/10/12), warning 8 weeks before expiry, release = severance up to 13 weeks.
- Founder: first exclusive signing makes the founder an executive (permanent): no directing/writing, Business gives a deal discount (0.4%/pt, max 30%), Charisma hype doubles, grows Business/Charisma per release.
- Freelance: filmmaker founder freelances when not on an active production; executive only when nothing is in production.
- Shorts go to a festival (screened / selection / win). Features run weekly box office with decay.
- Market (4.2, 7.5): opening = budget scale ((budget/350k)^`boxOfficeBudgetExp` 0.85) × 0.5 × (quality/60)^`boxOfficeQualityExp` 1.3 × (0.6 + hype/100) × luck 0.7–1.3 × genre demand (popularity × era taste, 6.2) × season × economy cycle ÷ (1 + 0.12 × competition pressure) × distribution dept × era theater attendance (`TUNING.eras[id].boxOffice`, 1.0 → 0.72), then soft-capped by the year's audience cap (grows 5%/yr). Weekly legs = 0.6 + quality/400, max `legs.max` 0.81. Rivals use the same curve (`qualityFactor`, `luck`, `legsDecay`). Genre popularity drifts quarterly with occasional hot/cold trends; cycle boom/steady/recession lasts 2–8 quarters. Features get a release-date decision (now / +2 / +4 weeks) from the 12-week slate, listing named rival films.
- TV (4.3): pilot → pickup chance from quality/hype/genre demand (5–75%, + era pickup); pickup pays 50% of pilot budget, pass pays 20%. Series air one episode a week: fee (× era tvFee at pickup) + ratings bonus − episode cost. Season end: renew if average ≥ 7 (10% luck otherwise), max 7 seasons, 13-week hiatus, fee +15%, cost +10%.
- Windows (4.4): when a feature leaves theaters it opens each window available that year: TV rights (1 payment after 52 wk), home video 1980–2014 (26 wk from week 26), streaming 2010+ (52 wk from week 13). Total = gross × share × (0.5 + quality/100) × era window mult.
- Growth tiers (4.5): Solo → Indie → Mid studio → Major → Franchise empire; upgrade needs fame + releases and costs cash; sets capacity, roster cap, TV slots, dept cap, upkeep, box-office share bonus, and unlocks formats/budget tiers (features + pilots at Indie, Big at Mid, Blockbuster at Major, Tentpole at Empire).
- Staff (4.6): departments (development → quality, production → fewer delays, marketing → hype, distribution → box office), effect = k × √(heads × skill/50 × (0.5 + morale/100)). Hire/fire/raise/cut/train. Morale drifts toward 55 + (pay − 1) × 90 − grievance. Below 30 morale: 4%/wk strike decision.
- Economy (4.1): studio size level 0–5 from trailing 4-quarter revenue (thresholds $50k/$250k/$1M/$3M/$8M a year). Weekly overhead = fixed by level + growth-tier upkeep + revenueShare (0–45%) × that week's revenue. Staff = level base + per active production + 1 per 2 roster talent, $200/wk each. Quarter ends every 13 weeks: passive summary row, progressive tax on profit after loss carry-forward (7.5, `economy.taxBrackets`: 30% to $500k, 45% to $2M, 60% above; `taxOn()`); Advance does not stop just for a quarterly summary. "Deals" = cash change not covered by weekly flows or loans (fees, marketing, decision costs, bonuses, severance).
- Rivals (5.1): 4 at start (Blockbuster / Prestige / Cheap genre / Trend chaser), tier 1–2, cash = 3 typical budgets. Budget, films per year and overhead (20% of a year's film spend) scale with tier, strategy and the audience cap; bigger tiers get +4 quality/+5 hype per tier. Quarterly check: if the last 4 quarters lost money, next films lean to the 2 highest-demand genres; after 3 losing checks the rival becomes a Trend chaser; 6 profitable checks → back to its original strategy.
- Competition (5.2): rival films are dated 20–32 weeks ahead (preferred seasons, least crowded week) and may move up to 3 weeks when they enter the 12-week forecast. Your locked release date makes weaker rival films nearby move away; stronger same-genre ones hold. Pressure = unnamed seasonal releases + named films (1 each, +0.5 same genre, +0.5 big budget; half weight in their first 3 weeks) + your own overlap. Later weeks ÷ (1 + 0.03 × new openings). Rivals face your films the same way. Yearly box-office share in rivals.boxOffice.
- Poaching (5.3): roster talent with an expiring contract (10%/wk) or morale < 35 (4%/wk), × (0.5 + fame/100), get an offer (market salary × 1.2–1.5, 1–3 yrs) from a rival that can afford it → studio decision: Match (stay chance from morale/traits), Beat by 20% (95%), or Let go. 26-week cooldown per talent. Leavers finish your current production. Roster morale drifts toward 70 − underpay × 80 − idle weeks past 13 (max 30) + 10 if Loyal; hits/wins +10, renewals +15.
- Rival growth/bankruptcy (5.4): grow a tier when cash ≥ 4 next-tier budgets and the last 4 quarters made money; shrink (sell 1 budget) when cash < 0 while losing; max one tier change a year. Bankrupt after 2 distressed checks at tier 1 (4 at bigger tiers): slate cancelled, talent freed. Upstart (tier 1, random strategy) 6–20 weeks later; 20% yearly chance of an extra one, up to 6 rivals.
- Events (6.1), Eras (6.2), Awards (6.3), News (6.4), Score (7.1–7.3): see their sections above.
- Bankruptcy: negative cash → missed payroll (4 wk) → creditor deadline (4 wk) → game over; the score so far is frozen and recorded (7.1).

## Media (8.1–8.5, media.js)
- Settings: `Media.settings` = { music, sfx, volume, reduceMotion }, saved to localStorage `finalcut_media` (not the game save). First run copies the OS `prefers-reduced-motion` value into `reduceMotion`. API: `setMusic(on)`, `toggleMusic()`, `setVolume(0–1)`, `musicState()` → { on, volume, mood, era, style, supported }, `posterSVG(p)`, `portraitSVG(t, size)`, `backdropSVG(eraId)`, `trophySVG({won, picture})`, `badgeSVG('prize'|'selection', label)`, `setSfx(on)`, `toggleSfx()`, `setReduceMotion(on)`, `toggleReduceMotion()`, `countUp(root)`, `confetti()`, `shake(el)`, `motionOK()`.
- Music (8.1): Web Audio, generated live. Look-ahead scheduler (25 ms tick, 120 ms ahead), 16 steps a bar; bass + pad chord each bar, drums, seeded melody from chord/scale tones. `STYLES[eraId]` (bpm, swing, root, waveforms, filter, kit; 70s keys → 80s synth → 90s lo-fi → 2000s electronic → 2010s ambient → next-wave FM bells). `MOODS` calm / tense / triumphant (chords, scale, density, drum pattern). The AudioContext starts on a user gesture (the toggle, or the first click after loading with music on); it suspends when the tab is hidden.
- Mood (`moodNow`): tense when bankrupt warnings are active, a crisis is pending, or cash < 4 weeks of burn; triumphant for 6–12 bars after a Hit, a festival win, a ceremony win, a tier upgrade or the score lock (Engine events `finished`, `festival`, `awards`, `tier`, `score`); otherwise calm. Mood and era changes start on the next bar.
- Posters (8.2): `posterSVG(p)` returns a 200 × 300 SVG string, seeded from id + title + genre (same film = same poster). Era of the release year (start year before release) picks the treatment (`POSTER_ERAS`: 70s framed paper and serif, 80s neon grid and chrome type, 90s minimal block, 2000s teal-orange with vignette, 2010s flat and spaced type, next-wave glow mesh); genre picks the palette (`GENRE_PAL`) and an abstract motif (no real artwork or likenesses); text = "{studio} presents", title (wrapped, auto-fit), genre tagline (`TAGLINES`), lead and director from `p.castNames`, year.
- Art (8.3, ART section): all SVG strings, seeded (`hash`, `rng`) so the same talent/era/film always looks the same; no faces. `portraitSVG(t, size)`: shape family by role, palette from the talent's first affinity genre (`GENRE_PAL`), shape count and frame from fame. `backdropSVG(eraId)`: 600 × 100 era banner (six looks). `trophySVG`: gold or silver film-reel statuette (star for Best Picture). `badgeSVG`: laurel with a label (prize or selection).
- Sound effects (8.4, SFX section): their own AudioContext, gain and compressor (work with music off; toggle `settings.sfx`). Table `SFX`: tick (turn), register (money), flop, clap (release), applause (win), alert (decision), alarm (bankruptcy warning). `sfxFor(type, data)` maps Engine events to sounds; `queueSfx` batches them per tick (setTimeout 0): the tick is dropped when anything else plays, applause drops the register, so Advance doesn't play a burst.
- Visual effects (8.5, FX section): `countUp(root)` animates `<span data-key data-count>` elements (UI emits them with `cu`); each element is marked `data-cu`, and the first sighting of a key counts up from 0. `confetti()` draws on a `#fx-confetti` canvas created by media.js (ceremony win or festival Won). `shake(el)` adds class `shake` to `#app` and `#modal` (disaster `decision_pending`). Reduce motion = body class `reduce-motion`, whose CSS turns off all animation and transition; `motionOK()` gates the JS effects. EVENT_HOOKS `onEngineEvent` handles mood, `queueSfx(sfxFor(...))`, confetti and shake; `newgame` and `load` reset the count-up memory.
