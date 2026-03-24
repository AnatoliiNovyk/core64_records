# Change Log

Hardened `handleFileUpload` by adding `isConnected` re-checks before resetting `input.value` after validation alerts.
Prevented detached-input writes when modal/UI state changes while an alert is shown.
Preserved existing file validation flow and user-facing messages.
