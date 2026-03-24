# Change Log

Hardened `exportAuditCsv` by reading audit filter controls only when elements are connected.
Added safe fallback values for detached/missing controls before calling `adapter.getAuditLogs`.
Preserved CSV export behavior while preventing stale DOM reads during section re-renders.
