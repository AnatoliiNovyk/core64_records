# Change Log

## 2024-03-18 #271
- Hardened `validateAuditDateRange` by reading `audit-date-from` and `audit-date-to` only when inputs are connected.
- Prevented stale value reads from detached date controls during rapid section changes.
- Kept existing date-range validation semantics unchanged.
