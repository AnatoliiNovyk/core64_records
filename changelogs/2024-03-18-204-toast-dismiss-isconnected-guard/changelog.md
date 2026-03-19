# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `toastEl.isConnected` guard in `dismissSettingsUnsavedToast` to prevent dismissal flow from running when the unsaved-toast node is already detached from the DOM.