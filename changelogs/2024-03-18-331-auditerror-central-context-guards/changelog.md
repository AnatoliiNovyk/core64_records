# Change Log

Hardened `showAuditError` and `hideAuditError` with centralized audit context guards.
Added checks to ensure active section is `audit` and `section-audit` is connected before mutating audit error UI.
Prevented stale audit error visibility/text updates from non-audit or detached contexts.
