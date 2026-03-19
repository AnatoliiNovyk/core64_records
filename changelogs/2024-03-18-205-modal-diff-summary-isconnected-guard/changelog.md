# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards for all core summary nodes in `updateSettingsUnsavedModalDiffSummary` to prevent class/text updates against detached modal DOM elements during fast re-render or close/open transitions.