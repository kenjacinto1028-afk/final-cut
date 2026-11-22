# FinalCut v14.9b — Custom poster reload and missing-storage clarity

## Fixed
Custom poster images already live in the browser's IndexedDB, independent of the originally uploaded PC file. The first screen load was asynchronous, but the Production Center, Film Hub and other main views did not update when IndexedDB returned the saved poster. This could leave a permanent **“Custom poster loading…”** box, even when the image was safely stored.

- Loaded posters now replace visible loading boxes immediately, without rebuilding the whole screen or disturbing active forms.
- Empty and unreadable browser storage are shown as **Custom poster unavailable** or **Poster storage unavailable**, instead of pretending to load forever.
- Users can restore genuinely missing artwork through the Film Hub upload or an exported game backup that includes posters.
- Poster data remains in browser IndexedDB. The original on-disk file can safely be deleted after the upload/crop completes. The original FinalCut save format and all game rules are unchanged.

## Testing
`tests/v14_9b_poster_browser.py` uses Playwright Chromium to open a new studio, create *The Apprentice*, upload a real PNG, crop/save it, delete the source file from the test computer, reload the browser and verify the poster renders again. It then removes the image from IndexedDB deliberately and checks the distinct missing-artwork warning, restores it by reuploading and verifies a 390px phone layout.

The dedicated `.github/workflows/v14_9b.yml` also runs the pre-existing Film Hub custom-poster assertions and campaign save-slot artwork regression. Broader v13/v14 compatibility and mobile suites run on the pull request.

## Important
Browser-local artwork is still tied to **that browser's website storage**, not to GitHub or the save file alone. Clearing site data, changing browser/profile/device or private browsing can remove access. Export **Save + posters** to protect custom artwork before clearing browser data.
