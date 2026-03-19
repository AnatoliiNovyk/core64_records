# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened `finalizeSettingsUnsavedToastDisplay` with `toastEl.isConnected` guards before focus-restore eligibility checks and before mutating toast attributes/classes during dismiss flow.