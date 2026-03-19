# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `handleAuditLatencyThresholdInputsChanged` to skip threshold normalization/update flow when latency threshold input elements are detached from the DOM.