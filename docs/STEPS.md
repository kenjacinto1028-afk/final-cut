# Final Cut – Steps and Prompts

How to use: start a new chat in this Project, pick the listed model, and type "Do step 2.1" (or any step number).

## Instructions for Claude when asked to "do step X"
1. Find step X below and follow its prompt.
2. Read the files the step needs from the Project (`Final Cut/` folder) first. Never work from memory or old copies.
3. Follow the Project rules: name the file and section first, return only changed sections in chat, bump SAVE_VERSION on state changes, update ARCHITECTURE.md when sections or state change.
4. Write each changed file back to the Project in full, at the same path.
5. Tick the step in `Final Cut/TODO.md` and add a one-line note of what changed.
6. End with what could break, and which step comes next.
7. If the chat is running a different model from the one listed, say so before starting.

---

## Phase 1 – Minimal playable (done)
- 1.0 Build phase 1. Model: Opus. Done.
- 1.1 Rename to Final Cut. Model: Haiku. Done.

## Phase 1.5 – Balance
**1.5 Balance after playtest** · Model: Sonnet (Haiku for single-number tweaks)
> I playtested the current build. Notes: [what felt too easy, too hard, slow or confusing]. Adjust only engine.js TUNING (and content.js DECISIONS if needed). Explain each change in one line.

## Phase 2 – UI shell
**2.1 V2 layout** · Model: Sonnet
> Replace the bare-bones layout with the V2 high-contrast design from the Game Plan section 7: black sidebar with grouped tabs (Studio, People, Business, World), white content area, Archivo headings, Inter text, one blue accent, yellow only for attention. Update index.html, style.css and ui.js NAV/TOPBAR/RENDER. Display only, no game rules.

**2.2 Navigation history** · Model: Sonnet
> Add back/forward navigation history and a breadcrumb (group › page) to the top bar. ui.js only.

**2.3 Reusable table** · Model: Sonnet
> Build a reusable table component in ui.js with sortable columns, segmented filters and search. Use it for the Projects view.

**2.4 Detail drawer** · Model: Sonnet
> Add a slide-in detail drawer in ui.js. Clicking a project row opens its details (stage, budget, spent, critics, gross, decisions taken).

**2.5 Dashboard** · Model: Sonnet
> Rebuild the Dashboard to show only: week, pending decision, four-number strip (cash, weekly burn, profit, debt), in-production list, headlines (use the log until news exists in phase 6). Any helpers for weekly burn/profit go in engine.js, not ui.js.

## Phase 3 – Talent
**3.1 Talent generator** · Model: Opus
> Add a talent system in engine.js: generate fictional actors, directors, writers and crew with skill, fame, reliability and genre affinity. Names and trait definitions go in content.js. New state for the talent pool: bump SAVE_VERSION and update ARCHITECTURE.md.

**3.2 Traits** · Model: Sonnet
> Write the personality traits in content.js (Perfectionist, Diva, Loyal, Hothead, Mentor, Party animal, Recluse, Ambitious, Reliable) with descriptions and the stat or event effects engine.js should read. Data only.

**3.3 Attach talent** · Model: Opus
> Let projects attach talent (director, writer, lead actor, crew). Quality and hype use attached talent plus founder stats. Hiring cost comes out of the budget. Bump SAVE_VERSION.

**3.4 Contracts** · Model: Opus
> Add contracts: per-project hires early, exclusive contracts and a roster cap later, contract expiry warnings. Bump SAVE_VERSION.

**3.5 Founder role shift** · Model: Opus
> Once the studio has a roster, the founder shifts from directing to running the studio: Business/Charisma affect studio-wide hype and deal costs instead of directing quality.

**3.6 Talent views** · Model: Sonnet
> Add Talent and Roster views using the table and drawer from phase 2. Highlight expiring contracts in yellow.

**3.7 Multiple productions** · Model: Opus
> Allow several productions at once, limited by a studio capacity value. Rework the turn loop and freelance logic. Bump SAVE_VERSION.

## Phase 4 – Economy and TV
**4.1 Overhead and tax** · Model: Opus
> Add overhead, staff payroll, one tax line and a quarterly finance summary. Overhead scales with studio size so late-game cash doesn't run away. Bump SAVE_VERSION.

**4.2 Market trends** · Model: Opus
> Add genre popularity that rises and fades, seasonality, competition for release weeks, and boom/recession cycles. Box office uses them.

