# FinalCut v14.3 — Film lifecycle, promotion, critics and guided first film

Implementation staged across PRs #10–#13. Stage A, B and C merged and tested; Stage D waits for final acceptance.

## Film Hub: v14.3a
Players can open project decisions and weekly financial results from Projects and My Filmography. The Film Hub explains locked or available festival kits, encore screenings, feature licensing, retrospectives and fan tours. Shorts usually need quality 60+ or a festival selection for encores. Feature afterlife requires actual eligibility and typically starts four weeks after release. Custom uploaded posters no longer display an unrelated synthetic movie still underneath.

## Promotion, sponsors and critics: v14.3b
One paid optional pre-release Film Promotion campaign per project provides modest, bounded release hype. This does not replace the existing feature marketing decision or post-release publicity. One fictional sponsor can offer money and modest awareness when Lifetime Fame and current Buzz or Prestige reach eligibility levels. New studios normally have no offers; genre mismatch brings a potential critic penalty, and declining incurs no cost. Sponsorship is recorded once in project receipts and studio cash.
At premiere the game persists a few original fictional reviews with publication, critic name, tier, number score, star score and short comment. A small studio usually receives one or two lower-tier critics; established studios attract more and higher-tier attention but not guaranteed praise. Positive or negative press can move opening hype by at most six points. Previously released films do not receive fabricated history.

## Industry visibility and film financials: v14.3c
Rivals calendar highlights movie titles, actual rival features, player feature/short/TV projects, media formats, estimated dates when timing is not fixed, and same-week/genre/story-topic overlap. It does not invent rival short films.
Weekly charts show latest and peak figures, tap/keyboard bars and a complete numeric data table. Question-mark help explains quality, hype, modeled reach, fame, prestige, studio receipts and direct profit/loss. In-game festival-kit and encore confirmations display cost, remaining balance, and the +4 merit effect for FUTURE juries; no award is guaranteed.
World Film Archive now displays feature box office, actual studio receipts, film direct profit/loss and modeled reach by media format. Shorts/TV show an em dash instead of a misleading $0 theatrical box-office figure; missing legacy revenue is not fabricated.

## Interactive tutorial: v14.3d
The state-aware, 23-step first-film guide asks the user to choose a real script, greenlight a project, open its Film Hub, click Next week and Advance to next decision, resolve genuine events, reach an actual premiere, examine weekly receipts and P/L, open the film record and compare World Film Archive, Rivals and Studio Profile. Next is disabled until the corresponding actual action happens. The guide is nonmodal, minimizable and skippable. Returning players can follow an existing film or browse feature reference without mandatory spending. It never simulates a film by itself.

## Compatibility and QA
Existing save schema v13 remains unchanged. Optional new fields preserve legacy careers; FCP1/FCP2 compact saves, independent save slots, custom posters and worker autosaves remain supported. Sponsorship adds one real project receipt; paid promotion adds one expense; direct film P/L excludes studio shared overhead. Audience counts are modeled estimates.
CI: tests/v14_3a_filmhub_browser.py; tests/v14_3b_promotions.js and v14_3b_promotions_browser.py; tests/v14_3c_calendar.js and v14_3c_interface_browser.py; tests/v14_2_tutorial_browser.py. The integrated v14 regression suite, v13.5–v13.9, v14.1 12×61-year balance, and v14.2 mobile save checks are all mandatory gates.
Physical Android and iOS device speed, memory and browser storage limits still need manual checks. No cloud sync or real sponsors/critics were added.
