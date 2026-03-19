# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `dirtyEl.isConnected` guard in `setAuditLatencyThresholdsDirtyState` to prevent `classList` updates on detached dirty-indicator nodes.