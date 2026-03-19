# Change Log

## 2024-03-18 #328
- Hardened `changeAuditLimit` catch callback with origin/context guards before `handleAuditLoadError(...)`.
- Added checks for unchanged section context, active `audit` section, and connected `section-audit`.
- Prevented stale audit error banner updates after section transitions.
