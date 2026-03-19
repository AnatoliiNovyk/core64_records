# 372 batch manual cooldown connected guards

Batch fixes in admin.js:

1) startManualAuditRefreshCooldown
- Added early precondition: only run when current section is `audit` and audit section is connected.
- Simplified initial button-state application by reusing validated section context.

2) refreshAuditNow finally branch
- Added connected audit section check before starting manual cooldown.

3) forceRefreshAuditNow finally branch
- Added connected audit section check before starting manual cooldown.

Effect:
- Prevents cooldown activation side-effects in detached/non-audit contexts.
- Keeps manual refresh cooldown behavior intact in active audit section.
