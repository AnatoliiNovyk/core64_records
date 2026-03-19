# Change Log

## 2024-03-18 #326
- Hardened `toggleAuditEcoMode` with origin-section/context guards before audit side-effects.
- Added checks to ensure section remains `audit` and `section-audit` is connected before save/setup/update chain.
- Prevented stale eco-mode toggle side-effects after section transitions.
