# Changelog 2026-03-17-42-audit-server-side-filters-pagination

Implemented server-side filtering and pagination for audit logs.
Updated frontend adapter/admin flow to request audit pages from API with current filters.
Updated audit CSV export to fetch filtered rows from API (up to 500 records) instead of exporting only local page state.

`backend/src/db/repository.js`

- `listAuditLogs()` now supports:
- `q`
- `action`
- `entity`
- `from`
- `to`
- `page`
- `limit`
- Added total count query for pagination metadata.

`backend/src/routes/auditLogs.js`

- Route parses query params and returns:
- `data.items`
- `data.total`
- `data.page`
- `data.limit`

`data-adapter.js`

- `getAuditLogs(params)` now builds query string and returns metadata payload from API.

`admin.js`

- `loadAuditLogs()` sends current filter/query/date/page state to API.
- Audit pagination now uses server `total` + current `limit`.
- Filter/page changes trigger server reload.
- `clearAuditFilters()` reloads from API after reset.
- `exportAuditCsv()` fetches filtered dataset from API before export.

Smoke after server restart:

- `p1=2; p2=2; total=5; page1=1; page2=2; filtered=5`

Static analysis: no errors in changed files.
