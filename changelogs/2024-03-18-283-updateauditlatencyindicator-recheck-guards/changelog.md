# Change Log

Hardened `updateAuditLatencyIndicator` with additional `isConnected` re-checks before class and attribute mutations across all indicator branches.
Prevented detached-element UI writes when latency indicator nodes unmount between initial guard and subsequent updates.
Preserved latency threshold classification and indicator semantics.
