# Changelog 2026-03-17-49-audit-loading-indicator

## Summary
- Added visible loading indicator for audit section while API requests are in flight.

## Changed Files
- `admin.html`
- `admin.js`

## Details
- Added new UI element:
  - `#audit-loading` with message `Завантаження журналу аудиту...`
- Added helper in logic:
  - `setAuditLoading(isLoading)`
- Integrated loading state in `loadAuditLogs()`:
  - show on request start
  - hide on successful completion
  - hide on error for current request sequence
- Compatible with stale-response guard (`auditRequestSeq`).

## Validation
- Static checks: no errors in updated files.
- API smoke: `okPage=1; okTotal=5; okItems=1`.
