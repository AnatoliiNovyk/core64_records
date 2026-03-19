# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened `updateSettingsUnsavedToastReturnFocus` by moving `toastEl.isConnected` into the primary guard, ensuring connectivity is validated before `contains` checks on the toast container.