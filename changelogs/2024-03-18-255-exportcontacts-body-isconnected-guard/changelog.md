# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `document.body` connectivity guard in `exportContactsCsv` before temporary link append/remove operations, preventing stale DOM manipulations during export flow.