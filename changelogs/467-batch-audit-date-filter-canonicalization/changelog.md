# Batch 467 - Audit Date Filter Canonicalization

## What changed
- Canonicalized audit date filter persistence in `saveAuditUiState`:
  - `dateFrom` now uses `normalizeIsoDateFilter(...)`.
  - `dateTo` now uses `normalizeIsoDateFilter(...)`.
- Canonicalized audit date filter restoration in `loadAuditUiState`:
  - restored `dateFrom` now passes through `normalizeIsoDateFilter(...)`.
  - restored `dateTo` now passes through `normalizeIsoDateFilter(...)`.
- Canonicalized `from/to` payload values sent from `loadAuditLogs`.
- Canonicalized `from/to` payload values sent from `exportAuditCsv`.

## Why
- Ensures one consistent ISO-date format for audit date filters across state storage, UI restore, and API request payloads.
- Prevents malformed or noisy values from leaking into audit filtering behavior.
- Aligns date filtering behavior with existing normalization strategy used in the rest of admin hardening.

## Validation
- Diagnostics check for `admin.js`: no errors found.
