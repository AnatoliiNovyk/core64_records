# Change Log

Hardened `changeContactStatus` and `bulkUpdateContactStatus` with origin-section context capture.
Added guards to ensure these async flows proceed only for `contacts` origin context and re-check context before `addActivity(...)`.
Prevented stale activity-log updates when section context changes during async contact status operations.
