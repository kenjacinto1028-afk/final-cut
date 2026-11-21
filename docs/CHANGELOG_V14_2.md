# FinalCut v14.2 — Mobile & Save Reliability Polish

Merged to `kenjacinto1028-afk/final-cut/main` via PR #8 on November 21, 2026 (merge commit `9d175561`).

Release scope: speed up long-campaign saves and improve smaller phones **without** changing film quality, studio economics, awards or save compatibility.

## Changes

- **Manual Save Now:** Large campaigns no longer synchronously run FCP2 encoding when the user presses Save Now. The save is encoded in the same already-deployed `save-worker.js`; the UI shows “Saving campaign…” and confirms success only when storage reports success.
- **Safe Return to Title:** Waits for the active campaign to finish saving before closing it. If quota is exhausted, the game stays open and displays an error.
- **Save library:** Before switching campaigns or creating a fresh studio, the active archive is flushed asynchronously; snapshot copy and imported backup encoding also run off the UI thread. Rollback now references the **freshly saved active campaign**, not an older snapshot. Distinct campaign IDs and custom-poster namespaces remain intact.
- **No concurrent huge compression:** An explicit save invalidates/terminates an obsolete weekly worker job before encoding, preventing competing multi-megabyte Worker tasks on memory-constrained devices. A stale in-flight save cannot overwrite later actions or save-slot changes.
- **Title-screen responsiveness:** A fingerprint-based, same-tab cache for verified FCP2 save metadata avoids decompressing a large archive immediately after returning to title. Unknown or replaced saves are still parsed and repaired. Initial page reload may still need index reconciliation.
- **Mobile accessibility:** 320px/390px layouts, at least 44px tap targets for key save/navigation controls, wrapping, safe-area padding, reduced-motion handling and `role=status` / `aria-live=polite` for save outcomes.
- **Backward compatibility:** `Engine.save()` and `SaveSlots.manualSave()` remain synchronous for existing consumers. No Worker? Fall back to the old lossless codec. FCP2, FCP1 and older JSON saves load normally. Storage stays in the existing device/browser—no cloud sync.

## Verification

- New acceptance: `node tests/v14_2_async_save.js` and `python tests/v14_2_mobile_browser.py`. CI workflow `.github/workflows/v14_2.yml`.
- Playwright on Chromium mobile emulation passed 320px and 390px layouts, reduced-motion preference, 1,750-film archive, explicit save latency, independent save copy, Return to Title, stale generation ordering, storage quota refusal and reload. The measured **11.7ms** is the time for the UI to yield to a background save, **not** the full time to finish writing the save. Test save payload was about **3.54 million characters**, with reported title metadata lookup about **0.5ms**.
- v14.1 mobile autosave, v13.7 multi-slot/poster workflows and v14 cinematic UI checks also passed. Existing v13/v14 QA runs on the pull request.

## Remaining limitations

- An actual iPhone or Android device is still necessary for real-world hardware, thermal throttling, memory and quota testing.
- Other synchronous engine `save()` calls (e.g. some gameplay choices), first-load decompression, and some backup JSON parsing can still pause a slower device during extreme multi-decade campaigns.
- User-provided images in IndexedDB and all saved games are **local to that browser**, not synced to another phone automatically.
