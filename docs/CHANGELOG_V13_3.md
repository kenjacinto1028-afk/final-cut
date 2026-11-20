# Final Cut v13.3 — Interactive Tutorial

The v13.2 five-slide introductory modal prevented players from using the game controls it described. V13.3 replaces it with a **13-step click-through tour** that keeps all normal navigation available.

## Changes
- Docked, nonmodal tutorial panel replaces the fullscreen dark overlay; normal links, buttons and scrolling remain operable while it is open.
- Guide now covers Dashboard, cash/burn/Buzz, New Project, format/genre/topic/budget, talent/cast, Projects, advancing weeks and distribution, Filmography and rankings, Finance, Rivals, Awards, and studio growth.
- Real sidebar visits for Dashboard, New Project, Projects, Filmography, Finance, Rivals and Awards automatically complete the corresponding guided step. The panel also offers an **Open section** button to navigate for the player, without spending money or advancing time.
- Current controls receive a visible outline; on small screens the Menu button is highlighted while the sidebar is hidden. Manual Next/Back remain available when players prefer to read without clicking around.
- Guide can be **minimized and resumed**, skipped, dismissed with Escape, or replayed through `? Tutorial` in the sidebar. Finish can take players to New Project. Start-screen preview works without a game.
- Focus is no longer trapped in the guide. Keyboard users can Tab to and use game controls.
- Mobile tutorial becomes a compact bottom panel; tutorial controls are available without blocking navigation.

## Compatibility
No changes to `engine.js`, `content.js`, `media.js`, `poster-store.js`, or `sim.js`. Game state, saves (version 13), balance, awards, and gameplay systems remain unchanged. Starting a new game launches the guide; loading an existing save does not.

## Tests
See `TEST_REPORT_V13_3.md`. The new `tests/tutorial_browser.py` clicks real navigation links and edits project controls while the guide stays open, on desktop and mobile. Eight current Node gameplay suites and seven browser suites pass.

## Known limitation
The browser tests run against a locally loaded page with scripts injected into headless Chromium, not the deployed GitHub Pages origin. Poster persistence at the live URL remains unverified from this sandbox.
