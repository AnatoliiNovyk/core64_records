# 486 Batch - Audit flow consistency pending-apply parity

## What changed

- Added `cancelPendingAuditFiltersApply()` in `changeAuditRefreshInterval()` before applying refresh-interval mode changes.
- Added `cancelPendingAuditFiltersApply()` in `handleAuditVisibilityChange()` (visible-tab path) before immediate audit refresh setup/load.

## Why

- Aligns explicit/immediate audit actions with existing debounce-cancel safety pattern.
- Prevents delayed filter apply callbacks from overlapping with immediate visibility/refresh-interval actions.
- Keeps audit flow deterministic under rapid interactions and tab visibility transitions.

## Validation

- Diagnostics check across workspace: no errors found.
