# 353 batch audit/auth context guards

Batch fixes in admin.js:

1) checkAuth
Added origin section capture and section-consistency check after await before login screen mutations.

2) handleLogin
Added post-await section-consistency guard before applying login success/failure UI changes.

3) loadAuditLogs
Added origin section capture and post-response context/isConnected checks before applying cache and audit UI updates.

Effect:
Prevents stale auth/audit UI updates when async operations resolve after section transitions.
Keeps runtime behavior unchanged in active valid context.
