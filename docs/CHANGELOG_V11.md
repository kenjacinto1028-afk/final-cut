# Final Cut v11 — Variety, art and studio legacies

Release: 2026-11-20. Updates the v10 game in place, preserving separate modules.

## Gameplay
- Short films can choose **Home only**, **Regional screening circuit**, **International short circuit**, or previously configured regional markets after post-production. They pay bounded distribution costs, receive modest screening/licensing income and fame, and still **do not** receive feature-film theatrical gross.
- Releases show **audience** and **critics** scores and a contextual reception headline. Rival films can show equivalent summaries without storing duplicate prose for thousands of titles.
- Annual studio recap appears on the dashboard; rival hit streaks produce occasional Studio Wire headlines.
- A **Hit feature** can start a sequel from its film record, inheriting franchise identity and a modest awareness advantage. Repeated weak sequels have consequences. AI rivals can occasionally create sequels from their own hits.
- Sequel chains retain original film lineage and sequential installment numbers. Historical archive and rankings remain compatible with earlier saves.

## Film visuals
- Eight procedural poster compositions, with three quick selectable alternatives for owned films and stable seeded AI designs.
- Player-owned films accept custom JPG/PNG/WebP posters in a local crop dialog with zoom and position. Uploaded art is compressed to about 600×900 and stored in IndexedDB per save/campaign, not embedded in weekly saves. Choosing generated art replaces the uploaded asset; restore or remove at any time.
- Export/import **full backup JSON** includes optional artwork. Images never upload automatically; custom art is specific to the browser unless a backup is transferred.
- New original illustrated talent portraits and thematic film stills, rendered without external image APIs.
- Brief, reduced-motion-aware **interface-only** premiere, major festival/award and era animations, plus small ranking movement signals. No filmmaking/VFX budget mechanic.

## Compatibility
- New `poster-store.js` loads between `engine.js` and `media.js` in `index.html`.
- Save format bumped to 11; existing v10 and earlier supported saves migrate without inventing historical details. Posters are only portable through the new artwork-inclusive backup.
- Existing TV, films, rival archive, market, awards, festival and regional feature release rules preserved.

## Known limitations
- Browser origin must permit IndexedDB to retain custom posters. Local image storage is browser-specific; clear site data removes it. A complete export/import backup is recommended before changing devices.
- Annual reviews and audience reception aren't retroactively invented for old completed films.
- Long-run studio finances and late-game fame remain uneven by strategy; see `TEST_REPORT_V11.md`.
