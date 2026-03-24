# Changelog 2026-03-17-36-audit-endpoint-contract-unified

Unified backend audit endpoint response contract.
Updated `GET /api/audit-logs` to return:

- `data.items` (array of audit records)
- `data.limit` (effective limit used)

`backend/src/routes/auditLogs.js`

`tokenOk=True; hasItems=True; itemsCount=3; limit=3`
