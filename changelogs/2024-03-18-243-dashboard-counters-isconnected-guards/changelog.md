# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `loadDashboard` before writing dashboard counters (`dash-releases`, `dash-artists`, `dash-events`) to prevent stale DOM updates.