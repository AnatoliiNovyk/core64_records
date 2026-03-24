# Batch 475 - Audit Search Control Normalization

## What changed
- Added `normalizeAuditSearchControlValue(searchEl)` helper to canonicalize and sync audit search control value using Unicode `NFKC` normalization.
- Updated `getNormalizedAuditFilters()` to read `searchRaw` via `normalizeAuditSearchControlValue(...)`.
- Updated `loadAuditUiState()` to restore search value safely and immediately normalize/sync it through the new helper.
- Updated `handleAuditSearchInput()` to normalize search control value before debounce flow execution.

## Why
- Keeps audit search control value canonical across state restore, filter extraction, and input handling.
- Reduces risk of inconsistent matching caused by visually similar Unicode input variants.
- Preserves existing behavior while improving control/value consistency.

## Validation
- Diagnostics check for `admin.js`: no errors found.
