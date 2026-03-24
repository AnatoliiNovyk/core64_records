# Batch 474 - Audit Filter Control Normalization and Handler Unification

Added `normalizeAuditFilterControlValue(filterEl, fallback)` to canonicalize and sync `audit-filter-action` / `audit-filter-entity` control values.
Added `getNormalizedAuditFilters()` to centralize normalized audit filter retrieval:

- `searchRaw` and normalized `query`,
- canonical `actionFilter` / `entityFilter`,
- canonical `dateFrom` / `dateTo` with control value sync.

Updated `saveAuditUiState()` to consume centralized normalized audit filters for state persistence.
Updated `loadAuditLogs()` to consume centralized normalized audit filters and canonical limit control normalization.
Updated `exportAuditCsv()` to consume centralized normalized audit filters.
Added `handleAuditFilterChange()` to normalize audit controls before running page reset/render flow.
Updated `admin.html` audit action/entity filter `onchange` handlers to `handleAuditFilterChange()`.

Eliminates drift between audit filter controls and values used for request payloads/state persistence.
Keeps action/entity/date filters canonical across load/export/state paths.
Makes filter-change behavior consistent with existing hardening pattern used in contacts flow.

Diagnostics check for `admin.js`: no errors found.
Diagnostics check for `admin.html`: no errors found.
