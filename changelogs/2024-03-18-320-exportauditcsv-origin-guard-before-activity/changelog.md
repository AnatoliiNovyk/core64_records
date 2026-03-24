# Change Log

Hardened `exportAuditCsv` with origin-section/context guards before `addActivity(...)`.
Added checks to ensure section context remains unchanged, still `audit`, and `section-audit` is connected.
Prevented stale audit export activity-log writes after section transitions during CSV export flow.
