# Change Log

Hardened `applyAuditDatePreset` by requiring connected `preset`, `from`, and `to` controls before any read/write operation.
Prevented detached-node `.value` writes for date range preset application during section transitions.
Kept date preset behavior unchanged when controls are present and connected.
