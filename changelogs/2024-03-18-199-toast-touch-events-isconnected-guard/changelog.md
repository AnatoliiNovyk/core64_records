# Changelog

## [Unreleased] - 2024-03-18
### Added
- Implemented `toastEl.isConnected` guard in `handleSettingsUnsavedToastTouchStart`, `handleSettingsUnsavedToastTouchEnd`, and `handleSettingsUnsavedToastTouchCancel` to prevent touching state updates and auto-close manipulations on disconnected toast elements.