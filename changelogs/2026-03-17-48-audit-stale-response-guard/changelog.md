# Changelog 2026-03-17-48-audit-stale-response-guard

## Summary
- Added protection against stale audit API responses overriding newer UI state.

## Changed Files
- `admin.js`

## Details
- Introduced request sequencing state:
  - `auditRequestSeq`
- `loadAuditLogs()` now:
  - assigns sequence number per request
  - ignores outdated success responses when newer request exists
  - ignores outdated errors when newer request exists
- This mitigates race conditions during rapid filter/search/pagination changes.

## Validation
- Static checks: no errors in `admin.js`.
- API smoke with different queries:
  - `A_total=5; B_total=5; A_items=2; B_items=2`
