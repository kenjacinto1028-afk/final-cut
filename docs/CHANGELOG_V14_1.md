# FinalCut v14.1 — Studio Balance and Mobile Responsiveness

Released to the correct `kenjacinto1028-afk/final-cut` repository via PR #7 on November 21, 2026. Gameplay remains compatible with save format **v13**.

## What changed

- **High-budget film economics:** Reduced the extreme returns of tentpoles by changing premium budget scaling from 0.89 to 0.86 and applying a bounded diminishing audience-attention factor above a $350,000 budget. Low-budget indies avoid the premium-budget adjustment.
- **Film risk and portfolio crowding:** Moderately wider lower-tail box-office variation; repeat releases in the same genre within 26 weeks compete for audiences. Films at the reference budget or higher also compete with their own recent studio slate, with the additional all-genre penalty capped at **8%**.
- **Rival quality:** Rivals benefit more from genuinely hired director/writer/actor/crew skill. A bounded additional studio-craft uplift (maximum 6 points) depends on earned production tier, released-film history and actual industry-leader standing. No fictitious AI award or cash is generated.
- **Scarcer major awards:** Increased elite winner-quality thresholds by only 2–3 points. Awards categories, festival slots, eligibility parity and lifetime historical trophies are preserved. No blanket lock prevents an excellent film from winning multiple ceremonies.
- **Long-career mobile autosaves:** Browser campaigns with 1,600+ archived rival films or 340+ player films compress weekly autosaves in a dedicated `save-worker.js`, coalesced after 350ms. Only one snapshot encodes at once. Stale worker completions cannot overwrite later manual saves or switched campaigns; queued/in-progress autosaves are synchronously flushed when the tab is hidden. Explicit saves, imports, save-slot switching and `Engine.save()` remain synchronous. Existing lossless FCP2/FCP1/plain-JSON loading stays intact.

## Verified balance outcomes

Final release gate: <https://github.com/kenjacinto1028-afk/final-cut/actions/runs/44866770309>

Twelve independent standard-start, full **61-year** synthetic careers in North America, Europe and Asia-Pacific. Mean per strategy:

| Strategy | Cash at career end | Feature flops | Major award wins | Film quality |
|---|---:|---:|---:|---:|
| Prestige | $222.8m | 69 | 80 | 89 |
| Blockbuster | $745.3m | 99 | 68 | 91 |
| Cheap genre | $29.8m | 72 | 6 | 73 |
| Careful | $221.9m | 5 | 80 | 91 |

Rival average quality ranged around 69–71. All twelve scenario saves passed the 5 MiB simulated active-save quota and reload; 11–15 rivals survived each simulated career. These are sampled synthetic game strategies, not a guarantee of outcomes for a human player. The blockbuster strategy retains greater potential profits and a higher flop count; careful studios remain safer. Sampled award wins were reduced relative to earlier v14 high-output runs.

**Rejected tuning:** An earlier rival-craft bonus of 12 and 20% slate penalty inverted balance (blockbuster only $16m mean cash). These values were explicitly reverted to a **6-point cap and an 8% slate cap** before merge.

## Browser/mobile acceptance

Playwright Chromium at 390px mobile viewport: a synthetic archive of 1,750 films saved/reloaded; a weekly turn returned in approximately 1.9ms before background compression, keeping the main thread responsive; later synchronous manual saves could not be overwritten by stale worker output; mobile navigation, original save slots, short-film life cycle and v14 film-creation UI also passed. **This is emulated mobile Chromium on Linux, not measured on a physical phone.** Manual/quit saves remain synchronous and can still take noticeable time for exceptionally long histories.

## Compatibility and tests

PR #7 passed the `v14.1` balance/mobile gate, original v14 integration, and v13.5–v13.9 save, economic, story, UI, honors and short-film checks. Reproduction: `node tests/v14_1_balance.js`, `node tests/v14_1_balance_matrix.js`, `python tests/v14_1_mobile_browser.py`, plus existing v14 and legacy tests. The project `TASK_STATE.md` tracks remaining physical-device verification.
