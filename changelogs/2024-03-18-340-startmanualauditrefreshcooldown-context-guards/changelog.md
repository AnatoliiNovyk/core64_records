# Step 340 — startManualAuditRefreshCooldown context guards

## File
`admin.js`

## Function
`startManualAuditRefreshCooldown`

## Change
- Captured `sectionAtCooldown = currentSection` at function entry.
- Guarded immediate call to `applyManualAuditRefreshButtonsState()` so it only executes when:
  - `currentSection === sectionAtCooldown`
  - `currentSection === "audit"`
  - `#section-audit` exists and `isConnected`
- Applied same triple-condition guard to the `setTimeout` callback's call to `applyManualAuditRefreshButtonsState()`.

## Rationale
Prevents stale cooldown-timer callbacks from mutating audit button states after the user has navigated away from the audit section or the DOM node has been detached.

## Risk
None — purely additive guard; active audit UI is unaffected.

## Diagnostics
No errors.
