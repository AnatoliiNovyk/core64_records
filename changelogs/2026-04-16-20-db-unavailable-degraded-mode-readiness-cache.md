# DB Unavailable Degraded Mode And Readiness Cache

## Як було

- При живому `/api/health` і недоступній БД (`/api/public` -> `DB_UNAVAILABLE`) frontend/admin фактично залишались у непрацездатному стані.
- `shouldUseApi()` перевіряв тільки загальний health і не враховував стан БД.
- Через це обидві сторінки могли виглядати «лежачими», навіть якщо сам API-процес запущений.

## Що зроблено

- У `data-adapter.js` реалізовано readiness-check із урахуванням БД:
  - додається перевірка `/health/db` (керується `requireDatabaseForApi`);
  - при `DB_UNAVAILABLE` adapter переходить у local fallback замість тотального падіння;
  - для сумісності з середовищами без `/health/db` враховано `404/405` як допустимий сценарій.
- Додано short-lived cache рішення готовності API (`API_READINESS_CACHE_TTL_MS=5000`), щоб не робити зайві health-запити на кожен запит даних.
- У `index.html` і `admin.html` додано `requireDatabaseForApi: true` у `CORE64_CONFIG`.
- Піднято cache-busting версії:
  - `index.html`: `data-adapter.js?v=2026-04-16-20`, `app.js?v=2026-04-16-20`;
  - `admin.html`: `data-adapter.js?v=2026-04-16-20`, `admin.js?v=2026-04-16-20`.

## Що покращило/виправило/додало

- Усунуто сценарій, коли «API живий, але БД мертва» призводив до повної непрацездатності клієнтських сторінок.
- Додано керовану деградацію в local fallback при реальній недоступності БД.
- Зменшено шум і навантаження health-перевірок завдяки кешуванню readiness.
