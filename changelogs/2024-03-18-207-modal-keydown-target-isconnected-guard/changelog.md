# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added detached-target guard in `handleSettingsUnsavedModalKeyboard` to ignore keydown events whose `event.target` is no longer connected to the DOM.