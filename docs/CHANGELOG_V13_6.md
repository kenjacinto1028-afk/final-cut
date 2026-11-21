# Final Cut v13.6 — Cinematic A+B interface across the whole game

## Direction
A restrained hybrid of **Cinematic Noir (A)** and **Studio Command (B)**.
Matte graphite and charcoal surfaces, warm ivory type, quiet sage/teal actions and
brass accents. No neon, excessive gradients, stock backdrops or artificial imagery.
Georgia headings pair with existing Inter UI text; the original game art remains.

## Updated screens
- Navigation/sidebar: section indices, clearer hierarchy, selected-state treatment,
  consistent top controls and collapsible mobile menu.
- Dashboard: film-studio editorial heading, shortcuts to Production Center and
  Greenlight, disciplined KPI cards, production slate and industry wire.
- Production Center: visually integrated into the new dark system, with its
  existing film stages, budgets and box-office unchanged.
- New Project, Talent, Roster, Staff, Founder, Finance, Market, Rivals, TV,
  Filmography, World Archive, Rankings, Score, News and Log: consistent
  headings, panels, forms, table density, states and muted typography.
- Awards: eligible films and trophy case take priority. Ceremony / festival
  explanations and historical ceremony records stay accessible as disclosures.
- Film and talent drawers, casting/production decision dialogs, tutorial card,
  custom-poster editor and year-end honors: shared colors and accessible contrast.

## Compatibility
All changes are presentation-only in `theme-ab.css`, `ui.js`, and `index.html`.
`theme-ab.css` loads after the existing CSS so it can be easily revised.
No changes to `engine.js`, game economy, film logic, save version, awards
calculation, browser-local posters, tutorials or sound preferences.

## Verification
`tests/v13_6_sitewide_browser.py` opens all 18 major views in headless Chromium,
checks the shared dark palette, nav/tutorial/drawer functionality, collapsible
award references and overflow at 390px and 360px, and captures real UI screenshots.
The workflow also runs the existing v13 / v13.4 / v13.5 gameplay and save
regressions. Browser screenshots are uploaded as the
`finalcut-v13-6-ui-screenshots` GitHub Actions artifact, rather than included
in the save payload.

See `.github/workflows/ab-sitewide-ui.yml`.
