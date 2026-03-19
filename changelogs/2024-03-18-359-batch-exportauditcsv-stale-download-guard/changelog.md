# 359 batch exportAuditCsv stale download guard

Batch fixes in admin.js (exportAuditCsv async success path):

1) Added early context guard at start of `.then(...)`
- Verify section unchanged (`sectionAtExport`), current section is `audit`, and audit section is connected before processing response.

2) Added strict body connectivity requirement before triggering file download
- If `document.body` is unavailable/disconnected, revoke object URL and exit without `link.click()`.

3) Simplified duplicate re-checks later in success path
- Reused early validated context and kept catch-branch protections intact.

Effect:
- Prevents stale CSV download/activity side-effects after navigation away from audit.
- Keeps normal export behavior unchanged in active audit context.
