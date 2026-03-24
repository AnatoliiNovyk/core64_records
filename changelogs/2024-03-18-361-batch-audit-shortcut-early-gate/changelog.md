# 361 batch audit shortcut early gate

Batch fixes in admin.js:

1) handleAuditKeyboardShortcuts
Added `.catch(...)` handler for `refreshAuditNow()` promise chain.
Catch branch is guarded by section/context/isConnected checks before logging.

2) loadAuditLogs
Added early audit context/isConnected gate immediately after `setAuditLoading(true)` and controller setup.
On early mismatch/disconnect, function now clears controller + loading state and exits before network requests.
Reused the same section element reference for later connectivity check.

Effect:
Avoids unnecessary in-flight audit requests outside active audit context.
Prevents unhandled promise path in shortcut-driven refresh flow.
