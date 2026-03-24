# Batch 469 - Bulk Status Validation and Audit Facet Guards

## What changed
- Hardened `normalizeAuditFilterOptionValues(values)` to accept only string entries from facets payload before normalization/dedup/sort.
- Added explicit guard path in `bulkUpdateContactStatus(fromStatus, toStatus)` for unsupported source/target statuses with structured `console.warn` context.
- Added explicit supported-status validation check (using `isSupportedContactRequestStatus`) in bulk transition path.
- Added no-op transition guard in `bulkUpdateContactStatus` (`fromStatus === toStatus`) to skip meaningless bulk updates safely.

## Why
- Prevents non-string facet payload values from being rendered as noisy/selectable audit filter options.
- Makes bulk status transition validation explicit and easier to trace during runtime diagnostics.
- Avoids unnecessary adapter calls for no-op bulk transitions.

## Validation
- Diagnostics check for `admin.js`: no errors found.
