# Change Log

## 2024-03-18 #266
- Hardened `addActivity` by adding a final `isConnected` re-check on `#activity-log` immediately before `insertBefore`.
- Prevented a detached-parent insertion race when UI unmounts between initial guard and DOM insertion.
- Preserved existing activity log formatting and insertion order.
