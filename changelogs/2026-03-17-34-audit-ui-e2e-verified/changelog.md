# Changelog 2026-03-17-34-audit-ui-e2e-verified

Started backend and executed end-to-end audit flow validation for the latest admin audit UI functionality.
Created a contact request, updated its status to `done`, then verified a matching `status_updated` entry in audit logs.

`createdId=8; auditFound=True; actor=admin; status=done`

During initial check, smoke script used an outdated response parser (`data.items`).
Current audit endpoint returns rows in `data` (array), which matches current adapter/admin UI behavior.
