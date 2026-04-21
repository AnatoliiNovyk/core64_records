# 2026-04-21-253 Contact Metadata-First and Lazy Attachment Fetch

## Як було

- `GET /api/contact-requests` завжди повертав повний payload звернень разом з `attachmentDataUrl`, а для chunked-вкладень додатково виконував гідратацію у списку.
- Адмін-дії відкриття/завантаження вкладення працювали лише з already-loaded `attachmentDataUrl` із загального списку.
- Список звернень був важчим за обсягом і дорожчим по I/O/CPU при великій кількості записів або великих вкладеннях.

## Що зроблено

- У backend додано metadata-first поведінку для `GET /api/contact-requests`:
  - у `repository.firestore.js` `listContactRequests` приймає опцію `includeAttachmentDataUrl`;
  - за замовчуванням список повертає metadata без гідратації `attachmentDataUrl`;
  - додано ознаку наявності вкладення (`hasAttachment` / `has_attachment`) у contact payload.
- Додано окремий endpoint для lazy-завантаження вкладення:
  - `GET /api/contact-requests/:id/attachment` у `contactRequests.js`;
  - у `repository.firestore.js` реалізовано `getContactRequestAttachmentById` з резолвом chunked/inline даних.
- Оновлено adapter-шар:
  - `repository.adapter.js` прокидає опції в `listContactRequests`;
  - додано `getContactRequestAttachmentById`.
- Оновлено frontend adapter/admin flow:
  - `data-adapter.js` підтримує metadata-first формат і новий метод `getContactRequestAttachment(id)`;
  - `admin.js` додано lazy-резолв вкладення при open/download через API, локальний cache data URL і синхронізацію в `cache.contactRequests`.

## Що покращило/виправило/додало

- Зменшено вагу та вартість завантаження списку звернень: великі вкладення більше не тягнуться масово в list endpoint за замовчуванням.
- Підвищено масштабованість contact-admin потоку: вкладення завантажується on-demand лише коли оператор реально відкриває або завантажує файл.
- Збережено сумісність UX: кнопки роботи з вкладенням залишаються доступними, а відсутні/пошкоджені вкладення обробляються контрольовано через окремий endpoint і помилки 404.
