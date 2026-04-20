## Як було
- Runtime бекенда досі містив активні Postgres/Neon шляхи: SQL-логін в `auth` роуті, Postgres health-check у `health` роуті та адаптер з `postgres/dual` маршрутизацією.
- У backend-конфігах і npm-скриптах залишались Postgres-орієнтовані дефолти та утиліти.
- Через це навіть при намірі працювати на Firestore проєкт лишався змішаним по рантайм-поведінці.

## Що зроблено
- Переведено runtime adapter на Firestore-only у `backend/src/db/repository.adapter.js` (видалено `postgres/dual` читання/запис і shadow-write гілки).
- Прибрано SQL-залежність з `backend/src/routes/auth.js`: логін працює через `ADMIN_PASSWORD` без `pool.query(...)`.
- Переписано `backend/src/routes/health.js` на Firestore-only перевірку, без Postgres `SELECT 1` і без TCP/DNS проб з Postgres target.
- У `backend/src/config.js`:
  - дефолт `DATA_BACKEND` змінено на `firestore`;
  - backend-allowlist обмежено до `firestore`;
  - прибрано Postgres-специфічну валідацію `DATABASE_URL` та production SSL-вимоги для Postgres.
- Оновлено `backend/.env` та `backend/.env.example` під Firestore (`DATA_BACKEND`, `FIRESTORE_PROJECT_ID`, `FIRESTORE_DATABASE_ID`).
- У `backend/package.json` видалено Postgres/Neon-орієнтовані скрипти та `pg` залежність.
- Видалено Neon-утиліту `backend/scripts/cleanup-inline-assets.mjs`.

## Що покращило / виправило / додало
- Backend runtime приведено до Firestore-only моделі без активного використання Neon/Postgres у головному API-потоці.
- Зменшено ризик повернення в змішаний режим через старі дефолти/гілки маршрутизації.
- Спрощено операційну модель підтримки: один backend-профіль для читання/запису/health/auth.
