# Final Cut – Game Plan

Nov 19, 2026 · Title: Final Cut (working title was Backlot)

## 1. Concept

A text-based movie and TV studio tycoon in the spirit of Game Dev Tycoon: simple choices on top, a deep but readable simulation underneath. You start in 1970 as a founder with almost no money, making short films, and grow into a major studio. Turn-based (1 turn = 1 week). Bankruptcy ends the run. Score locks at the end of 2030; play can continue after.

## 2. Locked decisions

- Formats: films and TV, both available from 1970. Low starting budget makes short films the realistic first option; features and TV pilots open as cash and fame grow.
- Turn-based, weekly turns, with an "Advance to next decision" button to skip quiet weeks.
- Start in 1970. Eras: New Hollywood (70s), Blockbuster (80s), Indie boom (90s), Digital (2000s), Streaming (2010s+), light future era.
- Founder character with stats: Directing, Writing, Business, Charisma. Stats grow with use; the founder can direct early projects, then shifts to running the studio.
- Talent: fully fictional, randomly generated, with stats and personality traits.
- Accounting: simplified.
- Rivals: mostly market competition, can poach talent, act on their own with simple strategies.
- Fail state: bankruptcy, with a warning stage first (missed payroll, then a creditor deadline).
- Era revenue values and tax rates stay flat or drift slowly. They are tuning values, not historical facts.
- Economy is realistic in spirit, but limited so it stays fun (see section 6).

## 3. Growth path

Solo shorts at festivals (founder writes and directs, crew hired per project) → small indie company making low-budget features and TV pilots → mid studio with permanent staff and a small roster → major studio → franchise empire with its own distribution and theater chain. Each step unlocks bigger formats, a bigger roster cap and new departments.

## 4. Core loop

Pick a project (format + genre + topic + budget tier) → attach talent → go through production stages → release → reviews, box office or ratings, awards → reinvest in growth.

### Production stages and decisions

- Development: genre, topic, tone, budget; script rewrite choices.
- Pre-production: casting, director, locations (some give tax rebates), shoot length.
- Shoot: weekly decision popups (weather delays, star demands a rewrite, director wants a reshoot, over budget: cut or spend, happy accident expands a role).
- Post: director's cut vs test-audience cut, music, marketing budget, release date.
- Release: weekly box office or TV ratings, then later revenue windows by era (home video, streaming), reviews, awards campaign.

## 5. Systems

### Talent

Actors, directors, writers, crew (cinematographers, composers, editors). Stats: skill, star power/fame, reliability, genre affinities. Personality traits drive events and decisions: Perfectionist, Diva, Loyal, Hothead, Mentor, Party animal, Recluse, Ambitious, Reliable. Early game: hire per project. Later: exclusive contracts and a roster. Contracts ending soon are a poaching risk.

### Staff and HR

Permanent departments (development, marketing, distribution, legal, finance, HR). Hiring, firing, raises, morale, training, simple union/strike events.

### Finance (simplified)

Revenue, production costs, overhead, payroll, loans, one tax line, quarterly summary. Finance screen shows four headline numbers (cash, weekly burn, profit, debt) with an optional details view.

### Market

Genre trends that rise and fade, audience appetite, seasonality, competition for release dates, simple economy cycles (boom, recession).

### Rivals

Each rival has a strategy (Blockbuster, Prestige, Cheap genre, Trend chaser) and a budget. Every quarter it checks recent results; if a strategy is losing money it switches toward trending genres. Poaches talent with expiring contracts or low morale. Rivals can grow, shrink, go bankrupt, or be replaced by new upstarts.

### Fame and reputation

Studio fame (audience awareness), reputation with critics, reputation with talent (how you treat people). These are separate, so prestige and blockbuster paths play differently.

### Awards

Annual ceremony and festival circuit, campaign spending, nominations and wins that raise talent value and studio prestige.

### Events (kept simple)

One popup, 2–3 clear choices, at most a couple of effects each. Categories:

- Industry: strikes, new technology, censorship changes, festival hype, a rival flop freeing up talent.
- Talent and staff: scandals, burnout, raise demands, feuds, defections, breakout performances.
- Economic: recession, boom, interest rate shifts, ticket price changes, investor offers.
- Production: accidents, weather, leaks, equipment failure, cameo opportunities.
- Studio: lawsuits, buyout offers, merger opportunities, viral marketing wins.

### News

News feed with filters (Release, Market, Stars, Rivals, Economy, Awards, Staff) plus a headlines panel on the dashboard. Covers big releases and opening weekends, genre trend shifts, star signings and rumors, rival strategy changes, economic shocks. Headlines must come from real game state, never random filler.

### Scoring and leaderboard

Each playthrough gets a score that locks at the end of 2030. Score sources: total profit, awards, studio fame, reputation, hits made. Bankruptcy before 2030 ends the run with the score so far. All runs are ranked on a local leaderboard (name, studio, score, date). Weights to be tuned after the first playable build.

## 6. Limits on realism

- At most three numbers matter per decision; the rest rolls into simple Quality and Hype scores.
- No compounding bad luck: a cooldown after a disaster.
- Box office is volatile but readable: trend + quality + hype + star power + competition explain most of the result.
- Finance detail is optional, never required to play well.

