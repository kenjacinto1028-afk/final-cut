# Final Cut v13.4 — Year-End Honors & Cinematic UI

## New: Year-End Honors popup
- Week 52 now pauses **Advance to next decision** and shows a two-stage, skippable year-end honors recap. "Reveal the winners" unveils all recorded annual ceremony results presented that calendar year, the player's nominations and wins, festival prizes, highest grossing and best-reviewed releases, and the actual rival winners.
- The popup **does not generate awards** or change skill, fame, cash, film quality, or scoring. Ceremonies still take place at their original weeks and generally judge the prior year's films. The first year can have no eligible annual ceremonies; the UI explains why.
- Honors prioritize existing mandatory decisions. The interactive tutorial can finish before the recap appears, with no interference. Honors have Close, View Awards, Escape and keyboard-focus handling, and are replayable from the Awards screen.
- Viewed years persist inside the existing v13 save. On upgrading an older save, previously recorded annual reviews are marked as viewed; new years present normally. No save-version increase.

## New: visual transitions
- Short fade/slide when navigating between game sections and reversing navigation, gentle presentation on decision popups, animated year-end trophy/reveal and earned-win confetti.
- Additional unobtrusive film-shoot and box-office hit cues build on existing premiere, festival, award, era and crisis effects.
- Mobile award reveal fits in a scrollable dialog; existing Reduce motion toggle and OS reduced-motion preference disable animations.

## New: audio feedback
- Added synthesized WebAudio UI navigation and awards reveal tones alongside existing premiere, success, warning and applause effects; no external sound downloads or copyrighted tracks.
- Sound effects remain **off by default**. Enable them from the sidebar or directly inside the honors popup. Existing volume slider now applies to both music and SFX, and settings persist separately from game saves.
- Audio follows browser autoplay restrictions, requires user interaction, and is suppressed in hidden tabs.

## Unchanged
- Film economy, award odds, festivals, rivals, production costs, and historical records (no rebalancing). Award recaps never reroll results.
- `content.js`, `sim.js` and `poster-store.js` remain identical to v13.3. This is a presentation update plus a week-52 Advance stop.
