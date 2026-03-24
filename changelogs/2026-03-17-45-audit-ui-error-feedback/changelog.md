# Changelog 2026-03-17-45-audit-ui-error-feedback

Improved audit UI error feedback to match new strict backend query validation.
Added client-side date-range sanity check before sending audit requests.

`admin.js`

Added helper `handleAuditLoadError(error, fallbackMessage)`:

- logs error
- shows contextual API status message to admin (`Помилка аудиту: ...`)

Added helper `validateAuditDateRange()`:

- blocks request when `from > to`
- shows clear status message in UI

Applied new error handling flow to:

- manual refresh
- limit change
- clear filters reload
- filter reload
- pagination reload

Static checks: no errors in `admin.js`.
API smoke: `okPage=1; okTotal=5; okItems=2`.
