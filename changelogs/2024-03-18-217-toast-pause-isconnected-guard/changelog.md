# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added early `toastEl.isConnected` guard in `pauseSettingsUnsavedToastAutoClose` so pause flow does not mutate timer/progress state when toast container is detached or missing.