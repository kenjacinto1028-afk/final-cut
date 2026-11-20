# Final Cut v10 — World expansion (2026-11-20)

Major release; source stays separated into content.js, engine.js, media.js, ui.js, style.css and sim.js.

## Player progression and worldwide releases
- New games offer five home regions (North America, Europe, Asia-Pacific, Latin America, Middle East & Africa). Home region is the default free distribution market; there are no home-region talent or festival locks.
- Film release planning can select additional overseas markets. Each market increases distribution costs and potential audience reach. Region-specific gross and revenue are recorded, and gross totals reconcile to film-wide gross.
- Existing v9 saves default to North America without changing their historical production performance. Older films without region data remain marked incomplete.

## Living film history and rankings
- My Filmography has All My Films and My Rankings tabs. All My Films displays studio and world ranks for eligible completed features and shorts.
- World Film Archive preserves all *newly produced* AI film records, including films from bankrupt and retired studios; player projects retain their canonical history.
- Clicking a film opens a shared history panel with production timing, genres/topics, personnel credits, regional distribution, financial performance, awards and festivals.
- World and studio rankings use the same deterministic formula. Choices include overall, genre, topic, era-adjusted box office, critics and award totals, with filters by decade/region/format.
- AI releases now have named contracted or freelance credit snapshots. Legacy rival releases cannot retroactively recover credits and are marked as partial, not guessed.

## Rivals, festivals and awards
- Six starting competitors (Indie/Mid), growing toward a soft cap of fifteen active studios with entrances, closures and growth.
- Original six festival tiers retained. Maximum two specialized festivals arrive per decade from the 1980s, for sixteen by the 2020s. Films can join multiple suitable festivals; shorts and features are judged on scheduled weeks.
- Submission is not an award. Merit and jury competition determine rejection, official selection, special mention/runner-up, and prize. Shorts count toward the festival part of the final score.
- Three additional annual ceremonies unlock by era: Critics Circle Honors (1980), Independent Screen Awards (1990) and Audience Spotlight Awards (2000), joining the original Golden Reel. Player and rival films compete for nominations and trophies; awards persist in film history.

## Testing and notes
- Legacy v8/v9 saves migrate to v10.
- Gameplay and UI smoke checks include region setup, regional gross, festival growth, 15-rival world, ceremonies, rankings and archive persistence.
- Save files can grow to about 3.2–3.7 MB by 2031 in automated simulations. This is beneath a nominal 5 MB limit but storage quotas vary by browser. Periodic save backups are sensible.
- Late-game fame/prestige saturation and high award counts remain open tuning areas; simulations do not establish ideal human play balance.
