# Change Log

## 2024-03-18 #304
- Hardened `showSection` by capturing the origin section and validating it before audit teardown side-effects.
- Added an early return when `currentSection` changed during async unsaved-settings decision flow.
- Prevented stale transition continuations from calling `stopAuditAutoRefresh()` / `cancelAuditRequest()` for no-longer-relevant context.
