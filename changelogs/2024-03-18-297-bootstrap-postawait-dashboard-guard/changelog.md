# Change Log

## 2024-03-18 #297
- Hardened DOMContentLoaded bootstrap flow with a post-await guard after `adapter.isApiAvailable()`.
- Added a connected `section-dashboard` check before continuing with `hideApiStatus()`, `checkAuth()`, and `loadDashboard()`.
- Prevented stale bootstrap UI mutations when the page is tearing down or dashboard section is unavailable.
