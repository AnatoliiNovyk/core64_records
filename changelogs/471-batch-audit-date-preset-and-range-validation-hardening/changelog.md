# Batch 471 - Audit Date Preset and Range Validation Hardening

Added `normalizeAuditDatePreset(value, fallback)` and preset allowlist constant to canonicalize audit preset values (`all`, `today`, `24h`, `7d`, `custom`).
Applied date preset normalization in audit UI state persistence (`saveAuditUiState`).
Applied date preset normalization in audit UI state restore (`loadAuditUiState`).
Strengthened `validateAuditDateRange()`:

- validates raw `from/to` format via `normalizeIsoDateFilter`,
- returns explicit audit error messages for invalid `from` or `to`,
- normalizes date input values back into controls,
- keeps existing range order check (`from <= to`).

Hardened `applyAuditDatePreset()` to normalize preset input and normalize resulting `from/to` date values before request flow.
Hardened `onAuditDateInputChange()` to normalize date input controls and canonicalize preset switch to `custom`.

Ensures preset values and date filters stay canonical across UI interactions and persisted state.
Prevents malformed date input strings from leaking into audit filtering flow.
Keeps audit filter behavior predictable during rapid preset/manual date changes.

Diagnostics check for `admin.js`: no errors found.
