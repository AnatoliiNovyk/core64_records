# Change Log

Hardened `setAuditLoading` by invoking `renderAuditSkeleton()` only when `audit-list` is present and connected.
Prevented unnecessary skeleton render attempts during section teardown races.
Preserved loading indicator and aria-busy behavior.