**4.3 TV** · Model: Opus
> Add TV: pilots, series orders, seasons, weekly ratings and network fees. Bump SAVE_VERSION.

**4.4 Revenue windows** · Model: Opus
> Add revenue windows by era (theatrical, home video from the 80s, streaming from the 2010s). Era dates in content.js.

**4.5 Growth tiers** · Model: Opus
> Add growth tiers (solo, indie, mid studio, major, franchise empire) with unlocks: formats, roster cap, departments, distribution, theater chain.

**4.6 Staff & HR** · Model: Opus for logic, then Sonnet for the view
> Add Staff & HR: departments, hiring, firing, raises, morale, training, simple strike events.

**4.7 Finance and Market views** · Model: Sonnet
> Build Finance (four headline numbers plus optional details) and Market (trend table) views.

## Phase 5 – Rivals (done)
**5.1 Rival studios** · Model: Opus. Done.
> Add rival studios with a strategy (Blockbuster, Prestige, Cheap genre, Trend chaser) and a budget. Each quarter a rival checks its results and switches toward trending genres if losing money. Bump SAVE_VERSION.

**5.2 Release competition** · Model: Opus. Done.
> Rival releases compete with mine for release weeks and audience share.

**5.3 Poaching** · Model: Opus. Done.
> Rivals poach talent with expiring contracts or low morale. Notify me first with a chance to counter-offer.

**5.4 Rise and fall** · Model: Opus. Done.
> Rivals can grow, shrink and go bankrupt, and new upstarts can replace them.

**5.5 Rivals view** · Model: Sonnet. Done (plus follow-ups: Roster Morale column, Market "Named rival films" column).
> Add a Rivals view: strategy, cash tier, recent releases, poached talent.

## Phase 6 – Events, eras, awards, news
**6.1 Events library** · Model: Sonnet
> Add an events library in content.js across industry, talent/staff, economic, production and studio categories: one popup, 2–3 choices, at most two effects each, several events per trait. Engine adds a cooldown after disasters.

**6.2 Era effects** · Model: Sonnet (switch to Opus if it touches the economy model)
> Add era effects (formats, tech, revenue windows, audience taste) and an era transition message.

**6.3 Awards** · Model: Sonnet
> Add awards: festival circuit, annual ceremony, campaign spending, nominations and wins that raise talent value and studio prestige.

**6.4 News feed** · Model: Sonnet
> Add a News feed built only from real game state, with filters (Release, Market, Stars, Rivals, Economy, Awards, Staff), plus dashboard headlines.

## Phase 7 – Scoring
**7.1 Score** · Model: Sonnet
> Add a run score from profit, awards, fame, reputation and hits. It locks at the end of 2030; bankruptcy ends the run with the score so far. Weights in TUNING.

**7.2 Leaderboard** · Model: Sonnet
> Add a local leaderboard (name, studio, score, date) saved separately from the game save.

**7.3 Final balance** · Model: Sonnet (Opus if a system needs redesign)
> Run bot simulations across strategies (prestige, blockbuster, cheap genre) and adjust TUNING so no single strategy dominates. Report results in a short table.

## Phase 8 – Media
**8.1 Music** · Model: Opus
> Build generated music in media.js with the Web Audio API: era styles, adaptive mood (calm, tense, triumphant), volume slider, music toggle.

**8.2 Posters** · Model: Opus
> Build a poster generator in media.js from genre, title and era style (canvas or SVG). Show it in the project drawer.

**8.3 Portraits and art** · Model: Sonnet
> Add abstract talent portraits (shapes and colors, no faces), era backdrops, trophies and festival badges.

**8.4 Sound effects** · Model: Sonnet
> Add sound effects (turn tick, cash register, camera clap, applause, decision alert) hooked to Engine events, with a separate toggle.

**8.5 Visual effects** · Model: Sonnet
> Add visual effects (box office count-up, award confetti, disaster shake, era transition card) and a reduce-motion setting.

---

## Notes
- Steps that bump SAVE_VERSION (3.1, 3.3, 3.4, 3.7, 4.1, 4.3, 5.1) mean old saves won't load; start a new game.
- Do phase 2 before 3.6, 4.7 and 5.5 (they need the table and drawer).
- If a Sonnet step gets messy across several systems, redo it with Opus.
