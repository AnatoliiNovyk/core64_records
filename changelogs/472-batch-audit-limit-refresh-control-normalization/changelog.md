# Batch 472 - Audit Limit/Refresh Control Normalization

Added `normalizeAuditLimitControlValue(limitEl)` helper:

- normalizes limit value using `normalizeAuditLimit(...)`,
- syncs normalized value back into the `audit-limit` control,
- returns canonical numeric limit.

Added `normalizeAuditRefreshControlValue(refreshEl)` helper:

- normalizes interval value using `normalizeAuditRefreshSeconds(...)`,
- syncs normalized value back into the `audit-refresh-interval` control,
- returns canonical refresh seconds.

Updated `saveAuditUiState()` to reuse the new control normalization helpers for `limit` and `refreshInterval`.
Updated `getAuditRefreshSeconds()` to read interval via `normalizeAuditRefreshControlValue(...)`.
Updated `changeAuditLimit()` to normalize via the new helper.
Updated `changeAuditRefreshInterval()` to:

- normalize refresh control value,
- persist updated UI state before auto-refresh reconfiguration.

Updated `renderAuditLogs()` to compute effective limit through `normalizeAuditLimitControlValue(...)`.

Keeps runtime control values canonical and synchronized with UI fields.
Prevents drift between displayed control values, persisted UI state, and runtime logic.
Improves consistency when users or restored state provide out-of-range/non-canonical numeric values.

Diagnostics check for `admin.js`: no errors found.
