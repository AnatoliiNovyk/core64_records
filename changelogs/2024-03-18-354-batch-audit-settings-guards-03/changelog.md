# 354 batch audit/settings guards 03

Batch fixes in admin.js:

1) setupAuditAutoRefresh interval callbacks
Added connected audit section checks inside both countdown and auto-refresh interval callbacks.

2) handleAuditVisibilityChange catch branch
Added connected audit section check before error handling UI path.

3) toggleAuditEcoMode post-setup path
Added post-call section/context/isConnected re-check before refresh badge update.

4) saveSettings corrective warning alert
Gated the "warn threshold adjusted" alert by active settings context and connected settings section.

Effect:
Reduces stale/detached audit and settings UI side-effects from async/timer paths.
Preserves behavior in the active valid section.
