# 360 batch contacts/upload/settings context

Batch fixes in admin.js:

1) exportContactsCsv
Added early section/context/isConnected guards before export processing.
Kept safe body connectivity handling before file download click.
Removed duplicated late checks, relying on validated early context.

2) handleFileUpload (FileReader onload)
Added connected section check before applying image input/preview updates.

3) resetAuditLatencyThresholdsForm
Added section/context/isConnected guard before addActivity call.

Effect:
Reduces stale export/upload/settings activity side-effects after context transitions.
Preserves behavior in active valid sections.
