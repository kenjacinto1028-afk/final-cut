# Final Cut v15a + v15b — New Project Marketing and Offline Poster Studio
Date: 2026-11-22

## Status
Implemented on `main`, retaining the existing v13 save version and compatibility with existing film/marketing records.

## v15a — Marketing before greenlight

- **Productions → New Project → 6. Marketing & audience plan** now asks for a campaign intensity (none/small/medium/large), target audience and message, before the player presses Greenlight.
- A live preview shows maximum planned spend and estimated hype effect based on the real film budget, genre/topic fit, audience and campaign message.
- The chosen strategy is saved on the film as `marketingPlan`, not purchased immediately.
- The engine settles the approved campaign automatically after post-production editing and before release preparation. It does not raise the old mandatory marketing modal for newly planned films.
- Spending is capped by *both* remaining marketing allocation and studio cash. If either is insufficient, only affordable funds are spent; awareness scales proportionately. A zero-campaign choice spends and gains nothing.
- Film Hub / Production Center promotions show the approved plan and its execution, with recorded cost and resulting hype.
- Additional optional pre-release campaigns and post-release publicity remain distinct paid actions. Immediate post-greenlight recommendations no longer push a redundant optional promotion when opening marketing was already planned.
- **Legacy films without `marketingPlan`** still use the original marketing prompt. Older saves have not been re-written.

## v15b — Offline Poster Studio

- Replaced the default generic abstract SVG approach with local procedural, genre/topic/title/era-aware poster compositions. No AI image APIs, web access, downloads or subscription required.
- Built an offline vector scene library keyed by gameplay story topics, including towns, roads, haunted homes, heists, sci-fi planets, boxing rings, clock imagery, music and frontier settings, plus title-word accents.
- Added 24 additional selectable compositions (six poster families × four variations), alongside support for previously saved design IDs.
- Every generated poster displays the film title, appropriate format/year, studio, director, writer, and up to three known lead/supporting performers. Missing historical credits are labeled `Uncredited` rather than invented.
- **Film Hub → Production** and **Project Details → Details** offer four deterministic visual choices and **Regenerate 4 designs**. Regenerating does not replace the already chosen style or uploaded artwork. Saved choices and generation batch reload with the film.
- Long titles are wrapped/fitted without dropping trailing words. SVG text is escaped.
- Existing locally stored custom posters and full backup workflows remain intact.
- Generated artwork remains cosmetic; no economic boost or poster quality rating was introduced.

## QA
- `tests/v15a_v15b.js` checks budget authorization, nonduplicate marketing, save/load, legacy behavior, title/topic/genre sensitivity, SVG repeatability, credited people and regeneration.
- `tests/v15a_v15b_browser.py` covers interactive New Project controls, four live poster previews, selection, regeneration, credited posters and responsive 320px/390px layouts.
- `.github/workflows/v15a_v15b.yml` runs those tests, JavaScript syntax, the original flexible-budget regression and prior archive browser regression.
- The original v13 save schema remains unchanged.
- Physical phone validation is separate from automated Chromium viewport coverage.

## Future v15 phases (not implemented here)
- v15c rival studio identities and ambitions
- v15d talent career demands and long-term arcs
- v15e audience communities and cult followings
- v15f industry offers and interactive opportunities
- v15g era-based public/media culture
- v15h economy, behavior and long-career balancing
