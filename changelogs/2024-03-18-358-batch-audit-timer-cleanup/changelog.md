# 358 batch audit timer cleanup

Batch fixes in admin.js:

1) setupAuditAutoRefresh interval callbacks
Added auto-stop behavior for both countdown and auto-refresh intervals when section context becomes stale or audit section disconnects.

2) showSection audit branch
Added target section connectivity re-check before setupAuditAutoRefresh after await loadAuditLogs.

3) handleAuditSearchInput debounce callback
Added debounce timer state cleanup (`auditSearchDebounceTimer = null`) at callback start.

Effect:
Prevents zombie audit timers and stale deferred callback state.
Keeps behavior unchanged while audit section is active and connected.
