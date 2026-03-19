# Changelog 2026-03-17-43-audit-facets-and-indexes

## Summary
- Added dedicated audit facets endpoint for filter dropdown sources.
- Added DB indexes for `audit_logs` to improve server-side filtering/pagination performance.
- Updated admin/adapter flow to use backend facets instead of current-page-only values.

## Backend Changes
- `backend/src/db/repository.js`
  - Added `listAuditFacets()` returning distinct `actions` and `entities`.
- `backend/src/routes/auditLogs.js`
  - Added `GET /api/audit-logs/facets` (auth-protected).
- `backend/src/db/migrations/003_audit_logs_indexes.sql`
  - `idx_audit_logs_created_at_desc`
  - `idx_audit_logs_action`
  - `idx_audit_logs_entity_type`
  - `idx_audit_logs_entity_created_at`

## Frontend/Data Adapter Changes
- `data-adapter.js`
  - Added `getAuditFacets()`.
- `admin.js`
  - `loadAuditLogs()` now fetches both logs and facets via `Promise.all`.
  - `populateAuditFilterOptions()` now uses backend facets dataset.

## Verification
- Migration run:
  - `Migration applied: 003_audit_logs_indexes.sql`
- Smoke after server restart:
  - `facetsActions=1; facetsEntities=1; page=1; limit=2; total=5; items=2`
- Static checks: no errors in changed files.
