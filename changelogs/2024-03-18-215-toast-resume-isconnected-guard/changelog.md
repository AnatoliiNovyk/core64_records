# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added early `toastEl.isConnected` guard in `resumeSettingsUnsavedToastAutoClose` so auto-close timer resume is skipped when the toast container is detached or missing.