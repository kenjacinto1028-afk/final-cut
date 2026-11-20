# Final Cut v12 — Refinements, Talent Progression & Recognition Tiers

**Status:** Approved direction / planning only. Baseline: published Final Cut v11. No gameplay source changes in this planning pass.

## Design goals
- Make film creation, careers and competition more varied without excessive micromanagement.
- Distinguish **skill (craft)** from **fame (recognition)**. Either can be high or low independently.
- Preserve open casting: every actor/actress, director and writer is eligible for any appropriate production regardless of recognition tier. Standard budget, availability and contract considerations still apply; no tier unlock or hard studio-size gate.
- Give larger studios useful advantages without making underdog success impossible.

## Talent recognition tiers (NOT skill ratings)
| Tier | Public reach | Meaning |
| --- | --- | --- |
| Local Talent | Home region | Recognized mainly in a small home market |
| Regional Name | Nearby markets | Known in several related territories |
| National Name | Main domestic market | Strong domestic audience awareness |
| International Name | Multiple world regions | Cross-border recognition |
| Global Star / Industry Icon | Worldwide | Headline-level name with wide market appeal |

- **Recognition tier is a presentation label derived from fame/reach, not a separate stat or direct measure of ability.** The same tiers cover actors/actresses, directors and writers; UI may use context-sensitive labels (e.g., Global Star for performer, Industry Icon for director/writer).
- Fame can change with releases, screenings, awards, audience reception, publicity and time out of the spotlight. Fame need not increase every year and can decline or recover.
- Local stars should attract more attention in their familiar/home region. A globally known artist boosts awareness across more release territories.
- Tier affects hype, discoverability, market reach, fee expectations and negotiation interest but never multiplies the film's inherent creative quality simply because someone is famous.

## Skill (craft) as a separate axis
- Skill describes contribution to **film quality**, reviews and execution. It develops with work, experience, coaching and creative fit; progress may plateau, peak or decline. Avoid deterministic age-based decline and unavoidable star inflation.
- Actors/actresses: acting craft and genre fit primarily influence performance quality; fame primarily influences anticipation/hype and early audience awareness.
- Directors: directing craft, genre specialty and reliability shape execution, consistency and production decisions; name recognition affects publicity/industry interest.
- Writers: writing craft and topic/genre fit shape screenplay quality and critics' response; author fame contributes more modest buzz and hiring leverage.
- **Examples**: (a) unknown, exceptional actor: strong acting and reviews, limited pre-release buzz; (b) famous but mediocre star: strong opening attention, limited artistic lift; (c) skilled but unknown director: high execution potential, weaker marketing pull; (d) famous writer: greater anticipation, but script quality still depends on craft and fit.
- Combined cast/creative benefits should use diminishing returns and be bounded so stacking three icons is not an automatic masterpiece.

## Recruitment and economics
- All talent visible in the same recruitment/casting interface; sort/filter by **Skill**, **Fame**, **Recognition Tier**, **Fee**, **Region**, and **Specialty**.
- Negotiation and fees reflect fame, skill, availability and career goals separately. Big stars may demand more but talent at every recognition tier remains obtainable subject to normal deal conditions.
- Reputation and prestige help studio recruitment, but strong scripts, fair pay or creative freedom can attract excellent low-fame talent, even for independent studios.
- For non-named department employees, refine **department skill, morale, development and retention** without adding individual worker micromanagement or arbitrary fame tiers.
- Show a small two-axis breakdown in the casting planner: **Quality contribution** vs **Hype contribution**. Avoid implying a star's fame is skill.

## Existing gameplay refinements accepted for v12
1. **Film production:** better quality attribution for script, director, actors, topic/genre fit and decisions; choices with real tradeoffs and fewer obvious answers.
2. **Career arcs:** skill/fame change independently, with peaks, slowdowns, comebacks and occasional declines for performers, directors and writers; simple department development for staff.
3. **World competition:** more distinctive rival strategies and rival reactions to trends, regions and franchises; memorable slumps, streaks and comebacks.
4. **Reception & legacy:** reviews cite credible causes; genre/era taste evolves, festivals/awards remain competitive, older films retain rankings/recognition.
5. **Franchises and TV:** sequel expectations and fatigue, fair TV renewal logic and long-running-show variance.
6. **Economy & reputation:** test early-game cash flow, production-budget tiers, compensation vs contribution, distribution regional costs, high-end wealth snowball and fame/prestige saturation.
7. **Interface & quality of life:** clearer dashboard, film library and filters, better mobile layout, fewer repetitive notifications, targeted onboarding and financial explanation; verify real-browser poster persistence/export.

