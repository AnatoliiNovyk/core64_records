# Change Log

Hardened `updateAuditRefreshBadge` with centralized audit context guards.
Added checks to ensure active section is `audit` and `section-audit` is connected before badge updates.
Prevented stale refresh-status badge mutations outside active audit context.
