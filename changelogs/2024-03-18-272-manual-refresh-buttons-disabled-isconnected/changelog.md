# Change Log

## 2024-03-18 #272
- Hardened `setManualAuditRefreshButtonsDisabled` with `isConnected` checks for both manual refresh buttons.
- Prevented detached-node `.disabled` mutations during rapid section transitions and async refresh state updates.
- Preserved existing refresh button state behavior.
