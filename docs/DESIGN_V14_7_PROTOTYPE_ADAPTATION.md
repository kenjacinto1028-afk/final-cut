# FinalCut v14.7 — Six-palette studio design-system adaptation

Source: user-uploaded `final_cut_studio_tycoon_6_palette_interactive_ui_prototype.html` (1727-line interactive demo).

## Implementation constraints
- Preserve Engine, SaveSlots, poster store, gameplay state, DOM IDs and tutorial data-guide anchors. Prototype's demo simulation/data must **not** replace the live game.
- Keep real-world gameplay calendar, original live KPI logic and film monitor interactions; only change presentation and navigation emphasis.
- Four zones: slim utility/time topbar; five-section left rail with anchored New Project and six palette swatches; central canvas with nested tabs, cards, structured KPIs and filtered wire; optional persistent right film monitor.
- Default warm gold. Six dark palette themes: gold, sage, amber, crimson, cyan, terracotta. Values follow supplied prototype including darker variant canvases and corresponding accent colors.
- Use low-contrast slate surfaces, hairline borders, tabular numerals, uppercase micro-labels, restrained serif headlines and emerald/coral status semantics.
- Distinguish paid/cost actions visually from navigation; allow keyboard/focus support, accessible controls, retained reduced-motion and sound settings.
- Avoid redundant topbar and dashboard cash values: topbar is the authoritative cash balance; dashboard shows cash runway/coverage rather than the same cash counter.
- Keep meaningful feeds with real game data, live filter pills and persistent monitor chart/selection.
- New UI has no impact on game score, film quality, finance calculations or save format.

## Test plan
Node syntax checks for new theme module and UI. Browser: six live palette changes, persisted theme across reload/save switching, tablet/mobile menu, tab navigation, first-film tutorial, end-of-run/premiere reports, monitor toggle and responsive widths. Existing regression workflows must remain green.
