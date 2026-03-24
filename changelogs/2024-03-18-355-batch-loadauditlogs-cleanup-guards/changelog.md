# 355 batch loadAuditLogs cleanup guards

Batch fixes in admin.js:

1) loadAuditLogs abort path
Added cleanup for active-sequence abort case: reset auditRequestController and turn off loading state.

2) loadAuditLogs post-response early-return guards
Added cleanup (controller reset + loading off) before returns on section/context mismatch or disconnected audit section.

3) handleLogin catch branch
Added loginScreen connectivity guard before applying login error UI state.

Effect:
Prevents stale in-flight audit loading state/controller residue after context transitions.
Reduces risk of error UI mutation when login screen is detached.
