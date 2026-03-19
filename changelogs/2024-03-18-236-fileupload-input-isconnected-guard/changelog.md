# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added early `input.isConnected` guard in `handleFileUpload` to skip file processing and input mutations when the upload field is detached from the DOM.