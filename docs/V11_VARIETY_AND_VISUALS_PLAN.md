# Final Cut v11 — Gameplay Variety, Film Art and Visual Polish

**Date:** 2026-11-20  | **Status:** Draft planning, updated with confirmed poster-upload and interface-effects requirements; **no gameplay code changes or GitHub changes**.
**Source checked:** The published `FinalCut_v10_2026-11-20.zip`, including `engine.js`, `ui.js`, `content.js`, `media.js`, `style.css`, `CHANGELOG_V10.md`, and `TEST_REPORT_V10.md`.

## Design rules

- Story of the studio first: each film should have an identity, a few meaningful decisions, and a remembered legacy.
- Keep the management loop simple: add choices only when they significantly change opportunity, reputation, time, or financial risk. Automate routine tasks.
- Separate player-facing film creativity from actual film success: a great-looking poster doesn't guarantee a great movie.
- Preserve offline, static GitHub Pages compatibility; no runtime generative-AI API requirement.
- Persist compact IDs/seeds, not large image blobs, in local saves; v10 long-run saves were 3.2–3.7 MB.
- User-uploaded poster artwork is cosmetic and local to the player's browser by default; never require a network image-hosting service.
- Every animation respects reduced-motion settings and mobile performance.

## Grounded v10 answers

**Regional distribution:** `engine.js` `nextStage()` checks `p.format === 'feature'` before showing marketing, region and release-date decisions. `Engine.setDistribution()` explicitly rejects non-feature films. `ui.js` displays region checkboxes only for pre-release features in the project-details drawer. Shorts use the home region by default; their festival submissions are automatic, and they do not receive a region decision. The feature prompt appears at the end of post-production, after the final-cut and marketing choices and before the release-date choice. This is why a first short film didn't present region selection.

**Current posters and pictures:** `media.js` renders deterministic vector SVG posters based on 9 genre motifs, genre palettes, and 6 era designs; artists have abstract SVG portraits, not illustrated faces. There are also era banners, trophies and festival badges. A film gets the same seeded poster on repeat viewing, but the compositions can feel repetitive.

**Current visual effects:** `media.js` already implements award confetti, disaster shake, cash/box-office count-ups; `style.css` has era transitions and reduced-motion support. v11 should improve these rather than replicate them.

## Approved-for-design candidate: A. Short-film regional distribution and clarity

**Goal:** make the v10 region feature visible and useful for shorts as well as features.

- Add post-production region planning for **shorts** with `Home only` (free), `Regional screening circuit` (small cost), and `International short circuit` (higher cost); optionally let advanced players select specific regions.
- Use each region's existing taste and audience fields to influence short-film reach, festival exposure, small licensing/screening income, and fame within bounded limits. **Do not** give shorts feature-film box-office scaling.
- Festival merit (quality/critics and suitability) remains primary; entering an international circuit is not a shortcut to high-tier trophies.
- For **features**, retain existing `Home / Wide / Worldwide / Custom` choices and regional gross mechanics. Make expected costs and opportunities visible, warn if cash is insufficient, and surface region selection clearly on the production timeline.
- Write selected regions, costs and realized recognition/income to each film's permanent record. Existing v10 films stay unchanged on migration.
- Keep default `Home only` and permit advancing without extra distribution administration.

**Files:** `engine.js`, `ui.js`, `content.js` (if new screen/short regional balance values), `sim.js`, tests.

## Candidate B. More satisfying film outcomes, less repetitive clicking

1. **Critic vs audience reception:** derive a second, lightweight audience response from genre/topic/region demand, hype and film merit. A cult film can have poor critics but a devoted audience; prestigious dramas can earn awards without huge earnings. Show both in film details and film rankings, without adding an extra player resource.
2. **Film identity and production recap:** one short, deterministic review headline and a 'why it succeeded/failed' recap at release; use actual cast fit, budget, production events, season, and regional reception. No runtime LLM required.
3. **Signature production moments:** prioritize 1–2 high-stakes choices on a project rather than frequent generic popups. Use consequences over later weeks; preserve low-frequency Studio Wire updates for everything routine.
4. **Rival story arcs:** emphasize an existing competitor's hit streak, hiring contest, expansion, slump or comeback through contextual headlines; avoid dozens of passive rival popups.
5. **Annual studio retrospective:** one optional compact review of the year's highest grossing film, critic favorite, awards, career breakthrough, cash performance and one strategic lesson. Link titles to Filmography.
6. **Progressive strategic hints:** when planning a film, show a concise reason why a region/topic/artist is strong or risky; avoid extra information screens.

