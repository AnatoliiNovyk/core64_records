# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `toastEl.isConnected` guard in `updateSettingsUnsavedToastAriaLabel` to avoid aria/title mutations when the toast container has been detached from the DOM.