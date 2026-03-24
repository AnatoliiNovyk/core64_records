# Batch 466 - Audit Action/Entity Filter Normalization

Added `normalizeAuditFilterSelectValue` helper to canonicalize audit select values (`action`/`entity`) with trim + safe fallback.
Added `normalizeAuditFilterOptionValues` helper to normalize facet option arrays, drop empty values, skip reserved `all`, deduplicate, and sort.
Applied normalized `action`/`entity` values when saving audit UI state in `saveAuditUiState`.
Applied normalized `action`/`entity` values when restoring audit UI state in `loadAuditUiState`.
Applied normalized `action`/`entity` values in audit logs request construction in `loadAuditLogs`.
Applied normalized `action`/`entity` values in CSV export request construction in `exportAuditCsv`.
Updated `populateAuditFilterOptions` to use normalized selected values and normalized facets option lists.

Ensures consistent filter values across state persistence, select rendering, and API request payloads.
Prevents whitespace/noise values from leaking into audit filtering logic.
Reduces divergence between selected UI values and available facet options.

Diagnostics check for `admin.js`: no errors found.
