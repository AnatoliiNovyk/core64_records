# Change Log

## 2024-03-18 #296
- Hardened `checkAuth` with a post-await `login-screen` connectivity guard after `adapter.isAuthenticated()`.
- Simplified subsequent class toggles to operate only when the guarded element is confirmed connected.
- Prevented stale login-screen mutations if auth check resolves after UI teardown.
