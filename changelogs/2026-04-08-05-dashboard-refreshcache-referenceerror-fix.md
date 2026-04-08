# Changelog 2026-04-08 #05 - Dashboard RefreshCache ReferenceError Fix

## Як було

- У `admin.js` функція `refreshCache()` містила невалідні посилання на змінні `navigationSeqAtUpload` та `sectionAtUpload`.
- Також відбувалось присвоєння кешу з неіснуючих змінних `releases`, `artists`, `events`.
- Під час bootstrap дашборду це могло викликати `ReferenceError`, після чого показувався банер про помилку завантаження адмін-панелі через API.

## Що було зроблено

- Переписано `refreshCache()` у `admin.js` з коректним сценарієм:
  - перевірка наявності `getCollection` адаптера
  - послідовне завантаження `releases`, `artists`, `events`, `sponsors`, `settings`
  - збереження чинних guard-перевірок `sectionNavigationSeq/currentSection/isConnected` перед записом у кеш
  - нормалізація і запис у `cache` через наявні helper-методи
- Видалено поламані посилання на upload-контекст у dashboard flow.

## Що це покращило, виправило, додало

- Усунуто `ReferenceError` у dashboard bootstrap.
- Зменшено кількість хибних API-помилок в адмінці при справному backend (`/api/health` і `/api/health/db` = ok).
- Повернуто стабільне завантаження кешу дашборду з актуальних API-даних.
