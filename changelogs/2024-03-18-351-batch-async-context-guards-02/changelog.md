# 351 batch async context guards 02

Batch fixes in admin.js:

1) refreshAuditNow catch branch
- Added section/context/isConnected checks before handleAuditLoadError call.

2) forceRefreshAuditNow catch branch
- Added section/context/isConnected checks before handleAuditLoadError call.

3) exportContactsCsv empty-result alert path
- Added section/context/isConnected checks before showing "no contacts" alert.

4) bulkUpdateContactStatus no-targets alert path
- Added section/context/isConnected checks before showing "no targets" alert.

Effect:
- Reduces stale notifications/errors when users switch sections during async operations.
- Keeps behavior unchanged in valid active context.
