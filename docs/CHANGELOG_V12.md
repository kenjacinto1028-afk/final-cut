# Final Cut v12 — Release Notes

## Scope and source
This is the complete v12 release (A–F), built on the released v11 source. This changelog supersedes the A–E prerelease notice. All substantive game files remain separate: `content.js`, `engine.js`, `ui.js`, `style.css`, `media.js`, `poster-store.js`, `sim.js`.

### Batch A — Talent recognition and independent craft
- All named talent has skill and fame as separate attributes. Skill improves craft quality; fame improves market reach, opening hype, and fee expectations.
- Recognition tiers: Local (0–19), Regional (20–39), National (40–59), International (60–79), Global (80–100); talent's home region affects reach, but tiers never gate casting.
- Casting choices display quality and hype separately. Existing talent recruitment and contract rules still apply.

### Batch B — Career development and production attribution
- Creative careers grow, plateau, decline and occasionally rebound without tying fame to skill.
- Department employees improve collectively. Films track the credited talent's attributes at production and quality/hype breakdowns.
- Four additional tradeoff-driven production dilemmas.

### Batch C — Smarter rivals, reviews, franchise reception
- Rival studios have distinctive preferred genres, learn from recent successes and produce context-aware news.
- Reviews explain performance where supporting evidence is recorded; sequels face audience expectations and fatigue.
- Annual award nomination threshold increased modestly.

### Batch D — TV, reputation, and finances
- TV renewals now consider ratings momentum and financial margin, with slightly reduced multi-season fatigue.
- Fees distinguish craft and star visibility; studio fame growth slows as recognition approaches 100.
- Production cost attribution and finance explanations improved.

### Batch E — User experience
- Better talent, film archive, casting and finance views, more helpful onboarding and mobile readability.
- Custom-poster backup/import handling is more reliable; no new graphics are required for gameplay.

### Batch F — Integrated new features and tuning
- **Sequel cast continuity:** Available principal performers, writers and directors are suggested when making a sequel; returning artists help hype. Recasting a major original star reduces familiarity but the replacement's creative skill still counts normally. Original ID links are preserved.
- **Scalable production teams:** Larger feature budgets unlock optional supporting performers and specialist crew plus a modest background-crew package; actual additional costs and diminishing creative returns. No fame/tier gate on individual artist eligibility.
- **Full career profiles only for directors and writers:** verified player/rival filmographies, recognition tier, creative history, career milestones and recorded incidents. Performers retain their existing compact profile; other staff remain pooled.
- **Awards restricted to actors, directors, writers:** new Best Supporting Performance personal category; proper recipient-by-person nominations/wins. Best Picture and other film-only awards remain on the film/studio, not every employee. No new technical crew awards.
- **Balance tuning:** fewer late-stage studio fame gains, restrained annual prestige awards, modestly reduced festival prestige, and additional production/delays/cost testing. Bankruptcy remains possible.
- **Large-save protection:** browser saves compact repeated JSON object keys losslessly after an archive grows. Old v8–v11 plain-JSON saves still migrate; backup export remains human-readable. Added region-specific deterministic simulation/quotas and browser UI checks.

## Save compatibility
Uses game save version 12. Existing v11 games are migrated while preserving prior credits and financial results. Historical facts absent from older saves are not invented. Generated posters remain local; uploaded custom artwork continues to use IndexedDB with backup transfer support.

## Not included
- Full actor/actress or technical-crew career biography pages.
- Cinematography, editing, score, or other new technical awards.
- New standalone employee management systems or live image-generation dependencies.
