# Change Log

## 2024-03-18 #309
- Hardened `refreshCache` with origin-context checks between sequential collection fetches.
- Switched to staged local variables and apply-at-end cache assignment only when section context remains unchanged.
- Prevented partial cache writes when navigation changes during multi-step refresh.
