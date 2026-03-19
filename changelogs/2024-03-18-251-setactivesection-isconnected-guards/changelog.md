# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `setActiveSection` for `.section-content`, target section node, and `.nav-item` elements before class toggles to avoid stale DOM mutations.