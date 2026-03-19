# Step 341 — pulseAuditRefreshSuccess initial isConnected guard

## File
\dmin.js\

## Function
\pulseAuditRefreshSuccess\

## Change
- Added \currentSection !== 'audit'\ early-return guard at function entry.
- Changed \if (!sectionEl)\ -> \if (!sectionEl || !sectionEl.isConnected)\ so the initial classList mutations are skipped when the section is detached.

## Rationale
Prevents cross-section DOM mutation: if the user navigated away from audit before a pending refresh success callback fires, the ring highlight classes are no longer applied to a detached node.

## Risk
None — purely additive guard; active audit UI is unaffected.

## Diagnostics
No errors.

