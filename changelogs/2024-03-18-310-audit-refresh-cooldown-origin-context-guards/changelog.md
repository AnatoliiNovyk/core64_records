# Change Log

## 2024-03-18 #310
- Hardened `refreshAuditNow` and `forceRefreshAuditNow` with origin-context capture.
- Added `finally` guards so manual refresh cooldown starts only when section context remains unchanged and still `audit`.
- Prevented stale cooldown side-effects after users navigate away during async refresh operations.
