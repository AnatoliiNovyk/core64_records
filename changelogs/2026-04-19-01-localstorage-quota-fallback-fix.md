# 2026-04-19-01 — Fix localStorage quota exceeded in API offline fallback

## Previous state

When the API was temporarily unreachable (e.g. cold start after Cloud Run deploy), `data-adapter.js` switched to local mode and attempted to save the full dataset — including base64-encoded audio tracks — to `localStorage`. If the release contained an audio track (e.g. a 5:56 mp3 file ~20 MB encoded), the browser threw a native `DOMException: QuotaExceededError` (code 22). This error was **not caught** by `saveLocalData`, propagated unhandled, and the `isDatabaseStorageLimitError` guard in `admin.js` did not recognise it (it only matched `status === 507` or `code === "DB_STORAGE_LIMIT_REACHED"`). The raw browser message was shown to the user: *"Не вдалося зберегти запис: Failed to execute 'setItem' on 'Storage': Setting the value of 'core64_data' exceeded the quota."*

## What was changed

- **`data-adapter.js`** — `saveLocalData` now wraps `localStorage.setItem` in a `try/catch`. On `QuotaExceededError` (detected by `e.name`, `e.code === 22`, or `/quota/i` match on message) it rethrows a normalised error with `code = "LOCAL_STORAGE_QUOTA_EXCEEDED"` and `status = 507`.
- **`admin.js`** — `isDatabaseStorageLimitError` extended: now matches `code === "LOCAL_STORAGE_QUOTA_EXCEEDED"` and any error message containing "quota" (case-insensitive), in addition to existing `DB_STORAGE_LIMIT_REACHED` / `status === 507` checks.
- **`admin.js`** — i18n `saveRecordStorageLimit` updated for both `uk` and `en`:
  - 🇺🇦 *"Не вдалося зберегти запис: API недоступний і браузерне сховище переповнене. Оновіть сторінку — дані завантажаться з сервера."*
  - 🇬🇧 *"Unable to save record: the API is unreachable and browser storage is full. Refresh the page to reload data from the server."*

## Result

When the API probe times out and the local fallback fails due to browser quota, the user sees a clear, actionable message explaining the cause and the recovery step (page refresh). The raw browser exception is no longer shown. The fix was merged as PR #5 and deployed to Cloud Run.
