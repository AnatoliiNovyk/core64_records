## Як було
- У розділі Settings збереження могло завершуватися `500 INTERNAL_SERVER_ERROR` і в адмінці показувалось `Failed to save settings: Internal server error`.
- Помилка могла виникати або на записі занадто великого settings-документа в Firestore, або на кроці запису audit log після успішного save.
- Для settings save не було окремого мапінгу `DB_STORAGE_LIMIT_REACHED` у користувацьке повідомлення.

## Що зроблено
- У `backend/src/db/repository.firestore.js` додано pre-check розміру settings-документа перед `set(...)`:
  - додано `assertFirestoreDocumentSizeWithinSafeLimit(...)`;
  - додано константи безпечного порогу і Firestore max document size;
  - при перевищенні повертається контрольована помилка з маркером `maximum document size`.
- У `backend/src/routes/settings.js` запис audit для settings зроблено best-effort:
  - `writeSettingsAuditEntry(...)` тепер не валить основне збереження при збої audit write;
  - помилка аудиту логиться через `logger.warn("settings.audit_write_failed", ...)`.
- У `admin.js` розширено `resolveSettingsSaveErrorMessage(...)`:
  - додано обробку `isDatabaseStorageLimitError(error)` з цільовим повідомленням про ліміт сховища.

## Що покращило/виправило/додало
- Зменшено кількість `500` у Settings save flow за рахунок fail-safe поведінки audit write.
- Додано fail-fast guard від oversized settings payload для Firestore документа.
- Покращено UX помилок у адмінці: замість загального internal error користувач отримує причинне повідомлення про ліміти сховища (коли це релевантно).
