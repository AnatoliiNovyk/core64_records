# Changelog 2026-03-17-47-audit-search-debounce

## Summary
- Added debounce for audit search input to reduce API request frequency during typing.

## Changed Files
- `admin.js`
- `admin.html`

## Details
- Added `auditSearchDebounceTimer` state.
- Added `handleAuditSearchInput()` with `300ms` debounce.
- Updated audit search field handler:
  - from `resetAuditPageAndRender()` on every keystroke
  - to debounced `handleAuditSearchInput()`

## Validation
- Static checks: no errors in updated files.
- API smoke: `page=1; total=5; items=2` for query `q=status`.
