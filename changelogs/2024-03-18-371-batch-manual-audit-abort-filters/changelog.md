# 371 batch manual audit abort filters

Batch fixes in admin.js:

1) refreshAuditNow catch branch
- Added `isAbortError` guard before `handleAuditLoadError`.

2) forceRefreshAuditNow catch branch
- Added `isAbortError` guard before `handleAuditLoadError`.

3) handleAuditVisibilityChange -> loadAuditLogs catch
- Added missing `isAbortError` guard before error UI handling.

Effect:
- Prevents false-negative error handling when audit requests are intentionally aborted during manual/visibility flows.
- Keeps real error handling intact in active audit context.
