# 2026-04-19-02 — Improved "record not found" error message in admin

## Previous state
When saving a release (or any collection item) that no longer existed in the database — for example after a DB cutover where the old record was lost — the admin showed a generic and confusing error:

> "Failed to save record: Item not found"

This came from the API returning 404 `COLLECTION_ITEM_NOT_FOUND`, which was passed through as raw `details` into `saveRecordFailedDetails`. The same cryptic message also appeared for `RELEASE_NOT_FOUND` and `RELEASE_TRACK_NOT_FOUND` codes. There was no hint about what the user should do.

## What was changed
- **`admin.js`** — Added a new `saveRecordNotFound` key to both `uk` and `en` sections of `ADMIN_I18N`:
  - UK: `"Запис не знайдено в базі даних. Можливо, він був видалений — оновіть сторінку і спробуйте ще раз."`
  - EN: `"Record not found in database. It may have been deleted — refresh the page and try again."`
- **`admin.js`** — Added an explicit check in `resolveCrudSaveErrorMessage` for API 404 responses with codes `COLLECTION_ITEM_NOT_FOUND`, `RELEASE_NOT_FOUND`, or `RELEASE_TRACK_NOT_FOUND`, returning the new `saveRecordNotFound` message instead of the raw `saveRecordFailedDetails` fallback.

## Resulting improvement
The admin now shows a clear, actionable message when a record is missing from the database (e.g. after a DB cutover or external deletion). The user is directed to refresh the page, which reloads the cache from the current DB state and allows them to act on the real data.
