# 373 batch audit transient state cleanup

Batch fixes in admin.js (when navigating away from `audit` in showSection):

1) Timer cleanup
Cleared and nulled `auditSearchDebounceTimer`.
Cleared and nulled `auditShortcutToastTimer`.
Cleared and nulled `auditRefreshHighlightTimer`.
Cleared and nulled `manualAuditRefreshCooldownTimer`.

2) UI transient cleanup
Hid audit shortcut toast element if connected.
Removed temporary refresh highlight ring classes from audit section if connected.

3) Manual refresh flags reset
Reset `manualAuditRefreshCooldownActive` and `manualAuditRefreshInProgress` when leaving audit.

Effect:
Prevents stale callbacks and residual audit visual/button state from leaking across section transitions.
Keeps audit behavior clean when re-entering the section.
