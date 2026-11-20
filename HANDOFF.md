# Final Cut — Current Handoff

Version: **v10**, 2026-11-20. Branch target: `main`, repository `kenjacinto1028-afk/final-cut`.

## Run
Open `index.html` in a browser (or deploy root directory as a static site). Scripts must load in order: `content.js`, `engine.js`, `media.js`, `ui.js`. No build tools required. Headless strategy sim uses Node: `node sim.js careful 1 123`.

## Architecture
- `content.js`: definitions for regions, films, genres/topics, talent, decisions, festivals, annual ceremonies.
- `engine.js`: simulation, studio state, saved history, markets, festivals, regional distribution and rankings.
- `ui.js`: browser screens, filmography, archive, rankings, project/draft and film detail drawers.
- `style.css`: responsive premium light/charcoal design; `media.js`: media effects; `sim.js`: headless long-run simulation.
- `docs/CHANGELOG_V10.md`: what changed; `docs/TEST_REPORT_V10.md`: verification and caveats.

## Features
User picks a home region on new game. Feature films select territories at release planning and pay additional distribution costs in exchange for possible overseas revenues. My Filmography and World Film Archive record completed films and release history; world and studio rankings cover film merit, genre, topic, critics, gross and awards. AI rivals can expand toward 15 active studios; special festivals and annual award ceremonies appear by decade. New AI films have named credited artists. V9 saves migrate with transparent incomplete legacy histories.

## Developer workflow
Keep source separated by responsibility, update `TASK_STATE.md` per batch, add regression checks, test 4 strategy bots and verify actual browser layouts before release. Beware storage growth and high-fame award balance. Do not drop or silently fabricate archived films when repairing old saves.
