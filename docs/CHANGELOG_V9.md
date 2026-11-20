# Final Cut — v9 Changes

Released in this workspace 2026-11-20. Original v8 source remains in `FinalCut_handoff.zip`.

## A. 25 topics and market demand
- Nine new topics: Organized Crime, Political Conspiracy, Sports Underdog, Medical Crisis, Espionage, Coming of Age, Supernatural Mystery, Time Travel and Celebrity Scandal.
- All 25 topics now have fluctuating quarterly market appeal and genre compatibility; era taste can modify demand.
- Demand contributes a bounded modifier to feature opening market, TV pickup/ratings and project planning. The Market page lists and sorts topic demand. Older v8 saves are migrated with default topic-demand values.

## B. Automatic six-tier festivals
- Local, Regional, National, Continental, International and World festival entries, with distinct selection and win standards.
- Shorts enter a suggested festival; feature films receive up to three automatic festival options. Film quality and critical merit determine eligibility/selection; **studio size is not an eligibility gate**.
- Festival badges, results, prestige and rewards reflect tier. Routine festival updates go to the log instead of a barrage of popups.

## C. Existing recruitment and staff progression
- Existing studio fame, critics' reputation and prestige affect elite artist offer interest and modest fee negotiations.
- Strong creative fit and adequate compensation allow low-fame studios a chance to attract stars.
- Unsuccessful offers impose a cooldown; existing exclusive contracts and rival retention are retained.
- Department recruitment quality reflects the same reputation and compensation factors, without adding named employees or another reputation stat.
- Simulation bot tries other eligible artists when an elite offer is declined.

## D. Production event pacing
- New production dilemmas with contextual choices; added studio-wide recent-event memory, repeat cooldowns and a lower chance of interruptions.
- Routine stage changes and quarterly accounting updates are passive; required decisions and critical milestones remain interruptive.

## E. Balance refinements
- Local fallback talent now contributes skill 20 (was 12).
- Fame gains diminish at high reputation; rival awards scoring adjusted; topic demand now matters to TV outcomes.
- Existing economic progression retained. Long-run cash and late-game fame still merit monitoring; see test report.

## F. UI refresh
- Styled after the approved reference: charcoal sidebar, warm ivory surface, cinematic gold brand details and strong dark text.
- Stronger blue primary buttons, orange contextual project CTA, clearer alert/error colors, cards and tables.
- Dashboard features a Studio Wire column and readable quick statistics.
- Added a collapsible mobile navigation menu; no horizontal overflow in mobile smoke test.

## Save compatibility and files
`SAVE_VERSION=9`. V8 saves migrate automatically; older versions remain unsupported. Browser game files are still separate and load in the original order. No external JavaScript framework or build step was added.