## Minimal presentation changes
- Each named artist profile: **Skill**, **Fame**, **Recognition Tier**, **Home Region**, **Genres/Topics**, recent career trend.
- Casting/crew selection: simple comparison such as "Quality +8 | Hype +2" versus "Quality +2 | Hype +10" (illustrative, not fixed tuning numbers).
- Project history: capture credited talent, their skill/fame at production, reception and resulting fame/skill movement when practical.
- Awards and region choices can affect visibility without giving free permanent skill gains.

## Implementation order & model guidance
| Batch | Scope | Recommended model |
| --- | --- | --- |
| A | Separate talent skill/fame, tier labels, recruiting/casting clarity, migration | GPT-6 High |
| B | Career development, genre/role fit and film-quality attribution | GPT-6 High |
| C | Rival behavior, audience shifts, reception, awards and franchise consequences | GPT-6 High |
| D | TV, cash flow, artist economics, reputation balancing | GPT-6 High |
| E | Profiles, film library, dashboard, notifications, mobile, poster persistence | GPT-6 Medium |
| F | Returning cast, expanded supporting actors and specialist crews, complete career history, individual awards, balance tuning and full regression/simulations | GPT-6 High / Extra High |

Keep code in existing separated modules (`engine.js`, `content.js`, `ui.js`, `style.css`, `media.js`, `sim.js`); avoid large-file rewrites where targeted edits suffice. Preserve v11 backups and write checkpoint notes after each batch. Do not publish to GitHub until tested.

## Acceptance tests
- High-skill / low-fame talent improves quality more than hype; low-skill / high-fame talent raises hype more than quality.
- No casting eligibility gates by fame, recognition tier, studio size or home region. Normal contracts and availability still apply.
- Equal skill and different fame create distinguishable opening awareness; equal fame and different skill create distinguishable final quality/critical response.
- Tier changes follow recognition trends; local notoriety is stronger at home than overseas, while global fame carries to more markets.
- Career progression includes plausible breakthrough, plateau, decline and comeback without guaranteed fame or skill increases.
- Salaries, casting AI, rivals and simulations account for new calculations; awards/legacy do not become trivial.
- Legacy v11 saves migrate without lost contracts, staff, credited films or archived records.
- Full browser UI tests (desktop/mobile), custom poster persistence and 1970–2031 seeded playstyles remain in release testing.


## Approved expanded Batch F (2026-11-20)

**A–E have been implemented in the local v12 working copy. F is the next unstarted batch.**

- **Sequels:** prioritize original performers/creative team with optional recasting; returning cast preserves hype, replacement reduces recognition but may improve quality; negotiate real availability and fees.
- **Large productions:** optionally attach more supporting actors and key crew; budget increases both possible contributions and costs. Keep diminishing returns and all-talent eligibility.
- **Career screens:** complete named talent timelines across player and rival productions, achievements, relevant controversies and credited roles. Keep ordinary departmental headcounts aggregated; optional named senior staff instead of individual HR for everyone.
- **Personal awards:** supporting performance, selective technical awards and correct attribution by artist and role; retain film-studio awards separately.
- **Balance/tuning:** actively tune sequel continuity, cast economics, reputation, TV, awards and long-campaign competitiveness in addition to syntax, regression, browser and multi-seed simulation tests.

See `V12_BATCH_F_EXPANDED_SCOPE.md` for detailed design, implementation order and acceptance criteria. No gameplay changes are included in this planning revision; GitHub remains on v11.

## Final implementation outcome (2026-11-20)
Batches A–F implemented. Batch F's final user override limits full career profiles to directors and writers and personal awards to actors, directors and writers; no new technical awards. See `CHANGELOG_V12.md` and `TEST_REPORT_V12.md`.
