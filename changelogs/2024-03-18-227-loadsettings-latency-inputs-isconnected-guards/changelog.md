# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `loadSettings` for `setting-audit-latency-good-max` and `setting-audit-latency-warn-max` assignments to avoid writing values to detached input nodes.