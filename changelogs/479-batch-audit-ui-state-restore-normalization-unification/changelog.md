# Batch 479 - Audit UI State Restore Normalization Unification

Updated `loadAuditUiState()` to restore raw persisted values first and then normalize/sync controls through centralized helpers.
In `loadAuditUiState()`:

- `action/entity/dateFrom/dateTo` are restored as raw persisted strings with safe fallbacks,
- `limit` is normalized and synced through `normalizeAuditLimitControlValue(...)`,
- `refreshInterval` is normalized and synced through `normalizeAuditRefreshControlValue(...)`,
- `getNormalizedAuditFilters()` is called to canonicalize/sync `search/action/entity/date` controls consistently.

Updated `populateAuditFilterOptions()` to use control-level normalization helpers for selected values:

- `selectedAction` now uses `normalizeAuditFilterControlValue(actionEl, "all")`,
- `selectedEntity` now uses `normalizeAuditFilterControlValue(entityEl, "all")`.

Ensures audit UI state restore follows the same centralized normalization pipeline as runtime filter extraction.
Reduces divergence between persisted values and actual control values after restore.
Keeps selected action/entity values canonical before options repopulation logic.

Diagnostics check for `admin.js`: no errors found.
