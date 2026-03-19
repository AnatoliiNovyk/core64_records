# Step 342 — handleAuditVisibilityChange catch context guard

## File
\dmin.js\

## Function
\handleAuditVisibilityChange\

## Change
- Added \if (currentSection !== sectionAtVisibility) return;\ and \if (currentSection !== 'audit') return;\ guards inside the \loadAuditLogs().catch\ callback.

## Rationale
If the user navigates away from the audit section while the tab-return reload is in flight, the catch handler fires in a stale section context. The guards prevent cross-section error display.

## Risk
None — additive guard only; error is still handled when section is active.

## Diagnostics
No errors.

