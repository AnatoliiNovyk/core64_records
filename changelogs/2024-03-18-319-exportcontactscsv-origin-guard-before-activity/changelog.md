# Change Log

Hardened `exportContactsCsv` with origin-section/context guards before `addActivity(...)`.
Added checks to ensure section context remains unchanged, still `contacts`, and `section-contacts` is connected.
Prevented stale export activity-log writes after section transitions during CSV export flow.
