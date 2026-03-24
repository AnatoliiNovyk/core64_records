# 362 batch modal activity context fix

Batch fixes in admin.js:

1) modal form submit flow
Captured `editingType`, `editingId`, and edit-mode flag at submit start.
Switched save operations to captured values.
Switched activity message to captured values after `closeModal()`.

2) deleteItem flow
Captured `typeName` once at function start for stable activity message generation.

Effect:
Prevents incorrect activity log text caused by global edit state reset after modal close.
Keeps behavior unchanged for successful create/update/delete actions.
