# Batch 374: Audit Section Transition UI State Hardening

## Summary
Hardened `showSection` audit transition behavior to prevent stale manual refresh UI states from leaking across section changes, and removed an accidental out-of-scope abort guard line that could cause runtime failures.

## Changes Applied

### 1) Reset Manual Audit Controls When Leaving Audit Section
- In the non-audit branch of `showSection`, after clearing audit timers/flags, explicitly normalized manual refresh controls:
  - Re-enabled `refreshNowBtn` and `forceRefreshBtn` (if connected).
  - Restored button labels (`refreshText`, `forceText`) and hid loading spinners (`refreshLoading`, `forceLoading`).
- This ensures no disabled/spinner states persist after navigating away from audit.

### 2) Removed Stray Out-of-Scope Abort Guard
- Removed accidentally inserted line:
  - `if (isAbortError(error)) return;`
- The line was placed in `showSection` outside a valid catch scope and referenced undefined `error`, creating runtime risk.

### 3) Normalize Manual Refresh State on Audit Entry
- In audit-entry flow (after `setupAuditAutoRefresh()`), re-applied manual control baseline:
  - Re-enabled `refreshNowBtn` and `forceRefreshBtn` (if connected).
  - Called `setRefreshNowButtonLoading(false)` and `setForceRefreshButtonLoading(false)`.
- This guarantees consistent initial manual refresh state when entering audit.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.

## Outcome
- Section transitions now consistently clear stale audit manual-control UI artifacts.
- Eliminated a latent runtime exception source from an out-of-scope symbol reference.
