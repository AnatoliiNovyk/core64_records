# Change Log

## 2024-03-18 #285
- Hardened `handleAuditKeyboardShortcuts` with post-async guards after `refreshAuditNow()` resolves.
- Added checks for active `audit` section and connected `section-audit` before showing shortcut toast.
- Prevented stale UI notifications when users navigate away during refresh.