## 7. UI direction

Working direction is the high-contrast redesign (V2 on the UI sample canvas), to be reworked later.

- White content area, black sidebar, black text, one blue accent for links and selection, signal yellow only for things that need attention (decisions, expiring contracts).
- Bold display headings (Archivo), Inter for text, divider lines instead of boxed cards, generous spacing.
- Sidebar tabs grouped: Studio (Dashboard, Projects, Founder), People (Talent, Staff & HR), Business (Finance, Market, Rivals), World (News, Awards).
- Top bar: back/forward history buttons, breadcrumb (group › page), week and cash, Next turn button.
- Dashboard shows only: the week, the pending decision, a four-number strip, in-production list, headlines.
- Tables: sortable columns, segmented filters, search. Details open in a slide-in drawer instead of extra columns.
- Future option: dark mode setting.

## 8. Music, images and effects

### Music

Generated in the browser (Web Audio API), no audio files. Era-flavored styles (70s funk/synth, 80s synth-pop, 90s ambient, 2000s electronic, modern lo-fi). Adaptive mood: calm, tense, triumphant. Volume slider, separate music and sound-effect toggles.

### Images

Generated by code: movie posters from genre, title and era style; abstract talent portraits (shapes and colors, no real faces); era and studio-stage backdrops; trophies and festival badges.

### Effects

Sound effects (turn tick, cash register, camera clap, premiere applause, decision alert). Visual effects (opening weekend countdown, box office count-up, award confetti, disaster screen shake, era transition card). Small UI motion (drawers, decision pulse, smooth tab changes). A reduce-motion setting turns them off.

## 9. File structure and token-saving rules

Three to four main files instead of one large file:

- index.html + style.css: page shell and styles
- engine.js: state, turn loop, all game systems
- content.js: events, traits, names, eras, genres (data only)
- ui.js: views, tables, navigation (display only)
- media.js: music, sound effects, posters, portraits, effects
- ARCHITECTURE.md: one-page map of sections, state shape and save version
- STEPS.md: every build step with its prompt and model ("Do step 2.1")
- TODO.md: progress checklist

Rules:

- Every section starts with a marker: // ===== SECTION: NAME =====
- Game rules live only in engine.js; content only in content.js; ui.js only displays state.
- Load files as plain scripts in a fixed order (works when opening index.html directly).
- Save files carry a SAVE_VERSION; bump it when the state shape changes.
- Updates return only the changed sections, named by marker, never the whole file unless asked.
- New chat per feature.
- All files live in the Project's Final Cut/ folder; Claude writes updated files back there.

## 10. Build phases and Claude models

| Phase | Scope | Model |
| --- | --- | --- |
| 1 | Minimal playable: 1970, founder, solo shorts → first feature, weekly turn loop, production decisions, bankruptcy | Opus |
| 2 | UI shell, navigation history, tables, filters, drawer | Sonnet |
| 3 | Talent generator, traits, contracts, roster | Opus (logic), Sonnet (content) |
| 4 | Economy, simplified finance, market trends, TV | Opus |
| 5 | Rivals and poaching | Opus |
| 6 | Events library, eras, awards, news | Sonnet |
| 7 | Scoring, leaderboard, balancing | Sonnet; Haiku for small text tweaks |
| 8 | Music, images, effects | Opus (music, poster generator), Sonnet (sfx, animation, polish) |

Step-by-step prompts: see STEPS.md.

## 11. What could go wrong

- Scope: this is large. Finish phase 1 and make it fun before adding layers.
- Weekly turns plus popups can get click-heavy; "advance to next decision" is essential.
- Traits only feel different if several events use each one.
- Bankruptcy balance: early game must be neither trivial nor a dead end. Plan a balancing pass after phase 1.
- Score weights may favor one strategy; tune after real play.
- Generated music sounds synthetic; generated posters and portraits look stylized.
- Too many effects bring back clutter; keep them short and tied to big moments.
- Save compatibility breaks if the state shape changes without a version bump.

## 12. Project instructions (copy into the AI project or chat system prompt)

Project: Final Cut (movie/TV studio tycoon, text-based, HTML/JS)
Files: engine.js (state, turn loop, systems), content.js (events, traits, names, eras, genres), ui.js (views, tables, navigation), media.js (music, sfx, posters, effects), index.html + style.css. ARCHITECTURE.md describes sections and the state shape. STEPS.md lists every build step with its prompt and model. TODO.md tracks progress.

Rules for every update:
1. Edit only the file(s) the change needs. Name the file and section first.
2. Return only the changed functions/sections in chat, never the whole file, unless I ask for it.
3. Each section starts with a marker: // ===== SECTION: NAME =====
4. Game rules live in engine.js; content only in content.js; ui.js only displays state and never holds game rules.
5. If a change affects the state shape or save format, say so and bump SAVE_VERSION.
6. Update ARCHITECTURE.md (only the lines that changed) when sections or state change.
7. Always read the current files first, then write each changed file back in full at the same path, and tick the step in TODO.md.
8. Keep answers short. List what could break after each change.

## 13. References

- UI sample canvas (V2 high-contrast): https://claude.ai/artifact/MgLWG4V3fkSwKTTwbgs6eh (claude.ai link; may not be reachable outside Claude)
