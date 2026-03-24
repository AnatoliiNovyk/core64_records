# Change Log

Hardened DOMContentLoaded bootstrap with a post-`checkAuth()` connectivity re-check before `loadDashboard()`.
Prevented stale dashboard load execution if dashboard section detaches during async auth handling.
Preserved normal bootstrap behavior when dashboard UI remains active.
