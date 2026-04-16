# 2026-04-17-01 Firestore Migration Foundation Data Backend Adapter

## Як було

- Усі роути та сервіси напряму імпортували Postgres-реалізацію з `backend/src/db/repository.js`.
- Конфіг знав лише про Postgres (`DATABASE_URL`) і не мав керованого режиму перемикання backend-провайдера.
- Для запуску поетапної міграції на Firestore не було єдиної точки перемикання read/write шляхів без масового рефактору API-роутів.

## Що зроблено

- У `backend/src/config.js` додано керований прапор `DATA_BACKEND` з дозволеними значеннями:
- `postgres` (дефолт);
- `dual`;
- `firestore`.
- У `backend/src/config.js` додано `FIRESTORE_PROJECT_ID` та умовну валідацію:
- `DATABASE_URL` обов'язковий лише для `postgres|dual`;
- `FIRESTORE_PROJECT_ID` обов'язковий для `firestore|dual`.
- Додано новий адаптер `backend/src/db/repository.adapter.js`:
- централізований вибір read/write repository залежно від `DATA_BACKEND`;
- режим `dual` виконує primary write у Postgres і shadow write у Firestore (best-effort, без зламу primary path).
- Додано каркас `backend/src/db/repository.firestore.js` з повним переліком методів і явною помилкою `FIRESTORE_NOT_IMPLEMENTED` для ще не реалізованих операцій.
- У `backend/src/routes/health.js` додано backend-aware health поведінку:
- `GET /health` тепер повертає активний `dataBackend`;
- для `DATA_BACKEND=firestore` endpoint `GET /health/db` повертає стабільний код `DB_BACKEND_HEALTH_NOT_IMPLEMENTED` замість неочевидного падіння Postgres-проби.
- Перемкнено імпорти на adapter-шар у файлах:
- `backend/src/routes/collections.js`;
- `backend/src/routes/public.js`;
- `backend/src/routes/releaseTracks.js`;
- `backend/src/routes/settings.js`;
- `backend/src/routes/contactRequests.js`;
- `backend/src/routes/auditLogs.js`;
- `backend/src/services/captcha.js`.

## Що покращило/виправило/додало

- Створено безпечний стартовий фундамент міграції на Firestore без зміни зовнішнього API-контракту.
- З'явилась єдина точка керування backend-режимом, що дозволяє поетапний cutover (`postgres -> dual -> firestore`).
- Додано технічну основу для shadow-write telemetry у dual-mode без ризику зламати продовий primary write-path.
- Масовий подальший рефакторинг спрощено: роути більше не прив'язані до конкретної реалізації сховища.
- Health-check став прозорішим для етапного rollout: видно активний backend і зрозуміла причина деградації до повної Firestore-імплементації.
