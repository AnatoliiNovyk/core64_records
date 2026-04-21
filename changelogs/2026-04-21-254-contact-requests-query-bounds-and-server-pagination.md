# 2026-04-21-254 Contact Requests Query Bounds and Server Pagination

## Як було

- `GET /api/contact-requests` у metadata-first версії повертав повний масив звернень (без server-side pagination/filter), а пагінація в адмінці лишалась переважно клієнтською.
- Для query-параметрів contact list не було централізованого guard-набору на рівні роуту (`page`, `limit`, `status`, `q`, `date`).
- Не було уніфікованого server response mode для contact list у стилі `{ items, page, limit, total }` при запитах з параметрами.

## Що зроблено

- У `backend/src/routes/contactRequests.js` додано query bounds і валідацію для `GET /api/contact-requests`:
  - `page` і `limit` мають бути цілими `>= 1`;
  - `limit` обмежується `CONTACT_REQUESTS_MAX_LIMIT = 250`;
  - `status` валідовано по allowlist (`new`, `in_progress`, `done`);
  - `q` обмежено довжиною `CONTACT_REQUESTS_QUERY_MAX_CHARS = 120`;
  - `date` валідується як `YYYY-MM-DD`.
- Додано dual-mode contract для list endpoint:
  - без query-фільтрів повертається backward-compatible масив;
  - при наявності query-параметрів повертається мета-обʼєкт `{ items, page, limit, total }`.
- У `backend/src/db/repository.firestore.js` розширено `listContactRequests(options)`:
  - застосовано server-side filter за `status`, `q`, `date`;
  - застосовано server-side pagination через `page/limit`;
  - додано `returnMeta` режим для контрольованого повернення метаданих.
- У `data-adapter.js` оновлено `getContactRequests(options)`:
  - передача `page`, `limit`, `status`, `q`, `date` у API;
  - підтримка `returnMeta` з нормалізацією response shape;
  - локальний fallback також підтримує фільтрацію і пагінацію в аналогічному форматі.

## Що покращило/виправило/додало

- Зменшено ризик невалідних/важких query-запитів у contact list через чіткі server-side guard-и.
- Додано фундамент для масштабування contact-admin потоку: сервер може повертати сторінки замість повного масиву.
- Підвищено консистентність API: для query-driven сценаріїв доступний передбачуваний формат `{ items, page, limit, total }`, сумісний із існуючим data-adapter підходом.
