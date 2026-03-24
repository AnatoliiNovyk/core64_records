# Change Log

Hardened `clearAuditFilters` by applying `isConnected` guards to all filter `.value` writes.
Prevented detached-control writes during rapid section transitions while preserving reset values.
Kept existing audit page reset and reload flow unchanged.
