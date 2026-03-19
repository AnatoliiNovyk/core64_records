# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `toastEl.isConnected` guard in `handleSettingsUnsavedToastFocusIn` so focus-in events on detached toast nodes no longer pause auto-close timers or mutate focus-return state.