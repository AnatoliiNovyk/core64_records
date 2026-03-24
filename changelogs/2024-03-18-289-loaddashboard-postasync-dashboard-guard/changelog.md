# Change Log

Hardened `loadDashboard` with post-async guards after `refreshCache()`.
Added checks for active `dashboard` section and connected `section-dashboard` before counter updates.
Prevented stale dashboard counter writes when users navigate away during async cache refresh.
