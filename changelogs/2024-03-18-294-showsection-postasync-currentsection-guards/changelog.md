# Change Log

## 2024-03-18 #294
- Hardened `showSection` with post-async `currentSection` guards before `setupAuditAutoRefresh()` and `hideApiStatus()`.
- Prevented stale section-load completions from mutating UI after users navigate to another section mid-load.
- Preserved normal section loading behavior for active section transitions.
