# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `showAuditShortcutToast` (initial element check, RAF callback, and timeout callback) to prevent text/class mutations on detached shortcut toast nodes.