# Change Log

Hardened `handleAuditVisibilityChange` with origin-section/context checks.
Added guards before resume/reload path to ensure section context is unchanged and `section-audit` remains connected.
Prevented stale visibility-return reloads after navigation/context changes.
