# Changelog 2026-03-17-35-audit-adapter-response-normalization

## Summary
- Updated `data-adapter.js` to normalize audit log response shape from API.
- Adapter now supports both payload variants:
  - `data` as array
  - `data.items` as array

## Why
- Prevents admin audit UI regressions when backend/tests use different but compatible response wrappers.

## Verification
- API check passed:
  - `tokenOk=True`
  - `rawDataType=Object[]`
  - `rowCount=3`
