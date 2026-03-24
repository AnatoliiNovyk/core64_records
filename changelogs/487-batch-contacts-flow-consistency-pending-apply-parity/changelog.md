# 487 Batch - Contacts flow consistency pending-apply parity

## What changed

- Added `cancelPendingContactsFiltersApply()` in `changeContactStatus(id, status)` before explicit single-status update flow.
- Added `cancelPendingContactsFiltersApply()` in `bulkUpdateContactStatus(fromStatus, toStatus)` before explicit bulk-status update flow.

## Why

- Aligns contacts explicit status actions with debounce-cancel parity already used in pagination/filter actions.
- Prevents delayed filter-apply callbacks from overlapping with explicit async status update operations.
- Improves deterministic contacts rendering/page-state behavior during rapid interactions.

## Validation

- Diagnostics check across workspace: no errors found.
