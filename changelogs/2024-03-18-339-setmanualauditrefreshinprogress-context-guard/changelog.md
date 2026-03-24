# Change Log

Hardened `setManualAuditRefreshInProgress` with audit context guards before applying button-state side-effects.
Preserved internal `manualAuditRefreshInProgress` state updates while preventing stale button UI updates outside active, connected audit section.
Reduced cross-section side-effects from delayed refresh flows.
