# Batch 376: Audit Shortcut Toast Sequence Guard

## Summary
Hardened `showAuditShortcutToast` against stale callback races by introducing an invocation sequence token used by both `requestAnimationFrame` and `setTimeout` callbacks.

## Changes Applied

### 1) Added Toast Sequence State
- Introduced new module-level state:
  - `let auditShortcutToastSequence = 0;`
- Purpose: track the latest scheduled toast update and invalidate older async callbacks.

### 2) Guarded `requestAnimationFrame` Text Update
- In `showAuditShortcutToast`, each invocation now captures:
  - `const toastSequenceAtSchedule = ++auditShortcutToastSequence;`
- RAF callback exits early when not latest:
  - `if (toastSequenceAtSchedule !== auditShortcutToastSequence) return;`
- Prevents older frame callbacks from overwriting newer toast messages.

### 3) Guarded Auto-Hide Timeout Callback
- Added the same sequence check to timeout callback before hiding toast.
- If stale callback is detected, timer state is reset and callback exits.

### 4) Invalidated Pending Toast Work on Audit Exit
- In `showSection` non-audit branch, incremented sequence:
  - `auditShortcutToastSequence += 1;`
- Ensures any previously scheduled toast callbacks become no-ops when leaving audit.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.

## Outcome
- Eliminated stale toast callback race conditions during rapid shortcut usage and section transitions.
- Improved determinism of audit shortcut toast visibility/text updates.
