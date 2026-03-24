# 365 batch early contacts/upload guards

Batch fixes in admin.js:

1) changeContactStatus
Added early section/context/isConnected guard before starting async status update.
Reused validated contacts section/list references in success path.

2) bulkUpdateContactStatus
Added early section/context/isConnected guard before computing targets and starting async updates.
Reused validated contacts section/list references in success path.

3) handleFileUpload
Added early connected section guard before file validations/read start.
Reused captured section reference in validation alerts and FileReader callbacks.

Effect:
Avoids launching async contact/file operations in stale or detached contexts.
Reduces redundant DOM lookups while keeping behavior unchanged in valid context.
