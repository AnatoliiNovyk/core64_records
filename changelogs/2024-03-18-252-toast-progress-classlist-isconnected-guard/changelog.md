# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `progressEl.isConnected` guard in `processSettingsUnsavedToastQueue` before progress bar class toggles, preventing stale class mutations on detached progress nodes.