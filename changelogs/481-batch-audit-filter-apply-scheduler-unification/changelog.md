# Batch 481 - Audit Filter Apply Scheduler Unification

Added `scheduleAuditFiltersApply(delayMs = 0)` helper to centralize audit filter apply flow:

- clears pending audit debounce timer,
- captures section/navigation guard context,
- validates audit section connectivity before apply,
- normalizes filters via `getNormalizedAuditFilters()`,
- runs `resetAuditPageAndRender()`.

Updated `handleAuditSearchInput()` to use scheduler with debounce (`300ms`) instead of inline timeout logic.
Updated `handleAuditFilterChange()` to use scheduler for immediate apply (`0ms`).
Updated `applyAuditDatePreset()` final apply step to use scheduler (immediate) after preset/date normalization.
Updated `onAuditDateInputChange()` final apply step to use scheduler (immediate) after date normalization.

Removes duplicated debounce/apply logic in audit filter handlers.
Keeps stale navigation/section guard behavior consistent in one place.
Makes immediate and debounced audit filter applications deterministic and easier to maintain.

Diagnostics check for `admin.js`: no errors found.
