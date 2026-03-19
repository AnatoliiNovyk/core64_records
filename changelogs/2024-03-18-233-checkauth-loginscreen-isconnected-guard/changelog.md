# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `loginScreen.isConnected` guards in `checkAuth` before `classList` mutations, preventing hidden/show toggles on detached login screen nodes.