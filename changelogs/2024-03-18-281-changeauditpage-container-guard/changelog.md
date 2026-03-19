# Change Log

## 2024-03-18 #281
- Hardened `changeAuditPage` by adding a connected-container guard before updating `auditPage`.
- Prevented page-state mutations when the audit list is detached during section transitions.
- Preserved existing pagination behavior when audit UI is active.
