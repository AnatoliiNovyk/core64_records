# Change Log

Hardened `stopAuditAutoRefresh` with a guarded refresh-badge update at stop-flow end.
Added checks to ensure active section is `audit` and `section-audit` is connected before calling `updateAuditRefreshBadge()`.
Preserved timer cleanup behavior while preventing stale badge side-effects outside audit context.
