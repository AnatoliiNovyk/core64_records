# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `limitEl.isConnected` guard in `renderAuditLogs` before reading `audit-limit` value, avoiding stale input reads when audit controls are detached from the DOM.