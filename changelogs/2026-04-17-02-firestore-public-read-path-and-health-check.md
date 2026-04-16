# 2026-04-17-02 Firestore Public Read Path And Health Check

## Як було

- Після першого етапу adapter-шару режим `DATA_BACKEND=firestore` ще не мав реальних операцій читання, тому public endpoint-и повертали `FIRESTORE_NOT_IMPLEMENTED`.
- Health-check для non-Postgres backend повертав технічний `DB_BACKEND_HEALTH_NOT_IMPLEMENTED` і не перевіряв реальну доступність Firestore.
- У backend не було Firestore SDK bootstrap, готового для ADC/Cloud Run або env credentials.

## Що зроблено

- Додано Firestore client bootstrap у `backend/src/db/firestoreClient.js`:
- lazy init Firebase Admin SDK;
- підтримка ADC (Cloud Run service account);
- підтримка env credentials (`FIRESTORE_PROJECT_ID`, `FIRESTORE_CLIENT_EMAIL`, `FIRESTORE_PRIVATE_KEY`).
- У `backend/src/db/repository.firestore.js` реалізовано read-path для публічних даних:
- `listByType(type, requestedLanguage)` для `releases|artists|events|sponsors`;
- локалізація з fallback `requested -> default` через `translations` і суфіксні поля;
- нормалізація вихідного shape (camelCase), зокрема `releaseType`, `releaseDate`, `ticketLink`, `shortDescription`, `sortOrder`.
- Реалізовано `getPublicSettings(requestedLanguage)`:
- читання `settings` (пріоритетні doc id + fallback `limit(1)`);
- локалізовані поля `title/about/mission`, captcha-повідомлення, `heroSubtitle`.
- Реалізовано `getPublicSectionSettings(requestedLanguage)`:
- читання `section_settings` з підтримкою дефолтних секцій;
- нормалізація title/menuTitle для `uk/en` і формування публічного shape.
- Оновлено `backend/src/routes/health.js`:
- для `DATA_BACKEND=firestore` додано реальний Firestore probe (`_health/ping` read);
- success path: `status=ok`, `backend=firestore`;
- fail path: стабільний `503 DB_UNAVAILABLE` з `details.kind=firestore`.
- У `backend/package.json` додано залежність `firebase-admin`; lock-файл синхронізовано (`backend/package-lock.json`).

## Що покращило/виправило/додало

- `DATA_BACKEND=firestore` отримав перший реальний робочий сценарій: читання публічних сутностей без SQL.
- Збережено API-контракт для фронтенду (shape сумісний із поточним data-adapter/public bootstrap).
- Health-check став операційно корисним для Firestore rollout, бо перевіряє живу доступність backend-сховища, а не просто повертає placeholder.
- Проєкт підготовлено до наступного кроку міграції: реалізації write-path і dual-write parity для admin-flow.
