# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `syncAuditLatencyThresholdsDirtyState` so dirty-state recalculation is skipped when latency threshold input elements are detached from the DOM.