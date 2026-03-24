# Change Log

Hardened `refreshAuditNow` and `forceRefreshAuditNow` with preflight audit-context guards before entering loading flow.
Added checks for active `audit` section and connected `section-audit` before `set...ButtonLoading(true)` and subsequent async side-effects.
Prevented stale refresh flows from starting when audit UI is already detached or section changed.
