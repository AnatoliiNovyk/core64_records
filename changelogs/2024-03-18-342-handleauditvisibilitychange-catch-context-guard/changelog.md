# Step 342 — handleAuditVisibilityChange catch context guard

\dmin.js\

\handleAuditVisibilityChange\

Added \if (currentSection !== sectionAtVisibility) return;\ and \if (currentSection !== 'audit') return;\ guards inside the \loadAuditLogs().catch\ callback.

If the user navigates away from the audit section while the tab-return reload is in flight, the catch handler fires in a stale section context. The guards prevent cross-section error display.

None — additive guard only; error is still handled when section is active.

No errors.
