# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened async toast rendering in `processSettingsUnsavedToastQueue` by adding `isConnected` checks inside the `requestAnimationFrame` callback before writing to `settings-unsaved-toast-message` or fallback toast text content.