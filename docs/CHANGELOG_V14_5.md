# FinalCut v14.5 — Focused UI, premiere reports and market-aware film careers

**Status:** Candidate on PR #16; not released until all PR checks pass and `main` is deployed.

## Navigation and discoverability
- Five primary sections: Overview, Productions, People, Industry and History.
- A small row of contextual subtabs replaces a twenty-link sidebar; New Project stays prominent.
- Settings, audio, saves, backups and the tutorial move under a compact collapsible footer.
- Market release calendar now has one home in Industry; secondary market reports are collapsible.
- Existing view IDs and local saves are preserved. Tutorial and browser automation now target the correct subtabs.

## Film Hub and premiere
- Completed/released projects and player films in the filmography share a six-tab Film Hub: Overview, Reviews, Reach & Rankings, Performance, Awards & Legacy, Production.
- Film release opens a one-time premiere report: poster, quality, critics, audience, hype, geographic or broadcaster reach, and one-sentence scored critic reviews.
- Critic tiers render as City/Local, Regional, National or International classifications; the underlying reach/hype weighting is unchanged.
- Reports for simultaneous premieres queue, support keyboard dismissal, save their viewed state and can be replayed from Film Hub. Migration marks older releases already viewed, preventing dozens of historical reports after loading a pre-v14.5 save.
- Premiere financial text distinguishes opening expectations from actual later-week ticket, network and screening income.

## Ranking integrity
- Existing five broad markets remain North America, Europe, Asia-Pacific, Latin America, Middle East & Africa. There is currently **no trustworthy per-city or per-country accounting**. The game never invents city/country receipts or chart positions.
- Home-market, international and worldwide distribution labels summarize recorded broad markets.
- Industry rankings support overall/critic/audience/reach/gross/awards criteria, genre/topic, format (features, shorts, TV pilots, web episodes), region, reach category and period.
- Local-market **gross** chart uses recorded `regionalGross[region]` from player and rival films and omits films lacking a recorded amount. Historical charts show completed releases. Real-time weekly city charts are explicitly out of scope pending real local-market simulation.

## Script marketplace
- Original scripts remain free of third-party script-rights fees and let players select genre, topic and vision.
- Paid marketplace rights now add a **bounded +1 craft readiness**, or **+2** if the creative vision matches the purchased screenplay. Zero-fee pitches receive no bonus.
- The effect is itemized in the production quality breakdown. It never guarantees good reviews or profitability; cast, production, audience tastes, costs and randomness remain decisive.

## Compatibility and verification
- Save version remains **13**. Existing finance, screening and series flows remain active; no historical film gross is rewritten.
- New regression gates: `tests/v14_5_regression.js` and `tests/v14_5_browser.py` (engine, desktop and 320/390px browser).
- Existing browser tests were updated to navigate the new tabs and acknowledge release reports before touching underlying controls; historical tests still cover legacy gameplay.
- Physical iPhone and Android testing remains outstanding; desktop/mobile Chromium simulation is not equivalent to device validation.

## Remaining follow-ups
- Optional city/country theatrical market modeling, staged local-to-national expansion offers, and genuinely time-scoped chart snapshots require additional accounting and calibration, and must not be represented as already implemented.
- After release, monitor whether the +1/+2 script-readiness tradeoff is competitive with original writing and whether the new popup cadence becomes too interruptive in large studios.
