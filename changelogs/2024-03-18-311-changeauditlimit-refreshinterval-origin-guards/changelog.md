# Change Log

Hardened `changeAuditLimit` with origin-section and connected `section-audit` guards before audit page reset and `loadAuditLogs()` call.
Hardened `changeAuditRefreshInterval` with the same guards before `setupAuditAutoRefresh()`.
Prevented stale audit side-effects when section context changes during UI interaction races.
