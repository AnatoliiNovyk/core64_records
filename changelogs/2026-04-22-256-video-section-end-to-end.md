# 2026-04-22-256 Video Section End-to-End

## Як було
- У проєкті не було окремої сутності video у backend CRUD, валідації та `/api/public`.
- Публічний сайт не мав секції Video, пунктів меню Video і рендера YouTube-відео.
- Адмін-панель не підтримувала керування відео (навігація, список, модалка, збереження).
- Smoke/self-test перевірки не знали про новий ключ секції `videos`.

## Що зроблено
- Backend:
  - Додано `videoSchema` у валідацію, включно з перевіркою YouTube URL.
  - Розширено collection routes для `videos` у GET/POST/PUT/DELETE.
  - Додано нормалізацію/мапінг `videos` у Firestore repository (payload, row mapping, сортування, i18n-поля).
  - Додано `videos` у `/api/public`.
  - Оновлено CSP (`frame-src`) для безпечного вбудовування YouTube iframe.
- Frontend public:
  - Додано секцію `videos` в `index.html` і пункти меню (desktop/mobile).
  - Розширено `PUBLIC_SECTION_DEFAULTS` і i18n-словники.
  - Додано `renderVideos`, парсинг/нормалізацію YouTube URL і генерацію embed URL.
  - Додано `videos` у застосування section settings і bootstrap/fallback рендер.
- Admin:
  - Додано `videos` у кеш, i18n-словники, loader chain і section settings defaults.
  - Додано `loadVideos` для списку відео.
  - Додано підтримку `video` у CRUD (тип, модалка, поля, normalize/save, translatable fields).
  - Додано кнопку в сайдбар і окремий блок секції в `admin.html`.
- Adapter and checks:
  - Додано `videos` у local defaults/fallback (`data-adapter.js`).
  - Оновлено `smoke-check` і `test-smoke-check` під обов'язковий ключ `videos`.
  - Оновлено `ui-smoke` список керованих секцій.

## Що покращило/виправило/додало
- Додано повний наскрізний функціонал Video (backend -> admin -> public).
- Проєкт тепер підтримує централізоване керування YouTube-відео з адмінки.
- Збережено консистентність section settings (порядок/видимість/локалізація) для нового ключа `videos`.
- Smoke self-test лишився працездатним після змін (`smoke-check self-test PASSED`).
