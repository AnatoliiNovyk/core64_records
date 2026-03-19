# Change Log

## 2024-03-18 #282
- Hardened `setAuditLoading` by invoking `renderAuditSkeleton()` only when `audit-list` is present and connected.
- Prevented unnecessary skeleton render attempts during section teardown races.
- Preserved loading indicator and aria-busy behavior.
