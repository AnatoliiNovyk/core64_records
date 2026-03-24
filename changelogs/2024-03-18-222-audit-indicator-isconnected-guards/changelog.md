# Changelog

## Added

Added `isConnected` guards in `updateAuditLatencyIndicator` for `audit-latency-dot` and `audit-avg-latency` before class and attribute updates, preventing stale DOM mutations during re-render transitions.
