# Change Log

## 2024-03-18 #321
- Hardened DOMContentLoaded bootstrap with origin-context guards around API status updates.
- Added `sectionAtBootstrap` checks before `hideApiStatus()`, before `loadDashboard()`, and in bootstrap catch before `showApiStatus(...)`.
- Added connected dashboard section guard in catch path to prevent stale API banner updates during teardown/context changes.
