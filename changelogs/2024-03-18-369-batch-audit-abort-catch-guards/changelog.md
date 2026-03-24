# 369 batch audit abort catch guards

Batch fixes in admin.js:

1) setupAuditAutoRefresh -> auto-refresh catch
Added section/context/isConnected guards before logging error.
Added `isAbortError` filter to skip expected abort noise.

2) handleAuditKeyboardShortcuts -> refresh chain catch
Added `isAbortError` filter in catch branch.

3) handleAuditVisibilityChange -> loadAuditLogs catch
Added `isAbortError` filter before calling handleAuditLoadError.

Effect:
Reduces noisy/stale error handling for intentionally aborted audit requests.
Preserves real error visibility in active valid audit context.