**Files:** `engine.js`, `content.js`, `ui.js`, small `style.css` adjustments, regression tests.

## Candidate C. Standout new feature: Sequels and film franchises

- When an owned film becomes a genuine hit, let the player choose **Make a sequel** from its film record, automatically reusing its source title, genre/topic or cast as editable defaults.
- A hit brand creates familiarity (starting hype and easier financing); fans expect quality and repeated weak entries damage interest and reputation. Cap the stacking bonus and allow eventual comebacks.
- Retain a compact parent-film ID and franchise ID; display franchise order, lifetime grosses, reviews and awards in Filmography/World Archive.
- AI studios may produce limited sequels to successes for a living world, but without endless franchise spam.
- **Avoid** IP licensing markets, contract litigation, rights auctions or a new mandatory management panel in v11.

**Files:** `engine.js`, `ui.js`, `content.js`, `sim.js`, history/ranking tests. High-complexity work: implement only after the simpler refinements.

## Candidate D. Poster redesign — highest visual payoff

**Current limitation:** one dominant artwork motif per genre, one static era treatment, a small choice of taglines. Seeded variation within a design doesn't ensure visual diversity.

- Build **5–8 layout families** (portrait silhouette, landscape scene, typographic minimalist, ensemble, split-image, photographic-style illustration, collage, abstract symbolic, depending on genre). Combine with topic-specific icons/objects, era palettes/type, and original art motifs. Don't let every horror poster look alike.
- Generate **three deterministic design choices** at release or during project planning; allow the player to pick one *cosmetically* with a one-click default. AI films choose their own automatically. Store `posterStyleId`, palette, variant seed, not SVG/base64. Do not make poster aesthetics secretly change quality.
- Include credible billing, subtitle/tagline, optional festival laurels or awards overlays on archived films; don't overcrowd tiny mobile cards.
- Prefer SVG/procedural art first for lightweight offline rendering. Later, use a **small curated library of original pre-generated art** (WebP) as backgrounds/subjects, lazy-loaded with graceful SVG fallback.
- Maintain high readability of film titles and credits, including unusual text lengths.

**Files:** primarily `media.js`, `ui.js`, `style.css`, optional `/assets/posters` folder. Do not stuff images into `engine.js` or local saves.

### Confirmed addition: Upload a custom film poster

