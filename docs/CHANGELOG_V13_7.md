# Final Cut v13.7 — Multiple saved studios

## New save library
Open **Saved Games** from the sidebar, or **Manage saved games** from the title screen.

- **Autosave**: the active studio continues autosaving after game actions and at each week, using the existing `backlot_save` data and save format v13.
- **New campaign**: creating a new game safely archives the old active studio rather than overwriting it.
- **Save now**: explicitly save the current studio whenever you want.
- **Load**: switch between existing campaigns; the one you are leaving is archived first.
- **Rename / Delete**: manage slots with confirmation for destructive deletion.
- **Make a copy**: clone an active campaign into a fully independent slot. It receives a unique campaign ID and copies custom poster blobs, avoiding shared artwork.
- **Import backup as new save**: an exported `finalcut-v11/v12/v13-backup` is restored into a separate campaign slot with its posters, instead of replacing the active campaign.
- **Return to title**: no longer deletes the current save. Use New Studio to start another independent game.
- **Backup export**: remains available; it exports the currently loaded campaign and associated custom posters.

## Storage and compatibility
- **Current campaign**: original `localStorage['backlot_save']` data, unchanged.
- **Inactive campaigns**: IndexedDB database `finalcut-save-library`, `snapshots` object store.
- **Save metadata**: small localStorage index `finalcut-save-index-v1`; includes active slot and names, dates, studios.
- **Custom posters**: existing `finalcut-custom-posters` IndexedDB and `campaignId:player:projectId` namespace. Duplicate saves copy the blobs to their new campaign namespace.
- **Legacy save migration**: an existing single `backlot_save` automatically appears as the first named slot without rewriting its payload.
- **Game save schema** remains v13. Older single-save code can still read the current active `backlot_save`.
- Slots and custom artwork are local to the current browser/profile/device. Export backups for device transfers and browser-data protection. Clearing site data deletes local saves; incognito sessions are ephemeral.
- Inactive slots use IndexedDB to avoid copying several long histories into localStorage's smaller quota. Active games remain subject to the existing browser quota.
- On a failed archive/load (for example, storage unavailable, missing, damaged or full), changing slots is cancelled and the active game remains untouched.

## Validation
- Existing v13 gameplay, compact-save compatibility, v13.4 honors, v13.5 Production Center and economy balance tests.
- New `tests/v13_7_multi_save_browser.py` runs on a real localhost origin and Chromium IndexedDB and covers legacy import, simultaneous studios, duplication, custom poster isolation, switch/reload, backup import, deletion, title flow and 390px mobile.
- GitHub Actions `.github/workflows/multi-saves.yml` gates the release, including browser screenshots.
