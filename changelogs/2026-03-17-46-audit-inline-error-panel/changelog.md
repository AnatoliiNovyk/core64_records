# Changelog 2026-03-17-46-audit-inline-error-panel

## Summary
- Added dedicated inline error panel for audit section.
- Moved audit-specific error feedback from global API banner to local audit UI.

## Changed Files
- `admin.html`
- `admin.js`

## Details
- New UI element in audit section:
  - `#audit-error` (hidden by default)
- Added helpers in admin logic:
  - `showAuditError(message)`
  - `hideAuditError()`
- Updated audit error flow:
  - `handleAuditLoadError()` now uses inline panel
  - `validateAuditDateRange()` shows inline error and clears it on valid state
  - `loadAuditLogs()` clears inline error after successful load

## Validation
- Static checks: no errors in updated files.
- Smoke:
  - `badStatus=400` for invalid date format request
  - `okPage=1; okItems=1` for valid request
