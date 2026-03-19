# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `messageEl.isConnected` guard in `processSettingsUnsavedToastQueue` before clearing toast message text, preventing stale text mutations on detached message nodes.