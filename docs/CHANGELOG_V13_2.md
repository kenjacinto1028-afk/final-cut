# Final Cut v13.2 — Short In-Game Tutorial

Release scope: an optional guided introduction for new players. All economic and simulation systems remain at v13.1. Game save version remains **13**, with no save migration or gameplay stat changes.

## New player guide
- On starting a **new game**, a five-step walkthrough opens automatically. A newly started campaign is shown the guide whether or not an earlier campaign used it; no permanent skip flag is stored.
- Steps: **Welcome to your studio** (dashboard/cash); **Plan a first film** (new project/format); **Pick the people** (skill vs fame, costs); **Make decisions as weeks pass** (advance, cash burn); **Release, review and grow** (distribution, reviews, studio upgrades).
- The player can **Next**, **Back**, **Skip**, **Done**, or select **Plan my first film** at the end to navigate to the New Project screen.
- The guide is replayable anytime via **? Tutorial** in the left/sidebar menu and can be previewed from **How to play** before a game starts.
- The guide never advances time, charges money, mutates game saves, or overrides current in-game choices; existing loaded games do not automatically open it.

## UI and accessibility
- New dialog overlay uses step count, progress indicator, contextual page destinations, clear controls, and a compact mobile layout.
- Keyboard: Escape closes the guide; Tab / Shift+Tab stay within the guide. Focus returns to the opening button when available.
- Tutorial content is text-only; no new assets, sound, or major animation are required.

## Quality assurance
- Added `tests/tutorial_browser.py`: new game, preview, step navigation, skip, replay, existing save, focus, desktop/mobile, no time/cash changes, zero uncaught browser errors.
- Adjusted browser regression scripts to dismiss the newly introduced auto-guide before testing unrelated game features. Previous version-specific browser checks now allow newer save versions.
- Passed six JS syntax checks, eight existing Node gameplay regression suites, and seven browser UI suites; see `docs/TEST_REPORT_V13_2.md`.

## Known limitation unchanged
- Real GitHub Pages IndexedDB persistence of custom posters could not be verified in the testing environment. Existing local mock-based poster tests passed, but this patch does not change poster storage.
