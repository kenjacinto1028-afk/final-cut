# v13.3 — Interactive guided tutorial design

Previous v13.2 tutorial is a fullscreen modal (`#tutorial` overlay, focus trapped, body scroll locked), so users cannot click the Dashboard/New Project links it mentions. Replace with a **nonmodal floating guide** with no scrim and no keyboard focus trap.

## Interaction
- Expanded 13-step flow: studio intro; dashboard cash/burn/buzz; New Project link; choosing film format/genre/topic/budget; talent skill/fame; Projects link; moving weeks/production/distribution; My Filmography link; reviews/films/rankings; Finance link; Rivals link; Awards link; completion & optional jump to New Project.
- Actual sidebar navigation stays clickable. Navigation-step visits automatically progress to the next step. The guide's own "Open section" control offers an alternative, particularly on mobile. Normal Next/Back, Skip, Escape, and Finish remain available; no game clock or cash changes from guide controls.
- Highlight current section's link or content with a visible accessible ring; while on mobile, highlight the Menu button if the target sidebar link is hidden. Scroll target into view only when explicitly advancing guide content, avoiding spontaneous navigation jumps.
- Dock guide bottom-right on desktop and in a compact bottom panel on narrow screens; allow minimize/resume without losing the step. Never hide the rest of the interface behind a modal scrim.
- First new game auto-starts the guide; start-screen How to play works as informational preview; existing saves do not auto-reopen; Sidebar `? Tutorial` replays from start.
- Do not persist tutorial progress or alter game business/saving logic; accessibility: labelled complementary region, visible focus states, no Tab interception, Escape closes.

## Acceptance tests
- From new game, click **Dashboard** and **New Project** with guide visible, verify sections actually change and guide advances when expected.
- Edit project settings/crew while guide remains open, navigate Projects, Filmography, Finance, Rivals, Awards; verify guide and page remain interactive.
- Test both desktop and narrow mobile with Menu toggle, click-through, minimized state, keyboard Escape/Tab, replay, skip, existing save load and untouched cash/week until explicit game actions.
- Run `node --check` across scripts and existing regression/browser suites, record results; do not claim live GitHub Pages browser verification without performing it.
