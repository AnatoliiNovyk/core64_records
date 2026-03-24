# Batch 484 - Audit Explicit Actions Cancel Pending Debounce

## What changed

Updated `refreshAuditNow()` to call `cancelPendingAuditFiltersApply()` before explicit manual refresh execution.
Updated `forceRefreshAuditNow()` to call `cancelPendingAuditFiltersApply()` before explicit force-refresh execution.
Updated `resetAuditPageAndRender()` to call `cancelPendingAuditFiltersApply()` before page reset + load flow.
Updated `changeAuditPage(delta)` to call `cancelPendingAuditFiltersApply()` before pagination-triggered load flow.

## Why

Prevents stale delayed filter-apply callbacks from firing after explicit user-triggered audit actions.
Reduces overlapping reload sequences under rapid mixed interactions (typing + manual refresh/pagination).
Keeps explicit actions deterministic and aligned with latest user intent.

## Validation

Diagnostics check for `admin.js`: no errors found.
