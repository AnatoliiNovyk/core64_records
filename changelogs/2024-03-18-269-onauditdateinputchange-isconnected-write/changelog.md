# Change Log

## 2024-03-18 #269
- Hardened `onAuditDateInputChange` by requiring connected `audit-date-preset` before writing `presetEl.value = "custom"`.
- Prevented detached-element value mutation during rapid section transitions.
- Kept existing filter apply flow and pagination reset behavior unchanged.
