# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened deferred focus restore in `resolveSettingsUnsavedNavigation` by requiring `settings-unsaved-modal` to be connected before running `contains(previous)` checks in the `requestAnimationFrame` callback.