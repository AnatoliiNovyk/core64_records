# Change Log

## 2024-03-18 #261
- Hardened `loadAuditLogs` to read audit query/filter/date controls only when elements are connected.
- Added safe fallback values for detached/missing controls before building `adapter.getAuditLogs` parameters.
- Preserved existing behavior while preventing stale DOM reads during section swaps or re-render timing races.
