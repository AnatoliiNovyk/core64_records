# Batch 478 - Audit Date Range Order Guards for Load/Export

## What changed
- Added `hasValidAuditDateRangeOrder(dateFrom, dateTo)` helper for shared date-order validation (`from <= to` when both dates are present).
- Updated `validateAuditDateRange()` to use `hasValidAuditDateRangeOrder(...)` for the range-order check.
- Added defensive early guard in `loadAuditLogs()`:
  - aborts request setup when date range order is invalid,
  - clears loading state,
  - surfaces audit error message without sending adapter request.
- Added defensive early guard in `exportAuditCsv()`:
  - blocks CSV export request when date range order is invalid,
  - displays explicit user alert.

## Why
- Prevents `from > to` requests from reaching adapter calls via non-standard invocation paths.
- Keeps date-range order validation logic centralized and consistent across validate/load/export flows.
- Reduces unnecessary request churn and aligns behavior with existing defensive hardening strategy.

## Validation
- Diagnostics check for `admin.js`: no errors found.
