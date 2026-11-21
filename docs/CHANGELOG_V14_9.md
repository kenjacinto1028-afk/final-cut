# FinalCut v14.9 — Dedicated mobile interface

Released through PR #22 to `main` (merge commit `df16a32e`).

## Why this changed
Mobile screenshots from Brave on Android showed the desktop rail, undersized text, and a small centered title panel. FinalCut already had narrow-screen CSS, but not a mobile-first experience.

## Mobile changes
- **Start screen:** full-width studio and founder inputs, clear 48px+ create/continue buttons, accessible saved-game controls, natural vertical layout.
- **Navigation:** five fixed bottom destinations — Overview, Films, People, Industry, History — with active section highlighting and 44px+ touch targets.
- **More controls:** dedicated Final Cut header and slide-out navigation drawer with New Project, palette, saves, backup, tutorial, audio, and return-to-title; tap outside or press Escape to close.
- **In-game toolbar:** readable in-game week, cash, score, week actions, back/forward, and optional Project Monitor toggle arranged in useful rows.
- **Dashboard:** 2-column finance and reputation stats, two-column action buttons, compact identity card and full-width Studio Wire tabs on narrow phones.
- **Details:** scrollable subtabs and data tables, mobile-safe overlays, and browser/device safe-area padding. Live Project Monitor starts below the mobile header, so the close button remains tappable.
- **Desktop:** existing desktop design (including side Studio Wire) preserved; all gameplay/economy/save logic unchanged.

## Test coverage
- `tests/v14_9_mobile_browser.py`: real Chromium phone/touch at 320px, 390px and 768px; desktop 1440px; title, dashboard, navigation, 44px touch targets, no horizontal overflow, and Project Monitor open/close.
- `.github/workflows/v14_9.yml`: new browser test plus previous v14.8a responsive layout and v14.8 engine regression.
- Existing PR #22 regression workflows verify mobile save slots, premiere/tour, film monitoring, marketing, awards, tutorial, palettes, long-run economy and original v13/v14 systems.

## Browser note
If **Desktop site** is enabled in Brave or another mobile browser, the browser may emulate a wide desktop viewport and shrink the page despite responsive CSS. Turn off Desktop site and refresh to use the intended phone layout. Full-screen mode is not required.

## Known limitation
Physical Android/iPhone touch, performance and browser-storage behavior still benefit from real-device acceptance beyond Chromium emulation.
