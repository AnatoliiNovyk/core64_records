## Як було
- Відправка демо-треку через публічну contact-форму падала з повідомленням про тимчасову недоступність бази.
- Вкладення зберігалось inline у документі `contact_requests`, і для більших mp3 це перевищувало ліміт розміру Firestore-документа.
- На фронтенді помилка `DB_STORAGE_LIMIT_REACHED` показувалась так само, як `DB_UNAVAILABLE`, тому користувач бачив оманливий текст.

## Що зроблено
- У `backend/src/db/repository.firestore.js` додано chunked-зберігання вкладень contact request:
  - великі `attachmentDataUrl` автоматично розбиваються на чанки в окремій колекції `contact_request_attachment_chunks`;
  - у документі `contact_requests` зберігаються метадані (`attachmentStorage`, `attachmentMimeType`, `attachmentChunkSetId`, `attachmentChunkCount`, `attachmentBase64Length`);
  - при читанні `listContactRequests()` вкладення автоматично гідрується назад у `attachmentDataUrl`, щоб open/download в адмінці працював без змін;
  - додано best-effort rollback/cleanup, якщо запис чанків завершився помилкою.
- У `backend/src/middleware/validate.js` посилено валідацію `attachmentDataUrl` до формату base64 Data URL.
- У `app.js` розділено мапінг помилок submit:
  - `DB_STORAGE_LIMIT_REACHED` (507) тепер показує окремий текст про завеликий файл;
  - `DB_UNAVAILABLE` (503) залишився окремою гілкою для реальної недоступності БД.

## Що покращило/виправило/додало
- Виправлено основний сценарій падіння при відправці демо-треків з більшими файлами.
- Прибрано хибне повідомлення "Database is temporarily unavailable" для помилок ліміту розміру.
- Збережено сумісність з поточним UI адмінки для перегляду та завантаження вкладень contact-заявок.
