# 2026-04-09-18 Mutation Rate-Limit And 429 Smoke Hardening

## Як було

- Rate-limit у backend був лише для `POST /auth/login` і `POST /contact-requests`, а admin mutation endpoints залишались без throttling.
- [scripts/smoke-check.mjs](scripts/smoke-check.mjs) не мав контрольованого 429 сценарію для mutation route.
- Локальний/CI gate не підтримував окремий opt-in крок перевірки mutation rate-limit path.

## Що зроблено

- Розширено env-конфіг і fail-fast валідацію в [backend/src/config.js](backend/src/config.js):
  - `COLLECTIONS_RATE_LIMIT_WINDOW_MS`, `COLLECTIONS_RATE_LIMIT_MAX`;
  - `SETTINGS_RATE_LIMIT_WINDOW_MS`, `SETTINGS_RATE_LIMIT_MAX`;
  - `CONTACT_REQUEST_UPDATE_RATE_LIMIT_WINDOW_MS`, `CONTACT_REQUEST_UPDATE_RATE_LIMIT_MAX`.
- Додано mutation rate-limit middleware в роутах:
  - [backend/src/routes/collections.js](backend/src/routes/collections.js): `POST/PUT/DELETE /api/:type`;
  - [backend/src/routes/settings.js](backend/src/routes/settings.js): `PUT /api/settings`, `PUT /api/settings/bundle`, `PUT /api/settings/sections`;
  - [backend/src/routes/contactRequests.js](backend/src/routes/contactRequests.js): `PATCH /api/contact-requests/:id`.
- Розширено [scripts/smoke-check.mjs](scripts/smoke-check.mjs) opt-in перевіркою 429:
  - `CORE64_SMOKE_RATE_LIMIT_CHECK=true` вмикає детермінований сценарій;
  - перевірка виконує серію `PUT /settings/sections` до expected `429`;
  - асерти: `status=429`, `code=SETTINGS_RATE_LIMITED`, наявний `Retry-After`.
- Оновлено orchestration gate:
  - [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1): нові параметри `Core64SmokeRateLimitCheck` і `Core64SmokeRateLimitAttempts`, опційний крок 429 smoke в кінці;
  - [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml): нові `workflow_dispatch` inputs і optional CI step для mutation rate-limit smoke.
- Оновлено приклад env у [backend/.env.example](backend/.env.example) новими mutation rate-limit змінними.

## Що покращило/виправило/додало

- Закрито security-gap: admin mutation маршрути тепер мають базовий захист від burst/update flood.
- Додано детермінований, керований прапорцем 429 smoke path без змін поведінки стандартного smoke-run.
- Local/CI gate отримали однаковий opt-in механізм перевірки mutation throttling, що знижує ризик непомічених регресій у rate-limit політиці.
