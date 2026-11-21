# FinalCut v13.9 — Quality, hype, reach and a living short-film circuit

## What changed

The right-side **Project Monitor**, Production Center, Filmography and project/film drawers show a coherent set of status and commercial indicators:

- **Film quality / 100**: finished craftsmanship. During production a range is forecast, clearly identified as uncertain.
- **Release hype / 100**: awareness at opening. Before release, a non-binding hype forecast is shown.
- **Critics / 100**: separate from the film quality and audience-review ratings.
- **Features — estimated admissions**: already present in v13.8; inferred from the game's real simulated ticket gross, not unique moviegoers.
- **Shorts — estimated screening visits**: derived from actual credited screening income divided by a modeled studio net receipt of **$0.75 per visit in 1970**, growing 3.1% per year. It is **not measured attendance**, unique persons, or box-office gross.
- **Picked-up TV series — estimated household impressions**: modeled from each aired episode's existing ratings (35,000 household impressions per point in 1970, growing 2.5% annually). Cumulative impressions **are not unique households**. Rejected pilots get no fictitious viewers.
- **Actual weekly receipts** and matching **modeled weekly attendance/household curves**, studio income and direct film P/L.
- **Festival exposure**: actual planned/judged entries, selections/mentions/wins, and the next scheduled jury event, not fake trophies.

All changes respect FinalCut's A+B dark cinematic styling and its existing project and archive pages.

## Short films are now actual weekly releases

Shorts no longer exist as a three-week wait followed by one lump sum. Their main screening circuits last **3–12 weeks**, determined by actual finished quality, audience response, opening hype and regional reach.

The original single-sum short-screening formula remains the baseline. The engine distributes that same target over each release week using tapered attendance/revenue weights and reconciles the last payment. **There is no automatic windfall from having additional weeks.**

Successful shorts may run longer, giving the project visible weekly earnings, audience estimates, and release progression in the studio monitor. The existing fictional festivals remain calendar-driven. Completing the initial screening run does not cancel jury entries.

## Limited post-release engagement

The user can optionally choose two different activities during a short's first 52-week festival year:

1. **Festival press kit** — one payment of $75 to $700, tied to film budget, granting a modest +4 points to future festival jury merit. Existing calendar, eligibility, scarcity and trophies are still authoritative; no award is guaranteed.
2. **Encore screening circuit** — once for a completed short with film quality 60+ or a festival selection. Costs $75 to $750, has **four additional paid weeks**, and earns at most approximately 20–23.2% of its original screening target, before direct costs. An encore is not guaranteed to break even.

An eligible short remains on the dock after the main release, with festival follow-up and the encore action where available. Otherwise the completed film remains in the full catalog.

## Save integrity

The game still uses save schema **v13** and existing independent save slots. The additional metrics and activities are optional project fields; historical games load normally.

- Old **completed** shorts are **not paid again**. Where receipts were recorded but attendance was not, the game offers only a labeled lifetime modeled estimate.
- Old **in-progress** shorts receive future payments through the new weekly circuit, preserving the original release income target without replaying payouts.
- No imaginary historical weekly charts or measured real-world audiences are inserted.
- TV audience estimates only start when the upgraded engine processes actual airing weeks.

## QA

Tests include:
- `tests/v13_9_short_engagement.js`: weekly totals, high-quality run length, future festival judgment, press kit, encore cash/payout, old v13 saves and modeled TV households.
- `tests/v13_9_short_ten_year_balance.js`: two independent **10-year** league runs, verifying release completion, exact original short revenue totals, no payout duplication and save compatibility.
- `tests/v13_9_short_browser.py`: actual Chromium project monitor, Production Center, release details, festival actions, Filmography, browser reload, mobile dock and real screenshots.
- Previous v13.8 finance/monitor, v13.7 multi-save, v13.6 sitewide theme, v13.5 film, v13.4 awards and v13.1 balance suites.

The dedicated pipeline is `.github/workflows/v13_9_shorts.yml`.
