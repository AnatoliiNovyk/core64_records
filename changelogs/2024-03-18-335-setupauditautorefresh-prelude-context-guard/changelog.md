# Change Log

Hardened `setupAuditAutoRefresh` prelude with early origin/context guards after timer stop.
Added checks for unchanged context, active `audit` section, and connected `section-audit` before `updateAuditRefreshBadge()` and `saveAuditUiState()`.
Reused the validated section node later in setup flow to avoid duplicate lookup/redefinition.
