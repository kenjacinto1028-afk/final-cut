# Final Cut v13.4 — Year-End Awards & Cinematic Feedback

## Functional intent
- At week 52 each year, Advance stops and a **Year-End Honors** dialog summarizes awards *presented in that calendar year*, player wins/nominations, notable rivals, and festival prizes. Award ceremonies continue at their existing dates (they typically recognize the previous year's eligible films). The popup is recap/presentation only; it **does not award new trophies or rewards**.
- Two-stage, skippable reveal (intro → actual winners); show an honest empty-state when no categories or studio winners. Close by button or Escape. Existing pending gameplay decision and endgame modal take precedence, as does the interactive first-run tutorial. Offer "Review awards" navigation after closing.
- Dismissal is stored per year with the game save to avoid repeat popups on reload; older saves mark preexisting reports seen on migration. Presentation pauses auto-advance at the end of year.
- Accessible headings, dialog semantics, keyboard focus handling and clear motion-free equivalents; no time/cash changes for presentation.

## Sound and transitions
- Reuse opt-in WebAudio SFX (off by default), add original generated navigation, page and awards reveal cues and master volume control that applies to both music and SFX.
- Brief view fade/slide during sidebar navigation and award-card reveal; brief celebratory sparkle on player win. Honor existing reduced-motion toggle and system preference. No new audiovisual external assets or music.

## Acceptance
- Year-end popup fires once per year, handles zero trophies and multiple ceremonies, survives save/reload, defers behind decisions/tutorial, and does not double-count awards or alter finances.
- Game views remain navigable after dismissal, other decisions still work, reduced-motion and audio-off remain calm; browser and Node tests pass.