- For any **player-owned film**, offer **Use generated poster / Upload custom poster** in the poster picker and the film's detail/history window. The player can add, replace, remove, or revert to the generated poster at any time. AI films continue using generated artwork automatically.
- Accept common static image formats **JPG, PNG and WebP**; show a portrait-ratio preview and a simple crop/reposition control. Reject unsupported files safely (including untrusted SVG) rather than rendering raw markup.
- Process the uploaded image locally in the browser: constrain dimensions (target approximately **600 × 900 px**), encode an optimized WebP copy where supported, and enforce a reasonable per-poster size limit to avoid excessive storage. Preserve a graceful fallback if the browser cannot process the image.
- Store custom poster images in **IndexedDB** keyed by the active save/campaign and stable film ID, with only a lightweight poster reference inside the normal saved game data. Do not embed full images in `localStorage`, in the film archive, or in GitHub source files.
- For save portability, add a **backup/export option that includes custom poster assets** and can restore them on import. Explain in the UI that images otherwise remain on the browser/device on which they were uploaded, and cannot automatically sync between devices.
- Display custom posters consistently on cards, Filmography, World Archive (for the player's films), film details, award/festival screens, and any share/export view; revert to generated art if an asset is missing.
- Custom art is **cosmetic only**: it cannot affect quality, audience response, box office, festival eligibility or awards. No extra weekly decision or forced popup.

**Files:** `ui.js` (picker/editor and previews), `media.js` (poster resolution and fallback), `style.css` (crop/preview UI), a small focused browser-side asset storage module (e.g. `poster-store.js`), `index.html` (script load), and save/import/export tests. Keep the game's source modules separate.

## Candidate E. Other pictures and identity

- Replace or supplement abstract talent portraits with a **consistent library of stylized, fictional illustrated faces** for actors/directors/writers/crew. Assign and persist stable portrait IDs so a talent's likeness never changes between screens or saves.
- Add optional film-still illustrations inside film-history details, reused by theme/genre/topic without needing a unique photo for thousands of AI titles.
- Create richer event thumbnails for rare major moments: premieres, rival headlines, festival ceremonies, career achievements; most routine text events remain text-only.
- Improve era banners and award/festival identity graphics without expanding page clutter.
- Optimize assets as WebP/SVG, lazy-load and cache. Avoid copyrighted film stills or likenesses of real actors.

**Files:** `media.js`, `ui.js`, `style.css`, optional `/assets/portraits`, `/assets/events`, `/assets/stills`.

## Candidate F. Restrained interface animations and effects

V10 already provides confetti, disaster shake, numeric count-ups, and era animation. Suggested additions:

- **Opening-night reveal:** a brief film-poster transition into critic/audience results, with staggered metric appearance and a subtle revenue bar.
- **Awards/festival moments:** a short spotlight/laurel effect for first wins or rare top-tier wins, not every nomination.
- **Rank movements:** animate upward/downward change in Filmography only when a real ranking change occurs; never flash continuously.
- **Premiere and era visuals:** subtle marquee lights / film-reel wipe for major releases or decade transitions.
- All effects **0.3–1.0s**, no sound unless opted in, no looping busy backgrounds; honor current `reduceMotion` setting and `prefers-reduced-motion`.

**Files:** `media.js` and `style.css`, minimal triggers in `ui.js`. Keep animations independent of simulation outcomes.

### Confirmed scope: visual effects mean interface animations only

The requested visual effects are **purely cosmetic animations in the game interface** (premieres, awards, ranking movement and decade transitions). **Do not add filmmaking VFX as a production decision**, budget category, technology system, or gameplay mechanic under this v11 plan.

## Prioritized v11 roadmap (do not implement before approval)

| Batch | Scope | Effort | Recommended model | Primary files |
|---|---|---|---|---|
| A | Shorts: distribution choices; feature-release clarity | Medium | GPT-6 Medium | engine, ui, content, tests |
| B | Reception, film recaps, signature choices, rival storytelling | High | GPT-6 High | engine, content, ui, tests |
| C | Poster template variety, three quick poster choices, and optional custom-poster upload/editor | High | GPT-6 High | media, ui, style, poster-store, import/export tests |
| D | Illustrated portrait & still art library (small initial batch) | Medium + art generation | GPT-6 Medium | media, assets, ui |
| E | Interface-only cinematic animations for releases, awards and rankings | Medium | GPT-6 Medium | media, style, ui |
| F | Sequels/franchises with persistent history and AI usage | High | GPT-6 High | engine, ui, content, sim |
| G | Save migration, mobile and reduced-motion checks, economy tests | High | GPT-6 High | tests, sim, docs |

**Best first combination:** A + C + E in one chat/build session gives immediate usability and visual variety; C includes optional local-image upload without affecting simulation. B + F are deeper follow-on gameplay work. Asset generation D can be a curated separate batch to keep source requests small.

## Test/acceptance criteria

- Shorts can choose home/regional/international access, save choices, appear correctly in film detail, and never receive theatrical feature grosses.
- Features retain v10 international revenue accounting and decision order. Old saves load with their existing region data untouched.
- Posters meaningfully differ even for two films with the same genre and era; each poster persists through reload and archive; long titles stay readable. AI posters must also vary.
- Player can upload a JPG/PNG/WebP film poster, crop/preview it, replace it, or restore generated art; unsupported files are rejected, no remote upload is required, and no film metric changes.
- Custom poster survives saving and restarting the same browser; exporting/importing with assets restores it on another device, and missing artwork falls back cleanly. Large poster assets do not bloat normal save JSON.
- Talent portrait IDs stay consistent across lists, film details, awards and archive. Missing images fall back to SVG with no broken layout.
- Reduced motion disables all new animations; desktop/mobile screens remain readable and performant.
- Narrative recaps reflect real simulation data and don't invent studio facts.
- Historical film/rank data and festival/award results remain stable. Sequels are linked without orphan film IDs.
- Run existing 10+12 regression checks, new targeted tests, browser walkthroughs, and at least 8 long-horizon seeded strategy simulations. Audit frequent popups, save-file size, and runtime performance at 2,000+ rival titles.

## Confirmed user decisions (2026-11-20)

1. Add a **custom film poster upload option** for the player's films, alongside the enhanced generated-poster choices.
2. **Visual effects refer exclusively to animations in the game interface**, not to an in-film production VFX mechanic.

These choices are reflected above. The remaining v11 candidate features remain at planning stage until implementation is requested.
