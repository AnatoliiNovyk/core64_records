# Change Log

Hardened `resetAuditPageAndRender` and `changeAuditPage` catch callbacks with origin/context guards before `handleAuditLoadError(...)`.
Added checks for unchanged section context, active `audit` section, and connected `section-audit`.
Prevented stale audit error banner updates after section transitions.
