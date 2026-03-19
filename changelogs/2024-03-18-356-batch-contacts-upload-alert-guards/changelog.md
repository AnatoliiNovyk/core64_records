# 356 batch contacts/upload alert guards

Batch fixes in admin.js:

1) exportContactsCsv
- Added connected contacts list checks in both no-data alert path and post-export activity path.

2) handleFileUpload validation alerts
- Wrapped unsupported-format and file-too-large alerts with section-consistency + connected section checks.

3) handleFileUpload FileReader error alert
- Added connected section check before showing file-read error alert.

Effect:
- Reduces stale alert side-effects when upload/export actions complete after context transitions.
- Keeps behavior unchanged in active valid contacts/edit contexts.
