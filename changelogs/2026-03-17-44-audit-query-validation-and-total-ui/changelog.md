# Changelog 2026-03-17-44-audit-query-validation-and-total-ui

## Summary
- Added strict validation for audit query parameters on backend.
- Added visible total counter for audit results in admin UI.

## Backend Changes
- `backend/src/routes/auditLogs.js`
  - Added validation for:
    - `limit`, `page` numeric sanity
    - `q` max length (120)
    - `action`, `entity` token format
    - `from`, `to` date format (`YYYY-MM-DD`)
    - date range consistency (`from <= to`)
  - Invalid params now return `400` with clear error messages.

## Frontend Changes
- `admin.js`
  - Audit pagination summary now shows total count.
  - Added `audit-total-count` status update from server `total`.
- `admin.html`
  - Added `audit-total-count` placeholder in audit status panel.

## Verification
- Valid query smoke:
  - `okPage=1; okTotal=5`
- Invalid query smoke:
  - `badStatus=400`
  - `badBody={"error":"Invalid 'from' date format. Use YYYY-MM-DD"}`
- Static checks: no errors in changed files.
