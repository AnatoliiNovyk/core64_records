# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `badgeEl.isConnected` guard in `updateSettingsUnsavedToastQueueBadge` to prevent queue-badge aria/text/class mutations on detached DOM nodes.