# Change Log

## 2024-03-18 #325
- Hardened `setupAuditAutoRefresh` by capturing origin section context at setup time.
- Added `currentSection === sectionAtSetup` guards in both countdown and auto-refresh interval callbacks.
- Prevented stale interval side-effects from continuing after section transitions.
