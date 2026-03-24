# Batch 482 - Pending Filter Timer Cancellation Hardening

## What changed
- Added `cancelPendingAuditFiltersApply()` helper to clear/reset pending audit filter debounce timer.
- Added `cancelPendingContactsFiltersApply()` helper to clear/reset pending contacts filter debounce timer.
- Updated `scheduleAuditFiltersApply()` to use `cancelPendingAuditFiltersApply()`.
- Updated `scheduleContactsFiltersApply()` to use `cancelPendingContactsFiltersApply()`.
- Updated `changeAuditLimit()` to cancel pending audit filter applies before immediate limit-driven reload.
- Updated `clearAuditFilters()` to cancel pending audit filter applies before reset + reload sequence.
- Updated `changeContactsPage()` to cancel pending contacts filter applies before manual page navigation render.

## Why
- Prevents stale delayed filter applies from firing after user-triggered immediate actions.
- Reduces duplicate reload/render bursts during rapid interaction sequences.
- Keeps pagination and explicit filter-reset flows deterministic under debounce activity.

## Validation
- Diagnostics check for `admin.js`: no errors found.
