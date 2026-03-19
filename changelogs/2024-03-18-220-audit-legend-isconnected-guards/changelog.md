# Changelog

## [Unreleased] - 2024-03-18
### Added
- Added `isConnected` guards in `renderAuditLatencyLegend` before updating legend labels, preventing text mutations on detached DOM nodes during UI re-render transitions.