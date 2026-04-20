## Як було
- Для CRUD-зображень у адмінці діяв ліміт 500KB, що часто було замало для реальних обкладинок релізів.
- Frontend і backend були синхронізовані на 500KB, тому завеликі файли відхилялися ще до збереження.
- Повідомлення в UI і валідація API показували однакову, але занадто жорстку межу 500KB.

## Що зроблено
- У `admin.js` піднято ліміт upload для collection-зображень з 500KB до 700KB (`MAX_COLLECTION_UPLOAD_IMAGE_BYTES`).
- В `admin.js` оновлено UX-тексти під нову межу 700KB:
  - alert `uploadTooLargeCollection` (UK/EN);
  - підказки в модалках для release/artist/event upload.
- У `backend/src/middleware/validate.js` піднято backend-guard до еквівалента 700KB:
  - введено `INLINE_COLLECTION_IMAGE_UPLOAD_MAX_BYTES = 700 * 1024`;
  - ліміт data URL обчислюється формулою base64 (`INLINE_COLLECTION_IMAGE_DATA_URL_MAX_CHARS`).
- У `backend/src/middleware/validate.js` оновлено тексти валідації для релевантних схем на 700KB.

## Що покращило/виправило/додало
- Підвищено практичність upload для реальних реліз-обкладинок без повернення до сценарію з неконтрольованими 500.
- Збережено fail-fast поведінку: завеликі payload як і раніше відсікаються валідацією, але межа стала менш агресивною.
- Frontend і backend залишилися синхронними по новому ліміту, що прибирає розбіжності в очікуваннях користувача.
